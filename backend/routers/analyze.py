"""
analyze.py — Router untuk endpoint analisis LeafGuard Tani.

Endpoints:
  - GET  /health   → Health check (Cloud Run liveness probe)
  - POST /analyze  → Analisis foto tanaman/label via Gemini AI

Ref: api-contracts.md v1.0.0
"""

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, UploadFile

from models.schemas import AnalysisMode, ApiError, ApiResponse
from services.gemini import GeminiError, analyze_image
from services.storage import upload_image_async
from utils.image import ImageValidationError, validate_image

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check untuk Cloud Run liveness probe.

    Returns:
        { status, version, timestamp }
    """
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/analyze", response_model=ApiResponse)
async def analyze(
    mode: str = Form(..., description='Mode analisis: "plant" | "label" | "both"'),
    plant_image: UploadFile | None = File(None, description="Foto tanaman padi"),
    label_image: UploadFile | None = File(None, description="Foto label produk"),
):
    """Analisis foto tanaman padi dan/atau label produk pertanian.

    Request: multipart/form-data
        - mode (str): "plant" | "label" | "both"
        - plant_image (File): Required jika mode = "plant" | "both"
        - label_image (File): Required jika mode = "label" | "both"

    Returns:
        ApiResponse: { success: true, data: AnalysisResult } atau
                     { success: false, error: ApiError }
    """

    # === 1. Validasi mode ===
    valid_modes = {m.value for m in AnalysisMode}
    if mode not in valid_modes:
        return ApiResponse(
            success=False,
            data=None,
            error=ApiError(
                code="VALIDATION_ERROR",
                message="Mode analisis tidak valid. Gunakan 'plant', 'label', atau 'both'.",
                retryable=False,
            ),
        )

    # === 2. Validasi ketersediaan foto berdasarkan mode ===
    if mode in ("plant", "both") and (plant_image is None or plant_image.filename == ""):
        return ApiResponse(
            success=False,
            data=None,
            error=ApiError(
                code="VALIDATION_ERROR",
                message="Foto tanaman diperlukan untuk mode analisis ini.",
                retryable=False,
            ),
        )

    if mode in ("label", "both") and (label_image is None or label_image.filename == ""):
        return ApiResponse(
            success=False,
            data=None,
            error=ApiError(
                code="VALIDATION_ERROR",
                message="Foto label produk diperlukan untuk mode analisis ini.",
                retryable=False,
            ),
        )

    # === 3. Validasi gambar (MIME type + ukuran) ===
    plant_bytes = None
    plant_mime = None
    label_bytes = None
    label_mime = None

    try:
        if mode in ("plant", "both") and plant_image:
            plant_mime = plant_image.content_type
            plant_bytes = await validate_image(plant_image)

        if mode in ("label", "both") and label_image:
            label_mime = label_image.content_type
            label_bytes = await validate_image(label_image)

    except ImageValidationError as e:
        status_code_map = {
            "INVALID_FORMAT": 422,
            "FILE_TOO_LARGE": 413,
        }
        return ApiResponse(
            success=False,
            data=None,
            error=ApiError(
                code=e.code,
                message=e.message,
                retryable=True,
            ),
        )

    # === 4. Panggil Gemini AI ===
    try:
        result = await analyze_image(
            mode=mode,
            plant_bytes=plant_bytes,
            plant_mime=plant_mime,
            label_bytes=label_bytes,
            label_mime=label_mime,
        )
    except GeminiError as e:
        return ApiResponse(
            success=False,
            data=None,
            error=ApiError(
                code=e.code,
                message=e.message,
                retryable=e.code != "INVALID_IMAGE",
            ),
        )

    # === 5. Fire-and-forget storage upload (non-blocking) ===
    if plant_bytes:
        asyncio.create_task(
            upload_image_async(plant_bytes, mode, image_type="plant")
        )
    if label_bytes:
        asyncio.create_task(
            upload_image_async(label_bytes, mode, image_type="label")
        )

    # === 6. Return success response ===
    logger.info(
        f"Analysis completed — mode: {mode}, "
        f"processing_time: {result.processing_time_ms}ms"
    )

    return ApiResponse(
        success=True,
        data=result,
        error=None,
    )
