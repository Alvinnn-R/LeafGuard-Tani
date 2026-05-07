"""
storage.py — Async image upload service (fire-and-forget).

Saat ini menggunakan stub (log only) karena MVP focus pada Gemini analysis.
Firebase Storage / Supabase Storage bisa diintegrasikan nanti tanpa mengubah
interface fungsi ini.

PENTING: Upload TIDAK BOLEH blocking response — selalu fire-and-forget via asyncio.create_task.
Ref: CLAUDE.md §6, plan.md §Architecture
"""

import logging
import uuid

logger = logging.getLogger(__name__)


async def upload_image_async(
    image_bytes: bytes,
    mode: str,
    image_type: str = "plant",
) -> str | None:
    """Upload gambar ke storage secara async (fire-and-forget).

    Fungsi ini dipanggil via asyncio.create_task() dari router,
    sehingga tidak memblokir response ke frontend.

    Args:
        image_bytes: Raw bytes gambar yang sudah divalidasi.
        mode: Mode analisis saat upload ("plant" | "label" | "both").
        image_type: Jenis gambar ("plant" atau "label").

    Returns:
        URL publik gambar jika upload berhasil, None jika gagal.
        Pada stub ini selalu return None.
    """
    session_id = uuid.uuid4().hex[:12]
    path = f"sessions/{session_id}/{image_type}.jpg"

    try:
        # === STUB: Log saja, tidak upload ke storage ===
        # TODO: Ganti dengan Supabase Storage atau Firebase Storage
        #
        # Contoh integrasi Supabase Storage:
        #   from supabase import create_client
        #   supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        #   result = supabase.storage.from_("images").upload(path, image_bytes)
        #   return result.get("publicUrl")
        #
        # Contoh integrasi Firebase Storage:
        #   from firebase_admin import storage
        #   bucket = storage.bucket()
        #   blob = bucket.blob(path)
        #   blob.upload_from_string(image_bytes, content_type="image/jpeg")
        #   return blob.public_url

        logger.info(
            f"[STUB] Image upload skipped — path: {path}, "
            f"size: {len(image_bytes)} bytes, mode: {mode}"
        )
        return None

    except Exception as e:
        # Upload gagal TIDAK boleh crash — graceful degradation
        logger.error(f"Image upload failed (non-blocking): {e}")
        return None
