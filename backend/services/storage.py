"""
storage.py — Async image upload service ke Supabase Storage (fire-and-forget).

PENTING: Upload TIDAK BOLEH blocking response — selalu fire-and-forget via asyncio.create_task.
Ref: CLAUDE.md §6, plan.md §Architecture
"""

import logging
import os
import uuid

logger = logging.getLogger(__name__)

# Lazy-init Supabase client agar tidak crash saat .env belum diisi
_supabase_client = None


def _get_client():
    """Return Supabase client, buat jika belum ada."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        logger.warning("Supabase credentials not configured — storage upload disabled.")
        return None

    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        logger.info("Supabase client initialized.")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


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

    bucket = os.getenv("SUPABASE_BUCKET", "images")
    path = f"sessions/{session_id}/{image_type}.jpg"

    try:
        client = _get_client()
        if client is None:
            logger.warning(f"[STORAGE] Supabase not configured — skip upload: {path}")
            return None

        # Upload ke Supabase Storage
        client.storage.from_(bucket).upload(
            path=path,
            file=image_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )

        # Ambil public URL
        public_url = client.storage.from_(bucket).get_public_url(path)

        logger.info(f"[STORAGE] Upload success — {path} ({len(image_bytes)} bytes)")
        return public_url

    except Exception as e:
        # Upload gagal TIDAK boleh crash — graceful degradation
        logger.error(f"[STORAGE] Upload failed (non-blocking): {e}")
        return None
