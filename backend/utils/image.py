"""
image.py — Image validation utilities.

Validasi MIME type dan ukuran file sebelum dikirim ke Gemini.
Ref: api-contracts.md §Validation Rules
"""

from fastapi import UploadFile


# Batas ukuran file: 10MB (client-side sudah compress ke ≤1MB, ini server-side safety net)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

# MIME types yang diterima
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}


class ImageValidationError(Exception):
    """Custom exception untuk validasi gambar yang gagal.

    Attributes:
        code: Error code yang akan di-map ke ApiError.code
        message: Pesan error dalam Bahasa Indonesia
    """

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


async def validate_image(file: UploadFile) -> bytes:
    """Validasi file gambar: cek MIME type dan ukuran, kembalikan bytes.

    Args:
        file: UploadFile dari FastAPI request.

    Returns:
        Raw bytes dari gambar yang sudah divalidasi.

    Raises:
        ImageValidationError: Jika MIME type tidak valid atau ukuran melebihi batas.
    """
    # 1. Cek MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise ImageValidationError(
            code="INVALID_FORMAT",
            message="Format foto tidak didukung. Gunakan format JPEG atau PNG.",
        )

    # 2. Baca bytes
    contents = await file.read()

    # 3. Cek ukuran file
    if len(contents) > MAX_IMAGE_SIZE:
        raise ImageValidationError(
            code="FILE_TOO_LARGE",
            message="Ukuran foto terlalu besar (maks. 10MB). Coba foto dengan resolusi lebih rendah.",
        )

    return contents
