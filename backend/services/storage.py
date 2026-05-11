"""
storage.py — Async image upload service ke Supabase Storage (fire-and-forget).

Menggunakan httpx langsung ke Supabase Storage REST API.
Package 'supabase' TIDAK digunakan karena dependency pyiceberg tidak kompatibel di Windows.

PENTING: Upload TIDAK BOLEH blocking response — selalu fire-and-forget via asyncio.create_task.
Ref: CLAUDE.md §6, plan.md §Architecture
"""

import logging
import os
import uuid

import httpx

logger = logging.getLogger(__name__)


async def upload_image_async(
    image_bytes: bytes,
    mode: str,
    image_type: str = "plant",
    session_id: str | None = None,
) -> str | None:
    """Upload gambar ke Supabase Storage secara async (fire-and-forget).

    Fungsi ini dipanggil via asyncio.create_task() dari router,
    sehingga tidak memblokir response ke frontend.

    Args:
        image_bytes: Raw bytes gambar yang sudah divalidasi.
        mode: Mode analisis saat upload ("plant" | "label" | "both").
        image_type: Jenis gambar ("plant" atau "label").
        session_id: UUID sesi analisis (opsional, di-generate jika None).

    Returns:
        URL publik gambar jika upload berhasil, None jika gagal.
    """
    if not session_id:
        session_id = uuid.uuid4().hex[:12]

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    bucket = os.getenv("SUPABASE_BUCKET", "images")

    if not supabase_url or not supabase_key:
        logger.warning("[STORAGE] Supabase credentials not configured — skip upload.")
        return None

    path = f"sessions/{session_id}/{image_type}.jpg"

    # Supabase Storage REST API endpoint
    # https://supabase.com/docs/guides/storage/uploads
    upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{path}"

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "image/jpeg",
        "x-upsert": "true",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                upload_url,
                content=image_bytes,
                headers=headers,
                timeout=15.0,
            )
            response.raise_for_status()

        # Generate public URL
        public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{path}"

        logger.info(f"[STORAGE] Upload success — {path} ({len(image_bytes)} bytes)")
        return public_url

    except httpx.HTTPStatusError as e:
        logger.error(f"[STORAGE] Upload HTTP error: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        # Upload gagal TIDAK boleh crash — graceful degradation
        logger.error(f"[STORAGE] Upload failed (non-blocking): {e}")
        return None
