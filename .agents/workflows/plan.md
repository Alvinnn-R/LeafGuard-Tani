# LeafGuard Tani — Implementation Plan

**Version**: 1.0.0
**Created**: 2026-05-02
**Refs**: spec.md v1.0.0

---

## Tech Stack

| Layer | Technology | Justifikasi |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Build cepat, mobile-first, familiar tim |
| Backend | Python + FastAPI | Async, minimal boilerplate, familiar tim |
| AI Engine | Gemini 1.5 Flash (Google AI Studio) | Multimodal vision + OCR dalam 1 model, free tier |
| Deploy Backend | Google Cloud Run | Serverless, pay-per-use, rekomendasi guidebook |
| Deploy Frontend | Firebase Hosting | CDN global, HTTPS otomatis |
| Storage | Firebase Storage | Upload foto dengan security rules |
| PWA | Vite PWA Plugin | Manifest + service worker otomatis |

---

## Constitution Check

Sebelum implementasi, validasi 6 prinsip dari `constitution.md`:

- [ ] Zero Friction: setiap fitur ≤ 3 tap dari home
- [ ] Bahasa Indonesia: tidak ada teks UI dalam Bahasa Inggris
- [ ] No PII: tidak ada login, tidak ada tracking
- [ ] Disclaimer: setiap output diagnosa menyertakan teks penyuluh
- [ ] Graceful Degradation: setiap error state punya pesan + next action
- [ ] Mobile-First: desain dimulai dari 360px width

---

## Architecture

```
Petani (Browser PWA)
     │
     │  POST /analyze (multipart: foto + mode)
     ▼
Backend — FastAPI (Cloud Run)
     │  bangun multimodal prompt
     │  panggil Gemini API
     │  parse + validasi JSON response
     │  kirim balik AnalysisResult
     ▼
Gemini 1.5 Flash (Google AI Studio)
     │  analisis gambar + OCR
     └──── Firebase Storage (async, non-blocking)
```

**Catatan arsitektur:**
- Firebase Storage upload dilakukan **secara async** setelah result dikirim ke frontend — tidak boleh memblokir response
- Semua pemanggilan Gemini API dilakukan dari backend — API key tidak pernah exposed ke frontend
- Frontend menyimpan riwayat analisis di `localStorage` saja (tidak ada Firestore di MVP)

---

## Project Structure

```
leafguard-tani/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── routers/
│   │   └── analyze.py          # POST /analyze, GET /health
│   ├── services/
│   │   ├── gemini.py           # Wrapper Gemini API calls
│   │   └── storage.py          # Firebase Storage upload (async)
│   ├── models/
│   │   └── schemas.py          # Pydantic request/response models
│   ├── prompts/
│   │   └── system.py           # Few-shot system prompt templates
│   ├── utils/
│   │   └── image.py            # Image validation utilities
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadZone.jsx        # Drag/drop + camera capture
│   │   │   ├── AnalysisResult.jsx    # Card hasil diagnosa tanaman
│   │   │   ├── LabelResult.jsx       # Card hasil OCR label
│   │   │   ├── RecommendationCard.jsx # Card rekomendasi terpadu
│   │   │   ├── SummaryCard.jsx       # Kartu ringkasan shareable
│   │   │   ├── LoadingState.jsx      # Loading dengan pesan Bahasa Indonesia
│   │   │   └── ErrorState.jsx        # Error dengan retry action
│   │   ├── pages/
│   │   │   ├── Home.jsx              # Landing + mode selection
│   │   │   ├── Analysis.jsx          # Upload + processing
│   │   │   └── History.jsx           # Riwayat dari localStorage
│   │   ├── services/
│   │   │   ├── api.js                # Axios wrapper ke backend
│   │   │   └── storage.js            # localStorage riwayat
│   │   ├── hooks/
│   │   │   └── useAnalysis.js        # State management analisis
│   │   └── App.jsx
│   ├── public/
│   │   └── manifest.json
│   ├── vite.config.js              # Termasuk PWA plugin config
│   ├── tailwind.config.js
│   └── package.json
│
├── .specify/                       # Spec-kit artifacts
│   └── specs/1-leafguard-tani-core/
│       ├── spec.md
│       ├── plan.md
│       ├── data-model.md
│       ├── api-contracts.md
│       ├── tasks.md
│       └── checklists/
│
└── README.md
```

---

## Phases

### Phase 0: Research (Selesai — embedded di plan ini)
- Gemini 1.5 Flash: multimodal support confirmed, free tier 15 RPM / 1M TPD
- Cloud Run: cold start ~1–2s, min-instances=1 untuk demo
- Firebase Storage: max file size 5GB, rules dikonfigurasi untuk public read selama hackathon
- Vite PWA Plugin: `vite-plugin-pwa` — generates manifest + Workbox service worker

### Phase 1: Setup (2 Mei)
- Init repo GitHub, branch `1-leafguard-tani-core`
- Setup backend FastAPI skeleton + Dockerfile
- Setup frontend React + Vite + Tailwind
- Configure env variables (Gemini key, Firebase config)
- Deploy skeleton ke Cloud Run + Firebase Hosting untuk validasi pipeline

### Phase 2: Core Backend (2–4 Mei)
- Implement `POST /analyze` endpoint dengan Pydantic validation
- Build Gemini service wrapper dengan error handling
- Implement prompt templates (plant, label, both modes)
- Few-shot context injection untuk 6 penyakit scope
- Firebase Storage async upload
- Manual testing via Postman dengan 10 foto test

### Phase 3: Core Frontend (2–4 Mei, paralel dengan Phase 2)
- Build UploadZone component (camera + galeri)
- Build LoadingState + ErrorState components
- Build result cards: AnalysisResult, LabelResult, RecommendationCard
- Connect ke backend API via axios
- Mobile UI testing di 3 device berbeda

### Phase 4: Integration & QA (6–8 Mei)
- End-to-end testing semua 3 mode analisis
- Prompt optimization dari hasil testing
- PWA audit via Lighthouse (target ≥ 70)
- Performance optimization (image compression client-side)
- Final deploy ke Cloud Run + Firebase Hosting

### Phase 5: Demo Prep (9 Mei)
- GitHub push + README dokumentasi
- 3 demo scenario walkthroughs
- Backup: recorded demo video (mitigasi koneksi buruk saat pitching)

---

## Technical Constraints

- Gemini free tier: 15 RPM. Untuk demo, rate ini cukup. Tidak perlu caching kecuali demo stress test.
- Cloud Run cold start: set `--min-instances=1` saat deploy untuk menghindari delay pertama
- Image size: client-side compress ke ≤ 1MB sebelum upload menggunakan `browser-image-compression` npm package
- Firebase Storage: gunakan path `sessions/{uuid}/{filename}` — UUID di-generate client-side
