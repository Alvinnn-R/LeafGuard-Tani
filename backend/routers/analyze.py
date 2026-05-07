"""
analyze.py — Router untuk endpoint analisis LeafGuard Tani.

Endpoints:
  - GET  /health   → Health check (Cloud Run liveness probe)
  - POST /analyze  → Analisis foto tanaman/label (Sprint 2)

Ref: api-contracts.md v1.0.0
"""

from datetime import datetime, timezone

from fastapi import APIRouter

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


# POST /analyze akan diimplementasi di Sprint 2
# Lihat: api-contracts.md untuk spesifikasi lengkap
