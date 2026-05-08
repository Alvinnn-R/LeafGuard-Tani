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
    MODEL_CHAIN,
    PREVALIDATION_CONFIG,
    get_prevalidation_prompt,
    get_system_prompt,
)

logger = logging.getLogger(__name__)


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
# Client (lazy init — dibuat setelah load_dotenv di main.py)
# ============================================================

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    """Ambil atau buat Gemini client (lazy init).

    Raises:
        GeminiError: Jika GEMINI_API_KEY tidak di-set.
    """
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise GeminiError(
                code="AI_ERROR",
                message="Konfigurasi AI belum lengkap. Hubungi administrator.",
            )
        _client = genai.Client(api_key=api_key)
    return _client


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
    "not found",           # model tidak tersedia
    "not supported",       # model tidak support generateContent
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
# Gemini API Call with Model Fallback
# ============================================================

async def _call_gemini_with_fallback(
    system_prompt: str,
    content_parts: list,
) -> str:
    """Panggil Gemini API dengan model fallback chain.

    Mencoba setiap model dalam MODEL_CHAIN secara berurutan.
    Jika model gagal karena rate limit, 404, atau error server,
    otomatis pindah ke model berikutnya.

    Returns:
        Raw text response dari Gemini (harus JSON).

    Raises:
        GeminiError: Jika semua model gagal.
    """
    gemini_client = _get_client()

    gen_config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=GENERATION_CONFIG["temperature"],
        top_p=GENERATION_CONFIG["top_p"],
        max_output_tokens=GENERATION_CONFIG["max_output_tokens"],
        response_mime_type=GENERATION_CONFIG["response_mime_type"],
    )

    last_error = None

    for model_name in MODEL_CHAIN:
        try:
            logger.info(f"Trying model: {model_name}")

            response = await gemini_client.aio.models.generate_content(
                model=model_name,
                contents=content_parts,
                config=gen_config,
            )

            response_text = response.text
            if response_text:
                logger.info(f"Success with model: {model_name}")
                return response_text

            # Response kosong — coba model berikutnya
            logger.warning(f"Empty response from {model_name}, trying next model...")
            continue

        except GeminiError:
            raise
        except Exception as e:
            last_error = e
            if _is_retryable_error(e):
                logger.warning(f"Model {model_name} failed (retryable): {e}")
                continue
            else:
                # Non-retryable error — langsung gagal
                logger.error(f"Model {model_name} failed (non-retryable): {e}")
                raise GeminiError(
                    code="AI_ERROR",
                    message="Terjadi kesalahan saat menganalisis foto. Silakan coba lagi.",
                )

    # Semua model gagal
    logger.error(f"All models in chain failed. Last error: {last_error}")
    raise GeminiError(
        code="RATE_LIMITED",
        message="Layanan AI sedang sibuk. Silakan tunggu beberapa saat dan coba lagi.",
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
    gemini_client = _get_client()
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

    # Coba hanya model utama (tercepat) untuk pre-validation
    # Tidak perlu fallback chain — ini hanya skrining awal
    for model_name in MODEL_CHAIN[:3]:  # Coba max 3 model saja
        try:
            logger.info(f"Pre-validation with model: {model_name}")
            response = await gemini_client.aio.models.generate_content(
                model=model_name,
                contents=content_parts,
                config=gen_config,
            )

            if not response.text:
                continue

            result = json.loads(response.text)
            is_valid = result.get("valid", True)  # Default True agar tidak false-reject
            logger.info(f"Pre-validation result: valid={is_valid} (model: {model_name})")
            return is_valid

        except Exception as e:
            logger.warning(f"Pre-validation failed with {model_name}: {e}")
            if _is_retryable_error(e):
                continue
            # Non-retryable: skip pre-validation, lanjut ke analysis
            logger.warning("Pre-validation skipped due to non-retryable error")
            return True  # Anggap valid, biar full analysis yang putuskan

    # Jika semua model pre-validation gagal, skip saja
    logger.warning("All pre-validation models failed, skipping pre-validation")
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

    system_prompt = get_system_prompt(mode)
    content_parts = _build_content_parts(
        mode, plant_bytes, plant_mime, label_bytes, label_mime
    )

    # === Step 0: Pre-validation — skrining cepat gambar ===
    # Tolak gambar non-padi/non-label SEBELUM menjalankan prompt berat
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

    # === Step 1: Panggil Gemini API dengan fallback ===
    response_text = await _call_gemini_with_fallback(system_prompt, content_parts)

    # === Step 2: Parse JSON response ===
    try:
        result_data = json.loads(response_text)
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to parse Gemini JSON response: {e}")
        logger.debug(f"Raw response: {response_text[:500]}")
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
