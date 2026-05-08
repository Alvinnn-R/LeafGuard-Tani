"""
gemini.py — Wrapper untuk Gemini 1.5 Flash multimodal API calls.

Tanggung jawab:
  - Inisialisasi Gemini client (google-genai SDK)
  - Kirim request multimodal (teks + gambar)
  - Parse JSON response
  - Validasi terhadap Pydantic schema
  - Error handling pipeline sesuai prompts.md §Error Handling

Ref: prompts.md v1.0.0, data-model.md v1.0.0
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
    GEMINI_MODEL,
    GENERATION_CONFIG,
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
# Content Builder
# ============================================================

def _build_content_parts(
    mode: str,
    plant_bytes: bytes | None,
    plant_mime: str | None,
    label_bytes: bytes | None,
    label_mime: str | None,
) -> list:
    """Bangun content parts untuk request multimodal Gemini.

    Args:
        mode: "plant" | "label" | "both"
        plant_bytes: Raw bytes foto tanaman
        plant_mime: MIME type foto tanaman
        label_bytes: Raw bytes foto label
        label_mime: MIME type foto label

    Returns:
        List of content parts (gambar inline + teks instruksi)
    """
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
    # Force hardcoded disclaimer — tidak boleh dari AI
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
    # Force hardcoded disclaimer
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

    Pipeline validasi (sesuai prompts.md §Error Handling):
        1. Panggil Gemini API → GeminiError(AI_ERROR)
        2. Parse JSON response → GeminiError(AI_ERROR)
        3. Cek field "error" di response → GeminiError(INVALID_IMAGE)
        4. Validasi schema Pydantic → GeminiError(AI_ERROR)

    Args:
        mode: "plant" | "label" | "both"
        plant_bytes: Raw bytes foto tanaman (required jika mode = plant|both)
        plant_mime: MIME type foto tanaman
        label_bytes: Raw bytes foto label (required jika mode = label|both)
        label_mime: MIME type foto label

    Returns:
        AnalysisResult yang sudah divalidasi.

    Raises:
        GeminiError: Jika terjadi error pada tahap manapun.
    """
    start_time = time.time()

    # Bangun system prompt dan content parts
    system_prompt = get_system_prompt(mode)
    content_parts = _build_content_parts(
        mode, plant_bytes, plant_mime, label_bytes, label_mime
    )

    # Konfigurasi generate
    gen_config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=GENERATION_CONFIG["temperature"],
        top_p=GENERATION_CONFIG["top_p"],
        max_output_tokens=GENERATION_CONFIG["max_output_tokens"],
        response_mime_type=GENERATION_CONFIG["response_mime_type"],
    )

    # === Step 1: Panggil Gemini API ===
    try:
        gemini_client = _get_client()
        response = await gemini_client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=content_parts,
            config=gen_config,
        )
    except GeminiError:
        raise
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        raise GeminiError(
            code="AI_ERROR",
            message="Terjadi kesalahan saat menganalisis foto. Silakan coba lagi.",
        )

    # === Step 2: Parse JSON response ===
    try:
        response_text = response.text
        result_data = json.loads(response_text)
    except (json.JSONDecodeError, ValueError, AttributeError) as e:
        logger.error(f"Failed to parse Gemini JSON response: {e}")
        logger.debug(f"Raw response: {getattr(response, 'text', 'N/A')}")
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

    # Hitung processing time
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
        logger.debug(f"Result data: {result_data}")
        raise GeminiError(
            code="AI_ERROR",
            message="Terjadi kesalahan saat memproses hasil analisis. Silakan coba lagi.",
        )
