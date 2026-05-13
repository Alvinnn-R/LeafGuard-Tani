"""
gemini.py — Wrapper untuk Gemini multimodal API calls dengan model fallback.

Tanggung jawab:
  - Inisialisasi Gemini client (google-genai SDK)
  - Model fallback chain (jika model utama gagal, coba model berikutnya)
  - Kirim request multimodal (teks + gambar)
  - Parse JSON response
  - Validasi terhadap Pydantic schema
  - Error handling pipeline sesuai prompts.md §Error Handling

Ref: prompts.md v1.0.0, data-model.md v1.0.0, Buku Saku BBPOPT 2020
"""

import json
import logging
import os
import re
import time

from google import genai
from google.genai import types

from models.schemas import (
    AnalysisResult,
    DiagnosisResult,
    LabelInfo,
    RecommendationCard,
)
from prompts.system import (
    DISCLAIMER,
    GENERATION_CONFIG,
    GEMINI_MODEL,
    MODEL_CHAIN,
    PREVALIDATION_CONFIG,
    SKIP_PREVALIDATION,
    get_prevalidation_prompt,
    get_system_prompt,
)

logger = logging.getLogger(__name__)


# ============================================================
# JSON Cleaner — handle Gemini quirks
# ============================================================

def _clean_json_response(text: str) -> str:
    """Bersihkan response Gemini agar bisa di-parse json.loads().

    Gemini 2.5 Flash sering mengembalikan JSON yang tidak standar:
    - Dibungkus markdown: ```json ... ```
    - Trailing comma: {"key": "val",}
    - Newline literal tidak di-escape di dalam string value
    - Teks tambahan sebelum atau sesudah JSON
    """
    if not text:
        return text

    text = text.strip()

    # 1. Strip markdown code block: ```json ... ``` atau ``` ... ```
    if text.startswith('```'):
        lines = text.split('\n')
        lines = lines[1:]  # hapus baris ```json
        if lines and lines[-1].strip().startswith('```'):
            lines = lines[:-1]  # hapus baris penutup ```
        text = '\n'.join(lines).strip()

    # 2. Cari posisi awal JSON object/array
    start = -1
    for i, ch in enumerate(text):
        if ch in ('{', '['):
            start = i
            break
    if start > 0:
        text = text[start:]

    # 3. Hapus trailing comma sebelum } atau ] — common Gemini bug
    text = re.sub(r',\s*([}\]])', r'\1', text)

    return text.strip()


# ============================================================
# Exception
# ============================================================

class GeminiError(Exception):
    """Custom exception untuk error dari Gemini API.

    Attributes:
        code: Error code yang akan di-map ke ApiError.code
        message: Pesan error dalam Bahasa Indonesia
    """

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


# ============================================================
# Client Pool — Multi API Key Rotation
# ============================================================
# Setiap API key dari project GCP berbeda punya kuota terpisah.
# Format .env:
#   GEMINI_API_KEY=key_utama
#   GEMINI_API_KEY_2=key_cadangan_1
#   GEMINI_API_KEY_3=key_cadangan_2

_clients: list[genai.Client] = []


def _init_clients() -> list[genai.Client]:
    """Inisialisasi semua Gemini client dari env vars.

    Membaca:
      - GEMINI_API_KEY     (wajib, key utama)
      - GEMINI_API_KEY_2   (opsional)
      - GEMINI_API_KEY_3   (opsional)
      - ... sampai GEMINI_API_KEY_10

    Raises:
        GeminiError: Jika GEMINI_API_KEY tidak di-set.
    """
    global _clients
    if _clients:
        return _clients

    keys = []

    # Key utama (wajib)
    primary = os.getenv("GEMINI_API_KEY", "").strip()
    if not primary:
        raise GeminiError(
            code="AI_ERROR",
            message="Konfigurasi AI belum lengkap. Hubungi administrator.",
        )
    keys.append(primary)

    # Key tambahan (opsional): GEMINI_API_KEY_2, _3, ... _10
    for i in range(2, 11):
        extra = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
        if extra:
            keys.append(extra)

    _clients = [genai.Client(api_key=k) for k in keys]
    logger.info(f"Initialized {len(_clients)} Gemini API key(s) for rotation")
    return _clients


# ============================================================
# Error Classification — menentukan apakah error bisa di-retry
# ============================================================

