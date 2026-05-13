"""
analyze.py — Router untuk endpoint analisis LeafGuard Tani.

Endpoints:
  - GET  /health   → Health check (Cloud Run liveness probe)
  - POST /analyze  → Analisis foto tanaman/label via Gemini AI

Ref: api-contracts.md v1.0.0
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, Header, UploadFile

from models.schemas import AnalysisMode, ApiError, ApiResponse
from services.database import save_history_async
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
    x_device_id: str | None = Header(None, alias="X-Device-Id", description="Anonymous device identifier"),
):
    """Analisis foto tanaman padi dan/atau label produk pertanian.

    Request: multipart/form-data
        - mode (str): "plant" | "label" | "both"
        - plant_image (File): Required jika mode = "plant" | "both"
        - label_image (File): Required jika mode = "label" | "both"
        - X-Device-Id (Header): Anonymous device identifier untuk riwayat per-device

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

    # === 5. Generate session_id untuk storage + history ===
    session_id = uuid.uuid4().hex[:16]

    # === 6. Fire-and-forget: upload foto + simpan history ===
    # Penting: kita harus TUNGGU upload foto selesai baru simpan ke DB,
    # agar plant_url & label_url tersimpan dengan benar.
    # Tapi ini semua tetap fire-and-forget (tidak blocking response ke user).
    device_id = x_device_id or None
    result_dict = result.model_dump(mode="json")

    asyncio.create_task(
        _upload_and_save(
            session_id=session_id,
            mode=mode,
            device_id=device_id,
            result_dict=result_dict,
            plant_bytes=plant_bytes,
            label_bytes=label_bytes,
        )
    )

    # === 7. Return success response ===
    logger.info(
        f"Analysis completed — mode: {mode}, session: {session_id}, "
        f"device: {device_id or 'unknown'}, "
        f"processing_time: {result.processing_time_ms}ms"
    )

    return ApiResponse(
        success=True,
        data=result,
        error=None,
    )


async def _upload_and_save(
    session_id: str,
    mode: str,
    device_id: str | None,
    result_dict: dict,
    plant_bytes: bytes | None,
    label_bytes: bytes | None,
):
    """Upload foto ke Supabase Storage, lalu simpan history dengan URL foto.

    Fungsi ini berjalan sebagai background task (fire-and-forget),
    sehingga tidak memblokir response ke user.
    """
    plant_url = None
    label_url = None

    try:
        # Upload foto paralel
        tasks = []
        if plant_bytes:
            tasks.append(("plant", upload_image_async(plant_bytes, mode, image_type="plant", session_id=session_id)))
        if label_bytes:
            tasks.append(("label", upload_image_async(label_bytes, mode, image_type="label", session_id=session_id)))

        if tasks:
            results = await asyncio.gather(*[t[1] for t in tasks], return_exceptions=True)
            for i, (img_type, _) in enumerate(tasks):
                url = results[i] if not isinstance(results[i], Exception) else None
                if img_type == "plant":
                    plant_url = url
                else:
                    label_url = url

        # Simpan ke database SETELAH upload selesai (URL sudah tersedia)
        await save_history_async(
            session_id=session_id,
            mode=mode,
            device_id=device_id,
            result=result_dict,
            plant_url=plant_url,
            label_url=label_url,
        )

    except Exception as e:
        logger.error(f"[BACKGROUND] _upload_and_save failed for session {session_id}: {e}")
