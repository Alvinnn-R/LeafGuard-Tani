"""
history.py — Router untuk endpoint riwayat analisis LeafGuard Tani.

Endpoints:
  - GET /history         → Daftar riwayat (dengan pagination, filter per device)
  - GET /history/{id}    → Detail 1 item riwayat lengkap

Ref: api-contracts.md, data-model.md §History
"""

import logging

from fastapi import APIRouter, Header, Query

from models.schemas import ApiError, HistoryDetail, HistoryDetailResponse, HistoryItem, HistoryListResponse
from services.database import get_history, get_history_by_id

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/history", response_model=HistoryListResponse)
async def list_history(
    limit: int = Query(default=20, ge=1, le=50, description="Jumlah item per halaman"),
    offset: int = Query(default=0, ge=0, description="Offset untuk pagination"),
    x_device_id: str | None = Header(None, alias="X-Device-Id", description="Filter riwayat per device"),
):
    """Ambil daftar riwayat analisis, terbaru di atas.

    Jika X-Device-Id header dikirim, hanya riwayat milik device tersebut yang ditampilkan.

    Returns:
        HistoryListResponse: { success, data: HistoryItem[], total, limit, offset }
    """
    try:
        items = get_history(limit=limit, offset=offset, device_id=x_device_id)

        # Cast ke Pydantic model
        history_items = [
            HistoryItem(
                id=str(item.get("id", "")),
                session_id=item.get("session_id", ""),
                mode=item.get("mode", "plant"),
                created_at=str(item.get("created_at", "")),
                plant_url=item.get("plant_url"),
                label_url=item.get("label_url"),
                disease_name=item.get("disease_name"),
                urgency=item.get("urgency"),
                product_name=item.get("product_name"),
            )
            for item in items
        ]

        return HistoryListResponse(
            success=True,
            data=history_items,
            total=len(history_items),
            limit=limit,
            offset=offset,
        )

    except Exception as e:
        logger.error(f"GET /history error: {e}")
        return HistoryListResponse(
            success=True,
            data=[],
            total=0,
            limit=limit,
            offset=offset,
        )


@router.get("/history/{history_id}", response_model=HistoryDetailResponse)
async def get_history_detail(history_id: str):
    """Ambil detail lengkap 1 item riwayat berdasarkan ID.

    Args:
        history_id: UUID string dari item riwayat.

    Returns:
        HistoryDetailResponse: { success, data: HistoryDetail } atau { success: false, error }
    """
    try:
        item = get_history_by_id(history_id)

        if item is None:
            return HistoryDetailResponse(
                success=False,
                data=None,
                error=ApiError(
                    code="NOT_FOUND",
                    message="Riwayat analisis tidak ditemukan.",
                    retryable=False,
                ),
            )

        detail = HistoryDetail(
            id=str(item.get("id", "")),
            session_id=item.get("session_id", ""),
            mode=item.get("mode", "plant"),
            created_at=str(item.get("created_at", "")),
            plant_url=item.get("plant_url"),
            label_url=item.get("label_url"),
            disease_name=item.get("disease_name"),
            urgency=item.get("urgency"),
            product_name=item.get("product_name"),
            result=item.get("result"),
        )

        return HistoryDetailResponse(success=True, data=detail, error=None)

    except Exception as e:
        logger.error(f"GET /history/{history_id} error: {e}")
        return HistoryDetailResponse(
            success=False,
            data=None,
            error=ApiError(
                code="AI_ERROR",
                message="Gagal mengambil detail riwayat. Silakan coba lagi.",
                retryable=True,
            ),
        )