# Error codes dari Google API yang menandakan model gagal / rate limited
_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
_RETRYABLE_ERROR_STRINGS = [
    "rate limit",
    "quota",
    "resource exhausted",
    "overloaded",
    "unavailable",
    "internal",
    "deadline exceeded",
    "not found",           # model tidak tersedia di region/tier → coba model berikutnya
    "not supported",       # model tidak support generateContent → coba model berikutnya
    "404",                 # HTTP 404 model tidak ada → coba model berikutnya
    "permission",          # model tidak diakses tier ini → coba model berikutnya
]


def _is_retryable_error(error: Exception) -> bool:
    """Cek apakah error dari Gemini bisa di-retry dengan model lain."""
    error_str = str(error).lower()
    return any(s in error_str for s in _RETRYABLE_ERROR_STRINGS)


# ============================================================
# Content Builder
# ============================================================

def _build_content_parts(
    mode: str,
    plant_bytes: bytes | None,
    plant_mime: str | None,
    label_bytes: bytes | None,
    label_mime: str | None,
) -> list:
    """Bangun content parts untuk request multimodal Gemini."""
    parts = []

    if mode in ("plant", "both") and plant_bytes:
        parts.append(
            types.Part.from_bytes(
                data=plant_bytes,
                mime_type=plant_mime or "image/jpeg",
            )
        )
        parts.append("Foto di atas adalah foto tanaman padi untuk dianalisis.")

    if mode in ("label", "both") and label_bytes:
        parts.append(
            types.Part.from_bytes(
                data=label_bytes,
                mime_type=label_mime or "image/jpeg",
            )
        )
        parts.append("Foto di atas adalah foto label produk pertanian untuk dibaca dan diinterpretasi.")

    if mode == "both":
        parts.append(
            "Analisis kedua foto di atas dan berikan diagnosis tanaman, "
            "informasi label, serta rekomendasi penanganan terpadu dalam satu JSON."
        )
    elif mode == "plant":
        parts.append("Analisis foto tanaman padi di atas dan berikan diagnosis dalam format JSON.")
    elif mode == "label":
        parts.append("Baca dan interpretasi label produk pertanian di atas dalam format JSON.")

    return parts


# ============================================================
# Response Parsers
# ============================================================

def _parse_plant_result(data: dict, processing_time_ms: int) -> AnalysisResult:
    """Parse response Gemini mode plant ke AnalysisResult."""
    data["disclaimer"] = DISCLAIMER
    diagnosis = DiagnosisResult(**data)

    return AnalysisResult(
        diagnosis=diagnosis,
        label_info=None,
        recommendation=None,
        processing_time_ms=processing_time_ms,
    )


def _parse_label_result(data: dict, processing_time_ms: int) -> AnalysisResult:
    """Parse response Gemini mode label ke AnalysisResult."""
    label_info = LabelInfo(**data)

    return AnalysisResult(
        diagnosis=None,
        label_info=label_info,
        recommendation=None,
        processing_time_ms=processing_time_ms,
    )


def _parse_both_result(data: dict, processing_time_ms: int) -> AnalysisResult:
    """Parse response Gemini mode both ke AnalysisResult."""
    if "diagnosis" in data and data["diagnosis"]:
        data["diagnosis"]["disclaimer"] = DISCLAIMER

    diagnosis = (
        DiagnosisResult(**data["diagnosis"])
        if data.get("diagnosis")
        else None
    )
    label_info = (
        LabelInfo(**data["label_info"])
        if data.get("label_info")
        else None
    )
    recommendation = (
        RecommendationCard(**data["recommendation"])
        if data.get("recommendation")
        else None
    )

    return AnalysisResult(
        diagnosis=diagnosis,
        label_info=label_info,
        recommendation=recommendation,
        processing_time_ms=processing_time_ms,
    )


# ============================================================
# Gemini API Call with Multi-Model + Multi-Key Fallback
# ============================================================

