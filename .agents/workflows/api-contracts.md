# LeafGuard Tani — API Contracts

**Version**: 1.0.0
**Created**: 2026-05-02
**Base URL (dev)**: `http://localhost:8000`
**Base URL (prod)**: `https://leafguard-api-[hash]-uc.a.run.app`

---

## Endpoints

### POST `/analyze`

**Purpose**: Single endpoint untuk semua mode analisis (plant, label, both).

**Request**
```
Content-Type: multipart/form-data

Fields:
  mode          string    required    "plant" | "label" | "both"
  plant_image   File      conditional required jika mode = "plant" | "both"
  label_image   File      conditional required jika mode = "label" | "both"
```

**Validation Rules**
- `mode` harus salah satu dari tiga nilai valid → `422 VALIDATION_ERROR`
- `plant_image` wajib ada jika mode = "plant" atau "both" → `422 VALIDATION_ERROR`
- `label_image` wajib ada jika mode = "label" atau "both" → `422 VALIDATION_ERROR`
- File size masing-masing ≤ 10MB (sudah dikompresi client-side ke ≤ 1MB) → `413 FILE_TOO_LARGE`
- MIME type harus `image/jpeg` atau `image/png` → `422 INVALID_FORMAT`

---

**Response 200 — Success**
```json
{
  "success": true,
  "data": {
    "diagnosis": {
      "disease_id": "D04",
      "disease_name": "Wereng Cokelat",
      "confidence": "HIGH",
      "confidence_score": 0.92,
      "urgency": "IMMEDIATE",
      "symptom_description": "Terdeteksi koloni wereng cokelat padat di pangkal batang. Beberapa rumpun menunjukkan tanda awal hopperburn.",
      "spread_mechanism": "Wereng menyebar melalui penerbangan pendek antar rumpun. Kondisi lembab mempercepat reproduksi.",
      "is_healthy": false,
      "disclaimer": "Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan."
    },
    "label_info": null,
    "recommendation": null,
    "processing_time_ms": 2341
  },
  "error": null
}
```

**Response 200 — Mode "both" (integrated)**
```json
{
  "success": true,
  "data": {
    "diagnosis": { "...": "..." },
    "label_info": {
      "product_name": "PaddyShield 300SC",
      "active_ingredients": [
        { "name": "Klorantraniliprol", "concentration": "100 g/l" },
        { "name": "Tiametoksam", "concentration": "200 g/l" }
      ],
      "dose_technical": "1.0–1.5 ml/L air bersih",
      "dose_familiar": "kira-kira ⅓ hingga ½ sendok teh per liter air",
      "application_timing": "Semprotkan pagi hari (sebelum 09.00) atau sore hari (setelah 15.00)",
      "target_pests": ["Wereng Cokelat", "Penggerek Batang", "Hama Putih Palsu"],
      "safety_warnings": [
        "Gunakan masker dan sarung tangan karet saat pencampuran",
        "Hindari menyemprot saat angin kencang",
        "Jauhkan dari jangkauan anak-anak"
      ],
      "confidence_notes": null
    },
    "recommendation": {
      "product_suitable": true,
      "suitability_reason": "PaddyShield 300SC mengandung Tiametoksam yang efektif terhadap Wereng Cokelat sesuai dengan hama yang terdeteksi.",
      "recommended_product_type": null,
      "action_steps": [
        "Campurkan 1,5 ml PaddyShield dengan 1 liter air bersih di tangki semprot",
        "Semprotkan sore hari setelah pukul 15.00 agar efektivitas maksimal",
        "Fokuskan semprotan di pangkal batang dan bagian bawah daun",
        "Ulangi penyemprotan setelah 7 hari jika serangan masih terlihat",
        "Pasang lampu perangkap di sekitar lahan untuk memantau populasi wereng"
      ]
    },
    "processing_time_ms": 3892
  },
  "error": null
}
```

---

**Response 400 — Invalid Image**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Foto tidak dapat dianalisis. Pastikan foto menampilkan daun, batang tanaman padi, atau label produk pertanian yang cukup jelas dan terang.",
    "retryable": true
  }
}
```

**Response 422 — Validation Error**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mode analisis tidak valid atau foto yang dibutuhkan tidak diunggah.",
    "retryable": false
  }
}
```

**Response 500 — AI Error**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AI_ERROR",
    "message": "Terjadi kesalahan saat menganalisis foto. Silakan coba lagi.",
    "retryable": true
  }
}
```

**Response 413 — File Too Large**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Ukuran foto terlalu besar (maks. 10MB). Coba foto dengan resolusi lebih rendah.",
    "retryable": true
  }
}
```

---

### GET `/health`

**Purpose**: Health check untuk Cloud Run liveness probe.

**Response 200**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-05-02T10:30:00Z"
}
```

---

## Error Code Reference

| Code | HTTP Status | Retryable | Deskripsi |
|---|---|---|---|
| `INVALID_IMAGE` | 400 | ✅ | Foto tidak valid / bukan tanaman/label |
| `VALIDATION_ERROR` | 422 | ❌ | Request malformed |
| `FILE_TOO_LARGE` | 413 | ✅ | File > 10MB |
| `INVALID_FORMAT` | 422 | ✅ | Bukan JPEG/PNG |
| `AI_ERROR` | 500 | ✅ | Gemini API error atau parse JSON gagal |
| `RATE_LIMITED` | 429 | ✅ | Gemini free tier limit tercapai |

---

## Frontend API Service Contract

```javascript
// services/api.js
const BASE_URL = import.meta.env.VITE_API_URL

export async function analyze({ mode, plantImage, labelImage }) {
  const form = new FormData()
  form.append('mode', mode)
  if (plantImage) form.append('plant_image', plantImage)
  if (labelImage) form.append('label_image', labelImage)

  const response = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    body: form
  })

  const data = await response.json()

  if (!data.success) {
    throw new ApiError(data.error.code, data.error.message, data.error.retryable)
  }

  return data.data
}
```
