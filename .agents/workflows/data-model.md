# LeafGuard Tani — Data Model

**Version**: 1.0.0
**Created**: 2026-05-02
**Refs**: spec.md §User Stories, plan.md §Architecture

---

## Entity Overview

```
AnalysisSession
    ├── DiagnosisResult     (nullable — mode: plant | both)
    ├── LabelInfo           (nullable — mode: label | both)
    └── RecommendationCard  (nullable — mode: both only)
```

---

## Entities

### AnalysisSession
Dibuat per-sesi di client. Disimpan di localStorage untuk riwayat (US5).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string (UUID)` | ✅ | Generated client-side: `crypto.randomUUID()` |
| `created_at` | `string (ISO 8601)` | ✅ | e.g. `"2026-05-02T10:30:00+07:00"` |
| `mode` | `"plant" \| "label" \| "both"` | ✅ | Dipilih user sebelum upload |
| `plant_image_url` | `string \| null` | ❌ | Firebase Storage URL (async, non-blocking) |
| `label_image_url` | `string \| null` | ❌ | Firebase Storage URL (async, non-blocking) |
| `result` | `AnalysisResult` | ✅ | Hasil analisis lengkap |

---

### AnalysisResult
Wrapper response dari backend.

| Field | Type | Required | Notes |
|---|---|---|---|
| `diagnosis` | `DiagnosisResult \| null` | ❌ | Null jika mode = "label" |
| `label_info` | `LabelInfo \| null` | ❌ | Null jika mode = "plant" |
| `recommendation` | `RecommendationCard \| null` | ❌ | Hanya ada jika mode = "both" |
| `processing_time_ms` | `number` | ✅ | Untuk monitoring performa |

---

### DiagnosisResult
Output diagnosa tanaman dari Gemini.

| Field | Type | Required | Notes |
|---|---|---|---|
| `disease_id` | `string` | ✅ | Salah satu dari: D01–D06, atau `"UNKNOWN"` |
| `disease_name` | `string` | ✅ | Nama penyakit dalam Bahasa Indonesia |
| `confidence` | `"HIGH" \| "MEDIUM" \| "LOW"` | ✅ | HIGH: >75%, MED: 40–75%, LOW: <40% |
| `confidence_score` | `number (0.0–1.0)` | ✅ | Nilai numerik dari Gemini |
| `urgency` | `"IMMEDIATE" \| "WITHIN_3_DAYS" \| "MONITOR"` | ✅ | Mapped ke warna: Merah / Oranye / Hijau |
| `symptom_description` | `string` | ✅ | Deskripsi gejala yang terdeteksi di foto |
| `spread_mechanism` | `string` | ✅ | Penjelasan singkat cara penyebaran |
| `is_healthy` | `boolean` | ✅ | `true` jika tanaman terlihat sehat |
| `disclaimer` | `string` | ✅ | **SELALU**: *"Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan."* |

**Disease ID Reference:**

| ID | Nama | Jenis |
|---|---|---|
| D01 | Blas Daun | Penyakit Jamur |
| D02 | Bercak Cokelat | Penyakit Jamur |
| D03 | Hawar Daun Bakteri (HDB) | Penyakit Bakteri |
| D04 | Wereng Cokelat | Hama Serangga |
| D05 | Penggerek Batang | Hama Serangga |
| D06 | Tungro | Penyakit Virus |
| HEALTHY | Tanaman Sehat | - |
| UNKNOWN | Tidak Dikenali | - |

---

### LabelInfo
Output interpretasi label produk dari OCR Gemini.

| Field | Type | Required | Notes |
|---|---|---|---|
| `product_name` | `string` | ✅ | Nama produk dari label |
| `active_ingredients` | `ActiveIngredient[]` | ✅ | Bisa kosong array jika tidak terbaca |
| `dose_technical` | `string` | ✅ | Dosis sesuai label (e.g., "1.5 ml/L") |
| `dose_familiar` | `string` | ✅ | Konversi ke satuan familiar (e.g., "½ sendok teh per liter air") |
| `application_timing` | `string` | ✅ | Kapan dan seberapa sering aplikasi |
| `target_pests` | `string[]` | ✅ | Daftar hama/penyakit sasaran |
| `safety_warnings` | `string[]` | ✅ | **SELALU tampilkan**, bahkan jika field lain low-confidence |
| `confidence_notes` | `string \| null` | ❌ | Catatan jika sebagian teks tidak terbaca |

### ActiveIngredient

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Nama bahan aktif |
| `concentration` | `string` | e.g., "200 g/l" |

---

### RecommendationCard
Output rekomendasi terpadu (mode "both" saja).

| Field | Type | Required | Notes |
|---|---|---|---|
| `product_suitable` | `boolean` | ✅ | Produk sesuai untuk masalah yang terdeteksi? |
| `suitability_reason` | `string` | ✅ | Penjelasan singkat mengapa sesuai/tidak |
| `recommended_product_type` | `string \| null` | ❌ | Jika tidak sesuai: jenis produk yang direkomendasikan |
| `action_steps` | `string[]` | ✅ | 3–5 langkah konkret, max 5 item, bahasa sederhana |

---

## State Transitions

```
User buka app
    │
    ▼
Pilih mode (plant / label / both)
    │
    ▼
Upload foto(s)
    │
    ├── Validasi gagal → ERROR_INVALID_IMAGE → re-upload
    │
    ▼
Processing (loading state)
    │
    ├── API error → ERROR_API → retry
    │
    ▼
Result displayed
    │
    ├── Share/Save → SummaryCard
    │
    └── Analisis Baru → kembali ke mode selection
```

---

## localStorage Schema (Riwayat — US5)

Key: `leafguard_history`
Value: `AnalysisSession[]` (JSON array, max 50 item, FIFO jika melebihi)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-05-02T10:30:00+07:00",
    "mode": "plant",
    "plant_image_url": null,
    "label_image_url": null,
    "result": { ... }
  }
]
```

**Catatan**: `plant_image_url` dan `label_image_url` bisa null di localStorage karena Firebase Storage upload bersifat async dan tidak dijamin selesai sebelum result disimpan.
