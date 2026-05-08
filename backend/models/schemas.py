"""
schemas.py — Semua Pydantic request/response models untuk LeafGuard Tani API.

Ref: data-model.md v1.0.0, api-contracts.md v1.0.0
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ============================================================
# Enums
# ============================================================

class AnalysisMode(str, Enum):
    """Mode analisis yang tersedia."""
    PLANT = "plant"
    LABEL = "label"
    BOTH = "both"


class Confidence(str, Enum):
    """Tingkat keyakinan diagnosis. HIGH: >75%, MEDIUM: 40-75%, LOW: <40%."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Urgency(str, Enum):
    """Tingkat urgensi penanganan."""
    IMMEDIATE = "IMMEDIATE"
    WITHIN_3_DAYS = "WITHIN_3_DAYS"
    MONITOR = "MONITOR"


# ============================================================
# Data Models — sesuai data-model.md
# ============================================================

class ActiveIngredient(BaseModel):
    """Bahan aktif dalam produk pertanian."""
    name: str
    concentration: str


class DiagnosisResult(BaseModel):
    """Output diagnosa tanaman dari Gemini. Mode: plant | both."""
    disease_id: str = Field(
        description="Salah satu dari: D01-D06, HEALTHY, atau UNKNOWN"
    )
    disease_name: str = Field(
        description="Nama penyakit dalam Bahasa Indonesia"
    )
    confidence: Confidence
    confidence_score: float = Field(ge=0.0, le=1.0)
    urgency: Urgency
    symptom_description: str
    spread_mechanism: str
    is_healthy: bool
    disclaimer: str = Field(
        description="SELALU: 'Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan.'"
    )


class LabelInfo(BaseModel):
    """Output interpretasi label produk dari OCR Gemini. Mode: label | both."""
    product_name: str
    active_ingredients: list[ActiveIngredient]
    dose_technical: str = Field(
        description="Dosis sesuai label (e.g., '1.5 ml/L')"
    )
    dose_familiar: str = Field(
        description="Konversi ke satuan familiar (e.g., '½ sendok teh per liter air')"
    )
    application_timing: str
    target_pests: list[str]
    safety_warnings: list[str] = Field(
        description="SELALU tampilkan, bahkan jika field lain low-confidence"
    )
    confidence_notes: Optional[str] = None


class RecommendationCard(BaseModel):
    """Output rekomendasi terpadu. Mode: both saja."""
    product_suitable: bool
    suitability_reason: str
    recommended_product_type: Optional[str] = None
    action_steps: list[str] = Field(
        max_length=5,
        description="3-5 langkah konkret, bahasa sederhana"
    )


# ============================================================
# API Response Models — sesuai api-contracts.md
# ============================================================

class AnalysisResult(BaseModel):
    """Wrapper response utama dari backend."""
    diagnosis: Optional[DiagnosisResult] = None
    label_info: Optional[LabelInfo] = None
    recommendation: Optional[RecommendationCard] = None
    processing_time_ms: int


class ApiError(BaseModel):
    """Struktur error yang dikembalikan ke frontend."""
    code: str = Field(
        description="Error code: INVALID_IMAGE, VALIDATION_ERROR, FILE_TOO_LARGE, INVALID_FORMAT, AI_ERROR, RATE_LIMITED"
    )
    message: str = Field(
        description="Pesan error dalam Bahasa Indonesia"
    )
    retryable: bool


class ApiResponse(BaseModel):
    """Struktur response standar. Selalu { success, data, error }."""
    success: bool
    data: Optional[AnalysisResult] = None
    error: Optional[ApiError] = None
