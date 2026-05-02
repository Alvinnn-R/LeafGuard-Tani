# LeafGuard Tani — Implementation Tasks

**Version**: 1.0.0
**Created**: 2026-05-02
**Feature**: 1-leafguard-tani-core
**Total Tasks**: 38
**MVP Scope**: Phase 1–4 (T001–T028)

---

## Phase 1: Setup & Infrastructure

**Goal**: Repository siap, pipeline deploy berfungsi, skeleton bisa diakses via URL publik.

- [ ] T001 Init repo GitHub dengan branch `1-leafguard-tani-core`, buat struktur folder sesuai `plan.md §Project Structure`
- [ ] T002 Setup backend: `cd backend && pip install fastapi uvicorn python-multipart google-generativeai firebase-admin python-dotenv` + buat `requirements.txt`
- [ ] T003 Buat `backend/main.py` dengan FastAPI app + `GET /health` endpoint + CORS middleware untuk localhost + Cloud Run origin
- [ ] T004 Buat `backend/.env.example` dengan variabel: `GEMINI_API_KEY`, `FIREBASE_STORAGE_BUCKET`, `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] T005 Buat `backend/Dockerfile` — base image `python:3.11-slim`, expose port 8080, CMD uvicorn
- [ ] T006 [P] Setup frontend: `npm create vite@latest frontend -- --template react` + install `tailwindcss autoprefixer postcss axios browser-image-compression`
- [ ] T007 [P] Konfigurasi Tailwind CSS di `frontend/tailwind.config.js` + `postcss.config.js` + import di `src/index.css`
- [ ] T008 Install dan konfigurasi `vite-plugin-pwa` di `frontend/vite.config.js` + buat `public/manifest.json` (name, icons, theme_color hijau #1a6b3c)
- [ ] T009 Deploy backend skeleton ke Google Cloud Run: `gcloud run deploy leafguard-api --source ./backend --region us-central1 --allow-unauthenticated --min-instances=1`
- [ ] T010 Deploy frontend skeleton ke Firebase Hosting: `firebase init hosting && firebase deploy`
- [ ] T011 Verifikasi: `GET /health` di URL Cloud Run mengembalikan `{"status": "ok"}` + PWA dapat diakses via Firebase URL

---

## Phase 2: Backend Core

**Goal**: Endpoint `/analyze` berfungsi untuk ketiga mode dengan Gemini integration.

- [ ] T012 Buat `backend/models/schemas.py` — semua Pydantic models sesuai `data-model.md`: `AnalysisRequest`, `AnalysisResult`, `DiagnosisResult`, `LabelInfo`, `RecommendationCard`, `ActiveIngredient`, `ApiResponse`, `ApiError`
- [ ] T013 Buat `backend/prompts/system.py` — 3 system prompt (plant, label, both) sesuai `prompts.md` persis, tidak diubah
- [ ] T014 Buat `backend/services/gemini.py` — wrapper `analyze_image(mode, plant_bytes, label_bytes)` yang: inisialisasi Gemini client, pilih system prompt berdasarkan mode, kirim request multimodal, parse JSON response, handle error sesuai `prompts.md §Error Handling`
- [ ] T015 Buat `backend/utils/image.py` — fungsi `validate_image(file)`: cek MIME type (jpeg/png), cek ukuran (≤ 10MB), kembalikan bytes
- [ ] T016 Buat `backend/services/storage.py` — fungsi `upload_async(bytes, path)`: upload ke Firebase Storage secara fire-and-forget (asyncio task), tidak boleh blocking response
- [ ] T017 Buat `backend/routers/analyze.py` — implementasi `POST /analyze`: validasi request → validasi gambar → panggil gemini service → trigger storage upload async → kembalikan `ApiResponse`
- [ ] T018 Register router di `backend/main.py` + test manual via Postman: mode "plant" dengan 3 foto test (normal, buram, bukan tanaman)
- [ ] T019 [P] Test manual mode "label" dengan 5 foto label produk berbeda
- [ ] T020 [P] Test manual mode "both" dengan kombinasi foto tanaman + label
- [ ] T021 Fix bugs dari T018–T020, optimasi prompt jika output JSON tidak konsisten

---

## Phase 3: Frontend Core

**Goal**: UI mobile-first lengkap, terhubung ke backend, berjalan di smartphone.

- [ ] T022 [P] Buat `frontend/src/components/UploadZone.jsx` — support camera capture + galeri, preview foto, validasi ukuran client-side (>10MB tolak), compress ke ≤1MB menggunakan `browser-image-compression`
- [ ] T023 [P] Buat `frontend/src/components/LoadingState.jsx` — animasi loading dengan pesan rotasi: "Sedang menganalisis foto Anda...", "Mencocokkan pola penyakit...", "Menyiapkan rekomendasi..."
- [ ] T024 [P] Buat `frontend/src/components/ErrorState.jsx` — tampilkan pesan error dalam Bahasa Indonesia + tombol retry (untuk `retryable: true`) + tombol upload ulang
- [ ] T025 Buat `frontend/src/components/AnalysisResult.jsx` — tampilkan DiagnosisResult: nama penyakit (heading besar), badge confidence (warna sesuai level), badge urgensi (merah/oranye/hijau + ikon), deskripsi gejala, mekanisme penyebaran, disclaimer (teks kecil italic di bawah)
- [ ] T026 Buat `frontend/src/components/LabelResult.jsx` — tampilkan LabelInfo: nama produk, bahan aktif sebagai chips, dosis teknis + familiar (side by side), waktu aplikasi, target hama sebagai list, safety warnings dalam kotak merah muda
- [ ] T027 Buat `frontend/src/components/RecommendationCard.jsx` — tampilkan RecommendationCard: badge sesuai/tidak sesuai (hijau/merah), alasan, action steps sebagai numbered list berurutan
- [ ] T028 Buat `frontend/src/components/SummaryCard.jsx` — kartu ringkasan dengan: diagnosa + urgensi + 3 langkah utama + tombol Share (Web Share API) + tombol Simpan (screenshot via html2canvas)
- [ ] T029 Buat `frontend/src/services/api.js` — fungsi `analyze({mode, plantImage, labelImage})` sesuai kontrak di `api-contracts.md §Frontend API Service Contract`, termasuk `class ApiError`
- [ ] T030 Buat `frontend/src/hooks/useAnalysis.js` — state: `{ status, result, error }`, action: `runAnalysis(params)`, reset
- [ ] T031 Buat `frontend/src/pages/Home.jsx` — landing page: logo + tagline + 3 mode card (Analisis Tanaman, Baca Label, Analisis Lengkap) + tips foto
- [ ] T032 Buat `frontend/src/pages/Analysis.jsx` — flow: mode sudah dipilih → UploadZone → LoadingState → result cards (conditional render berdasarkan mode) → SummaryCard → tombol "Analisis Baru"
- [ ] T033 Buat `frontend/src/pages/History.jsx` — baca dari localStorage `leafguard_history`, tampilkan list AnalysisSession, klik untuk lihat ulang result (US5)
- [ ] T034 Buat `frontend/src/App.jsx` — React Router: `/` → Home, `/analyze` → Analysis, `/history` → History + bottom navigation bar

---

## Phase 4: Integration, QA & Deploy

**Goal**: App berjalan end-to-end di device sungguhan, siap demo.

- [ ] T035 End-to-end test semua 3 mode di Chrome Android + Safari iOS: upload foto nyata, verifikasi result tampil benar, verifikasi error handling
- [ ] T036 Lighthouse PWA audit: target ≥ 70 Performance, PWA installable check, fix issues
- [ ] T037 Re-deploy backend ke Cloud Run + frontend ke Firebase Hosting dengan environment production
- [ ] T038 Siapkan 3 demo scenario dengan foto test yang sudah diverifikasi hasilnya: (1) Wereng Cokelat, (2) Label PaddyShield, (3) Mode both terintegrasi

---

## Dependencies

```
T001 → T002 → T003 → T004 → T005 → T009 → T011
T001 → T006 → T007 → T008 → T010 → T011
T011 → T012 → T013 → T014 → T015 → T016 → T017 → T018
T018 → T019, T020 (paralel)
T019, T020 → T021
T001 → T022, T023, T024 (paralel, tidak tunggu T011)
T022–T024 → T025 → T026 → T027 → T028
T029 → T030 → T031 → T032 → T033 → T034
T021 + T034 → T035 → T036 → T037 → T038
```

---

## Parallel Execution Opportunities

- **T006, T007, T008** dapat dikerjakan bersamaan dengan T002–T005 (frontend setup paralel backend setup)
- **T022, T023, T024** (komponen UI primitif) dapat dikerjakan paralel setelah T001
- **T019, T020** (testing mode label dan both) dapat dikerjakan paralel setelah T018

---

## MVP Scope vs Nice-to-Have

| Task Range | Scope | Keterangan |
|---|---|---|
| T001–T034 | **MVP (Must)** | Selesaikan sebelum 9 Mei |
| T033 | **Optional** | History (US5) — skip jika mepet waktu |
| T028 | **Should** | SummaryCard share — prioritas setelah core |
| T035–T038 | **Must** | QA + deploy wajib sebelum submission |