async def _call_gemini_with_fallback(
    system_prompt: str,
    content_parts: list,
) -> str:
    """Panggil Gemini API dengan gabungan multi-model + multi-key rotation.

    Strategi 2 lapis:
      Lapis 1 (outer loop): Rotasi API key
        → Setiap key dari project GCP berbeda punya kuota terpisah.
      Lapis 2 (inner loop): Rotasi model
        → Jika model pertama kena 429, coba model berikutnya.

    Flow contoh (2 key, 3 model):
      Key1+Model1 → Key1+Model2 → Key1+Model3 →
      Key2+Model1 → Key2+Model2 → Key2+Model3 → gagal

    Returns:
        Raw text response dari Gemini (harus JSON).

    Raises:
        GeminiError: Jika semua kombinasi key+model gagal.
    """
    clients = _init_clients()

    gen_config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=GENERATION_CONFIG["temperature"],
        top_p=GENERATION_CONFIG["top_p"],
        max_output_tokens=GENERATION_CONFIG["max_output_tokens"],
        response_mime_type=GENERATION_CONFIG["response_mime_type"],
    )

    last_error = None
    total_attempts = 0

    for key_idx, client in enumerate(clients):
        key_label = f"key-{key_idx+1}/{len(clients)}"

        for model_name in MODEL_CHAIN:
            total_attempts += 1
            combo = f"{model_name} ({key_label})"
            try:
                logger.info(f"Trying {combo}")

                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=content_parts,
                    config=gen_config,
                )

                response_text = response.text
                if response_text:
                    logger.info(f"✅ Success with {combo}")
                    return response_text

                # Response kosong — coba model/key berikutnya
                logger.warning(f"Empty response from {combo}, trying next...")
                continue

            except GeminiError:
                raise
            except Exception as e:
                last_error = e
                if _is_retryable_error(e):
                    logger.warning(f"⚠️ {combo} failed (retryable): {e}")
                    continue
                else:
                    # Non-retryable error — langsung gagal
                    logger.error(f"❌ {combo} failed (non-retryable): {e}")
                    raise GeminiError(
                        code="AI_ERROR",
                        message="Terjadi kesalahan saat menganalisis foto. Silakan coba lagi.",
                    )

    # Semua kombinasi key+model gagal
    logger.error(
        f"All combinations exhausted ({total_attempts} attempts, "
        f"{len(clients)} keys × {len(MODEL_CHAIN)} models). "
        f"Last error: {last_error}"
    )
    raise GeminiError(
        code="RATE_LIMITED",
        message="Kuota analisis hari ini sudah habis. Silakan coba lagi besok atau hubungi administrator.",
    )


# ============================================================
# Pre-validation — Skrining cepat sebelum analisis berat
# ============================================================

async def _prevalidate_image(
    image_bytes: bytes,
    image_mime: str,
    image_type: str,  # "plant" atau "label"
) -> bool:
    """Skrining cepat apakah gambar valid (tanaman padi / label produk).

    Menggunakan prompt ringan dan max_output_tokens kecil (128)
    supaya respons sangat cepat (~1-2 detik vs 10+ detik full analysis).

    Returns:
        True jika gambar valid, False jika bukan.
    """
    gemini_client = _init_clients()[0]  # Pakai key pertama untuk pre-validation
    prevalidation_prompt = get_prevalidation_prompt(image_type)

    gen_config = types.GenerateContentConfig(
        system_instruction=prevalidation_prompt,
        temperature=PREVALIDATION_CONFIG["temperature"],
        top_p=PREVALIDATION_CONFIG["top_p"],
        max_output_tokens=PREVALIDATION_CONFIG["max_output_tokens"],
        response_mime_type=PREVALIDATION_CONFIG["response_mime_type"],
    )

    content_parts = [
        types.Part.from_bytes(data=image_bytes, mime_type=image_mime),
        "Apakah ini foto yang valid? Jawab dalam JSON.",
    ]

    try:
        model_name = GEMINI_MODEL
        logger.info(f"Pre-validation ({image_type}) with model: {model_name}")

        response = await gemini_client.aio.models.generate_content(
            model=model_name,
            contents=content_parts,
            config=gen_config,
        )

        if not response.text:
            logger.warning("Pre-validation returned empty response, skipping")
            return True  # Anggap valid

        result = json.loads(response.text)
        is_valid = result.get("valid", True)  # Default True agar tidak false-reject
        logger.info(f"Pre-validation result ({image_type}): valid={is_valid}")
        return is_valid

    except Exception as e:
        # Jika pre-validation gagal, skip saja — biar full analysis yang putuskan
        logger.warning(f"Pre-validation failed ({image_type}): {e}, skipping")
        return True  # Anggap valid agar tidak memblokir user


# ============================================================
# Main Analysis Function
# ============================================================

