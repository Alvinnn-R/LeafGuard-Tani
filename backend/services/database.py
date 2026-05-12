"""
database.py — Supabase Database service untuk menyimpan & mengambil riwayat analisis.

Menggunakan httpx langsung ke Supabase PostgREST API.
Package 'supabase' TIDAK digunakan karena dependency pyiceberg tidak kompatibel di Windows.

Operasi:
  - save_history_async: Insert sesi analisis ke tabel history (fire-and-forget)
  - get_history: Ambil daftar riwayat (dengan pagination, filter per device)
  - get_history_by_id: Ambil 1 item riwayat berdasarkan ID

PENTING: save_history_async dipanggil via asyncio.create_task — tidak blocking response.
"""

import json
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

TABLE_NAME = "history"


def _get_supabase_config() -> tuple[str, str] | None:
    """Return (url, key) jika configured, None jika tidak."""
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        return None
    return url, key


def _build_headers(key: str, extra: dict | None = None) -> dict:
    """Build standard Supabase PostgREST headers."""
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


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
        config = _get_supabase_config()
        if config is None:
            logger.warning("[DB] Supabase not configured — skip save history.")
            return False

        url, key = config

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

        # POST ke PostgREST API
        # https://supabase.com/docs/guides/api#inserting
        api_url = f"{url}/rest/v1/{TABLE_NAME}"
        headers = _build_headers(key, {"Prefer": "return=minimal"})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                api_url,
                json=row,
                headers=headers,
                timeout=10.0,
            )
            response.raise_for_status()

        logger.info(
            f"[DB] History saved — session: {session_id}, mode: {mode}, "
            f"device: {device_id or 'none'}, "
            f"plant_url: {'yes' if plant_url else 'no'}, "
            f"label_url: {'yes' if label_url else 'no'}"
        )
        return True

    except httpx.HTTPStatusError as e:
        logger.error(
            f"[DB] save_history_async HTTP error: {e.response.status_code} - {e.response.text}\n"
            f"     session_id={session_id}, mode={mode}, device_id={device_id}\n"
            f"     disease_name={disease_name}, urgency={urgency}, product_name={product_name}"
        )
        return False
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
        config = _get_supabase_config()
        if config is None:
            logger.warning("[DB] Supabase not configured — returning empty history.")
            return []

        url, key = config
        limit = min(limit, 50)

        # GET dari PostgREST API dengan query params
        # https://supabase.com/docs/guides/api#reading
        api_url = f"{url}/rest/v1/{TABLE_NAME}"
        headers = _build_headers(key)

        # Select hanya kolom yang dibutuhkan untuk list
        params = {
            "select": "id,session_id,mode,created_at,plant_url,label_url,disease_name,urgency,product_name",
            "order": "created_at.desc",
            "offset": str(offset),
            "limit": str(limit),
        }

        # Filter per device jika device_id diberikan
        if device_id:
            params["device_id"] = f"eq.{device_id}"

        with httpx.Client() as client:
            response = client.get(
                api_url,
                headers=headers,
                params=params,
                timeout=10.0,
            )
            response.raise_for_status()

        return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"[DB] get_history HTTP error: {e.response.status_code} - {e.response.text}")
        return []
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
        config = _get_supabase_config()
        if config is None:
            return None

        url, key = config

        # GET single row by id
        api_url = f"{url}/rest/v1/{TABLE_NAME}"
        headers = _build_headers(key, {"Accept": "application/vnd.pgrst.object+json"})

        params = {
            "select": "*",
            "id": f"eq.{history_id}",
        }

        with httpx.Client() as client:
            response = client.get(
                api_url,
                headers=headers,
                params=params,
                timeout=10.0,
            )

            # 406 = row not found (PostgREST single-object mode)
            if response.status_code == 406:
                return None

            response.raise_for_status()

        return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"[DB] get_history_by_id HTTP error for id={history_id}: {e.response.status_code}")
        return None
    except Exception as e:
        logger.error(f"[DB] get_history_by_id failed for id={history_id}: {e}")
        return None
