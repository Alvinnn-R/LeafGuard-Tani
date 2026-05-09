"""
database.py — Supabase Database service untuk menyimpan & mengambil riwayat analisis.

Operasi:
  - save_history_async: Insert sesi analisis ke tabel history (fire-and-forget)
  - get_history: Ambil daftar riwayat (dengan pagination, filter per device)
  - get_history_by_id: Ambil 1 item riwayat berdasarkan ID

PENTING: save_history_async dipanggil via asyncio.create_task — tidak blocking response.
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

_supabase_client = None
TABLE_NAME = "history"


def _get_client():
    """Return Supabase client, buat jika belum ada (lazy init)."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        logger.warning("Supabase credentials not configured — database operations disabled.")
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client for DB: {e}")
        return None


async def save_history_async(
    session_id: str,
    mode: str,
    result: dict,
    device_id: Optional[str] = None,
    plant_url: Optional[str] = None,
    label_url: Optional[str] = None,
) -> bool:
    """Simpan sesi analisis ke tabel history di Supabase Database.

    Dipanggil via asyncio.create_task() — tidak blocking response.

    Args:
        session_id: UUID string sesi analisis.
        mode: Mode analisis ("plant" | "label" | "both").
        result: Dict hasil AnalysisResult dari Gemini.
        device_id: Anonymous device ID untuk riwayat per-device.
        plant_url: URL publik foto tanaman di Supabase Storage.
        label_url: URL publik foto label di Supabase Storage.

    Returns:
        True jika berhasil, False jika gagal.
    """
    try:
        client = _get_client()
        if client is None:
            logger.warning("[DB] Supabase not configured — skip save history.")
            return False

        # Ekstrak field denormalized untuk query cepat di frontend
        disease_name = None
        urgency = None
        product_name = None

        if result.get("diagnosis"):
            disease_name = result["diagnosis"].get("disease_name")
            urgency = result["diagnosis"].get("urgency")

        if result.get("label_info"):
            product_name = result["label_info"].get("product_name")

        row = {
            "session_id": session_id,
            "mode": mode,
            "device_id": device_id,
            "plant_url": plant_url,
            "label_url": label_url,
            "result": result,
            "disease_name": disease_name,
            "urgency": urgency,
            "product_name": product_name,
        }

        client.table(TABLE_NAME).insert(row).execute()
        logger.info(
            f"[DB] History saved — session: {session_id}, mode: {mode}, "
            f"device: {device_id or 'none'}, "
            f"plant_url: {'yes' if plant_url else 'no'}, "
            f"label_url: {'yes' if label_url else 'no'}"
        )
        return True

    except Exception as e:
        logger.error(f"[DB] save_history_async failed (non-blocking): {e}")
        return False


def get_history(
    limit: int = 20,
    offset: int = 0,
    device_id: Optional[str] = None,
) -> list[dict]:
    """Ambil daftar riwayat analisis dari Supabase Database.

    Args:
        limit: Jumlah item per halaman (default 20, maks 50).
        offset: Offset untuk pagination.
        device_id: Jika diberikan, filter riwayat hanya untuk device ini.

    Returns:
        List of history items, terbaru di depan. Empty list jika gagal.
    """
    try:
        client = _get_client()
        if client is None:
            logger.warning("[DB] Supabase not configured — returning empty history.")
            return []

        limit = min(limit, 50)  # Batasi maksimal 50 per request

        query = (
            client.table(TABLE_NAME)
            .select(
                "id, session_id, mode, created_at, "
                "plant_url, label_url, disease_name, urgency, product_name"
            )
        )

        # Filter per device jika device_id diberikan
        if device_id:
            query = query.eq("device_id", device_id)

        response = (
            query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        return response.data or []

    except Exception as e:
        logger.error(f"[DB] get_history failed: {e}")
        return []


def get_history_by_id(history_id: str) -> Optional[dict]:
    """Ambil 1 item riwayat lengkap berdasarkan ID.

    Args:
        history_id: UUID string dari kolom id.

    Returns:
        Dict item riwayat lengkap (termasuk result JSON), atau None jika tidak ditemukan.
    """
    try:
        client = _get_client()
        if client is None:
            return None

        response = (
            client.table(TABLE_NAME)
            .select("*")
            .eq("id", history_id)
            .single()
            .execute()
        )

        return response.data

    except Exception as e:
        logger.error(f"[DB] get_history_by_id failed for id={history_id}: {e}")
        return None