async def analyze_image(
    mode: str,
    plant_bytes: bytes | None = None,
    plant_mime: str | None = None,
    label_bytes: bytes | None = None,
    label_mime: str | None = None,
) -> AnalysisResult:
    """Analisis foto tanaman/label menggunakan Gemini multimodal.

    Pipeline:
        0. Pre-validation — skrining cepat gambar (ringan, ~1-2 detik)
        1. Panggil Gemini API (dengan model fallback) → raw JSON text
        2. Parse JSON response
        3. Cek field "error" di response → INVALID_IMAGE
        4. Validasi schema Pydantic → AnalysisResult

    Returns:
        AnalysisResult yang sudah divalidasi.

    Raises:
        GeminiError: Jika terjadi error pada tahap manapun.
    """
    start_time = time.time()

    # === Step 0: Pre-validation — skrining cepat gambar ===
    # Dilewati jika SKIP_PREVALIDATION=True (hemat quota free tier)
    if not SKIP_PREVALIDATION:
        if mode in ("plant", "both") and plant_bytes:
            is_valid_plant = await _prevalidate_image(
                plant_bytes, plant_mime or "image/jpeg", "plant"
            )
            if not is_valid_plant:
                logger.info("Pre-validation rejected plant image (not rice plant)")
                raise GeminiError(
                    code="INVALID_IMAGE",
                    message="Unggah foto daun, batang, atau malai tanaman padi yang cukup jelas dan terang.",
                )

        if mode in ("label", "both") and label_bytes:
            is_valid_label = await _prevalidate_image(
                label_bytes, label_mime or "image/jpeg", "label"
            )
            if not is_valid_label:
                logger.info("Pre-validation rejected label image (not agricultural label)")
                raise GeminiError(
                    code="INVALID_IMAGE",
                    message="Unggah foto label kemasan pestisida atau pupuk pertanian.",
                )
    else:
        logger.info("Pre-validation skipped (SKIP_PREVALIDATION=True, hemat quota)")

    system_prompt = get_system_prompt(mode)
    content_parts = _build_content_parts(
        mode, plant_bytes, plant_mime, label_bytes, label_mime
    )

    # === Step 1: Panggil Gemini API dengan fallback ===
    response_text = await _call_gemini_with_fallback(system_prompt, content_parts)

    # === Step 2: Parse JSON response ===
    # Gemini 2.5 Flash sering return JSON tidak valid (trailing commas,
    # unescaped newlines, unicode quotes, dll).
    # Gunakan json_repair sebagai solusi universal untuk malformed LLM JSON.
    cleaned = _clean_json_response(response_text)
    result_data = None

    # Strategi 1: strict JSON standar (paling cepat)
    try:
        result_data = json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategi 2: json_repair — fix semua quirks LLM JSON secara otomatis
    if result_data is None:
        try:
            from json_repair import repair_json
            repaired = repair_json(cleaned, return_objects=True)
            if isinstance(repaired, dict) and repaired:
                result_data = repaired
                logger.warning("JSON parsed via json_repair (Gemini returned malformed JSON)")
            elif isinstance(repaired, str) and repaired.strip() not in ('', '{}', '""'):
                result_data = json.loads(repaired)
                logger.warning("JSON parsed via json_repair string output")
        except Exception as repair_err:
            logger.error(f"json_repair also failed: {repair_err}")

    if result_data is None:
        logger.error(f"All JSON parse strategies failed")
        logger.error(f"Raw response: {repr(response_text[:1000])}")
        raise GeminiError(
            code="AI_ERROR",
            message="Terjadi kesalahan saat menganalisis foto. Silakan coba lagi.",
        )


    # === Step 3: Cek apakah Gemini mengembalikan error (INVALID_IMAGE) ===
    if "error" in result_data:
        error_info = result_data["error"]
        raise GeminiError(
            code=error_info.get("code", "INVALID_IMAGE"),
            message=error_info.get(
                "message",
                "Foto tidak dapat dianalisis. Pastikan foto menampilkan tanaman padi atau label produk pertanian.",
            ),
        )

    processing_time_ms = int((time.time() - start_time) * 1000)

    # === Step 4: Validasi schema dan bangun AnalysisResult ===
    try:
        if mode == "plant":
            return _parse_plant_result(result_data, processing_time_ms)
        elif mode == "label":
            return _parse_label_result(result_data, processing_time_ms)
        elif mode == "both":
            return _parse_both_result(result_data, processing_time_ms)
        else:
            raise GeminiError(
                code="AI_ERROR",
                message="Mode analisis tidak valid.",
            )
    except GeminiError:
        raise
    except Exception as e:
        logger.error(f"Schema validation failed: {e}")
        logger.debug(f"Result data: {json.dumps(result_data, ensure_ascii=False)[:1000]}")
        raise GeminiError(
            code="AI_ERROR",
            message="Terjadi kesalahan saat memproses hasil analisis. Silakan coba lagi.",
        )
