"""
schemas.py — Semua Pydantic request/response models untuk LeafGuard Tani API.

Ref: data-model.md v1.0.0, api-contracts.md v1.0.0
     Buku Saku Penyakit Padi (BBPOPT 2020) — extended fields
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
    """Tingkat urgensi penanganan.

    Skala sesuai Buku Saku Penyakit Padi (BBPOPT 2020):
      - IMMEDIATE : Potensi kehilangan hasil besar, tindakan ≤ 1×24 jam
      - HIGH      : Perlu tindakan dalam 2–3 hari
      - MEDIUM    : Pantau dan tindak dalam 1 minggu
      - LOW       : Observasi, belum perlu pengendalian segera
      - WITHIN_3_DAYS : alias legacy (dipakai frontend lama)
      - MONITOR      : alias legacy
    """
    IMMEDIATE = "IMMEDIATE"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    # Legacy aliases agar frontend lama tetap kompatibel
    WITHIN_3_DAYS = "WITHIN_3_DAYS"
    MONITOR = "MONITOR"


# ============================================================
# Data Models — sesuai data-model.md + extended BBPOPT fields
# ============================================================

class ActiveIngredient(BaseModel):
    """Bahan aktif dalam produk pertanian."""
    name: str
    concentration: str


class ControlMeasures(BaseModel):
    """Langkah-langkah pengendalian penyakit (dari Buku Saku BBPOPT)."""
    preventive: list[str] = Field(
        default_factory=list,
        description="Langkah pencegahan",
    )
    curative: list[str] = Field(
        default_factory=list,
        description="Langkah kuratif/pengobatan",
    )


class DiagnosisResult(BaseModel):
    """Output diagnosa tanaman dari Gemini. Mode: plant | both.

    Field inti (wajib):
        disease_id, disease_name, confidence, confidence_score,
        urgency, symptom_description, spread_mechanism, is_healthy, disclaimer

    Field extended (opsional — dari Buku Saku BBPOPT 2020):
        pathogen, pathogen_type, affected_part, epidemic_factors,
        control_measures, reference
    """
    # === Field Inti ===
    disease_id: str = Field(
        description="D01-D20, HEALTHY, atau UNKNOWN"
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
        description="SELALU hardcoded dari server, bukan dari AI"
    )

    # === Field Extended (Buku Saku BBPOPT 2020) ===
    pathogen: Optional[str] = Field(
        default=None,
        description="Nama Latin patogen (e.g. 'Pyricularia oryzae')",
    )
    pathogen_type: Optional[str] = Field(
        default=None,
        description="Jenis patogen: Jamur, Bakteri, Nematoda, Serangga",
    )
    affected_part: Optional[str] = Field(
        default=None,
        description="Bagian tanaman yang terinfeksi: Daun, Pelepah, Leher Malai, Bulir, Batang",
    )
    epidemic_factors: Optional[list[str]] = Field(
        default=None,
        description="Faktor-faktor yang mempercepat epidemi",
    )
    control_measures: Optional[ControlMeasures] = Field(
        default=None,
        description="Langkah pengendalian preventif & kuratif",
    )
    reference: Optional[str] = Field(
        default=None,
        description="Sumber referensi diagnosis",
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
