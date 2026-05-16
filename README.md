# LeafGuard Tani 🌾
Tagline: Autonomous AI Agent untuk Deteksi Dini Hama, Interpretasi Label Produk, 
dan Rekomendasi Penanganan Tanaman Padi

---

## Tentang Proyek
LeafGuard Tani hadir untuk membantu para petani padi di Indonesia mengatasi tantangan dalam mendeteksi dan menangani penyakit serta hama tanaman. Seringkali petani kebingungan mengidentifikasi penyakit apa yang menyerang tanamannya dan produk pestisida atau pupuk apa yang tepat untuk digunakan. 

Solusi ini dikemas sebagai PWA (Progressive Web App) agar dapat langsung diakses melalui browser tanpa perlu instalasi aplikasi, menghemat ruang penyimpanan di perangkat petani yang seringkali terbatas, namun tetap terasa seperti aplikasi native yang responsif. LeafGuard Tani memadukan kekuatan AI untuk menganalisis gambar tanaman yang sakit dan label produk pertanian secara bersamaan untuk memberikan solusi penanganan terbaik secara real-time.

## Cara Kerja Aplikasi
1. **User membuka browser** → Frontend React memuat halaman dan UI secara dinamis.
2. **User upload foto** → Bisa berupa foto tanaman padi, label kemasan produk pertanian, atau keduanya. Foto dikompresi di sisi browser untuk menghemat kuota, lalu dikirim ke Backend API via HTTP POST.
3. **Backend terima foto** → Sistem melakukan validasi tahap awal via fitur AI Gemini (`_prevalidate_image`) untuk memastikan foto yang diunggah benar-benar tanaman padi atau produk pertanian.
4. **Analisis Multimodal** → Jika valid, foto diteruskan ke Gemini 2.5 Flash untuk analisis multimodal secara mendalam sesuai instruksi domain ahli penyakit padi (BBPOPT 2020).
5. **Parsing Hasil** → Gemini mengembalikan JSON terstruktur. Backend melakukan parsing (menggunakan `json-repair` untuk memastikan validitas) dan menerapkan aturan *fallback*.
6. **Tampilan ke User** → Hasil dikirim kembali ke Frontend untuk ditampilkan ke user dengan UI yang jelas dan informatif.
7. **Penyimpanan Asinkron** → Secara background (fire-and-forget), backend mengunggah foto dan menyimpan data hasil analisis ke database Supabase agar mempercepat respons ke user.

**Fitur Sistem Tambahan:**
- **Multi-key rotation:** Backend dapat memproses antrean `GEMINI_API_KEY_1` hingga `GEMINI_API_KEY_10`. Jika ada limit kuota atau limit per menit, sistem akan beralih ke kunci berikutnya secara otomatis.
- **Dual Analysis:** Memungkinkan user mengirim 2 foto sekaligus (tanaman dan label). Sistem memanggil Gemini dengan instruksi gabungan dan menghasilkan keputusan kecocokan (`product_suitable: true/false`).
- **Anonymous Device History:** Menggunakan sistem `crypto.randomUUID` yang disimpan di `localStorage` (sebagai `X-Device-Id`). History di server akan terikat pada ID anonim ini, sehingga user bisa melihat riwayat cek sebelumnya tanpa sistem autentikasi rumit.

## Fitur Utama
1. **Deteksi Penyakit Tanaman**
   - **Input:** Foto daun, batang, atau malai tanaman padi.
   - **Proses:** Gemini Vision menganalisis gejala visual.
   - **Output:** Identifikasi penyakit dari daftar 20 taksonomi standar BBPOPT 2020, tingkat urgensi penanganan, dan detail rekomendasi tindakan teknis.
2. **OCR Label Produk Pertanian**
   - **Input:** Foto label kemasan pestisida, herbisida, fungisida, atau pupuk.
   - **Proses:** Gemini melakukan ekstraksi teks secara cerdas (OCR) dan menginterpretasi instruksinya menggunakan Knowledge Base internal.
   - **Output:** Nama produk, daftar bahan aktif, target hama, peringatan keamanan, dosis anjuran, dan waktu aplikasi dalam bahasa yang disederhanakan.
3. **Analisis Gabungan (Dual Analysis)**
   - **Input:** Foto tanaman padi DAN foto label produk secara bersamaan.
   - **Proses:** Satu panggilan Gemini dengan kedua konteks gambar untuk dievaluasi keterkaitannya.
   - **Output:** Hasil deteksi penyakit, interpretasi label, dan satu tambahan evaluasi kecocokan apakah produk ini disarankan untuk menyembuhkan penyakit tersebut (`product_suitable`).

## Tech Stack
| Bagian | Teknologi |
|--------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS 3 + PWA (vite-plugin-pwa) |
| **Backend** | Python 3.11 + FastAPI + Uvicorn |
| **AI** | Gemini 2.5 Flash (via `google-genai` SDK) |
| **Database & Storage** | Supabase (PostgREST API + Storage) |
| **Deployment** | Backend: Vercel  <br> Frontend: Vercel |

## Struktur Folder
Berikut adalah struktur direktori utama dari repository ini:

```
leafguard-tani/
├── backend/
│   ├── main.py              — Entry point FastAPI
│   ├── routers/             — Endpoint definisi (analyze.py, history.py)
│   ├── services/            — Integrasi Gemini AI, Supabase DB & Storage
│   ├── models/              — Pydantic schema validation
│   ├── utils/               — Image validation
│   ├── prompts/             — Sistem prompt domain penyakit padi
│   ├── Dockerfile           — Untuk deploy via kontainer
│   ├── vercel.json          — Konfigurasi deployment Vercel
│   └── requirements.txt     — Daftar pustaka Python
├── frontend/
│   ├── src/
│   │   ├── components/      — Komponen React (UI, Card, dll)
│   │   ├── pages/           — Halaman utama
│   │   └── main.jsx         — Entry point React
│   ├── public/              — Static assets + PWA manifest
│   ├── package.json         — Script dan npm dependencies
│   ├── tailwind.config.js   — Konfigurasi desain dan warna
│   └── vite.config.js       — Pengaturan Vite & build
├── .agents/
│   └── workflows/           — Dokumen perencanaan internal dan workflow agent
├── RUN_LOCAL.md             — Petunjuk tambahan jalankan lokal
└── README.md                — Dokumentasi proyek ini
```

## Prasyarat
Sebelum menjalankan proyek di lingkungan lokal, pastikan sudah terinstall perangkat lunak berikut:
- **Python 3.11** atau lebih baru
- **Node.js 18** atau lebih baru
- `pip` dan `npm`
- Akun Google AI Studio untuk mendapatkan Gemini API Key
- Akun Supabase untuk fitur database histori dan penyimpanan foto
- (Opsional) Docker jika ingin mensimulasikan deployment lokal

## Instalasi & Menjalankan Lokal

### 1. Clone Repository
```bash
git clone https://github.com/WaySTN/LeafGuard-Tani.git
cd LeafGuard-Tani
```

### 2. Setup Backend
1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Buat virtual environment Python dan aktifkan:
   ```bash
   python -m venv venv
   # Di Windows:
   venv\Scripts\activate
   # Di Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy konfigurasi environment:
   ```bash
   cp .env.example .env
   ```
5. Isi variabel di dalam file `.env` (lihat referensi Konfigurasi Environment di bawah).
6. Jalankan server backend:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Setup Frontend
1. Buka terminal baru dan arahkan ke folder frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies node:
   ```bash
   npm install
   ```
3. Buat file `.env` (berdasarkan informasi API lokal):
   ```bash
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```
4. Jalankan development server:
   ```bash
   npm run dev
   ```
5. Akses aplikasi dari browser di `http://localhost:5173`.

### 4. Setup Database Supabase
1. Buat project baru di Supabase.
2. Atur tabel `history` (dengan kolom terkait `session_id`, `mode`, `result`, dll) dan bucket storage.
3. Salin URL REST (Supabase URL) dan kunci `service_role` dari Supabase dashboard.
4. Paste konfigurasi URL dan kunci tersebut ke dalam file `.env` pada folder backend.

## Konfigurasi Environment

### Backend — `.env`
| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `GEMINI_API_KEY_1` s/d `GEMINI_API_KEY_10` | Ya | Daftar Google AI Studio API Key untuk bypass rate-limits (setidaknya isi `GEMINI_API_KEY_1`). |
| `SUPABASE_URL` | Tidak* | URL endpoint REST Supabase. (Jika tidak diisi, history tidak akan tersimpan). |
| `SUPABASE_SERVICE_ROLE_KEY` | Tidak* | Kunci akses service role dari Supabase. |
| `FIREBASE_STORAGE_BUCKET` | Tidak | Opsi storage legacy. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Tidak | Opsi storage legacy (path JSON). |
| `PORT` | Tidak | Port yang akan di-bind (default 8080/8000). |
| `ENVIRONMENT` | Tidak | "development" atau "production". |
| `FRONTEND_URL` | Tidak | URL frontend untuk izin CORS (misal: `https://app.vercel.app`). |

### Frontend — `.env`
| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `VITE_API_URL` | Ya | URL lengkap ke Backend FastAPI. |

## Deployment

### Backend ke Vercel (Atau Cloud Run)
Backend dilengkapi dengan `vercel.json` dan siap di-deploy secara serverless ke Vercel:
1. Hubungkan repository GitHub ini ke Vercel.
2. Di Vercel, pilih direktori root `backend`.
3. Masukkan seluruh environment variable dari backend `.env`.
4. Vercel akan membaca spesifikasi `vercel.json` dan otomatis melayani FastAPI.

*Jika ingin mendeploy ke Cloud Run, gunakan Dockerfile bawaan:*
```bash
# Build image
docker build -t leafguard-backend ./backend
# Push dan deploy (Contoh GCP Command)
gcloud run deploy leafguard-backend --source ./backend --region asia-southeast2 --allow-unauthenticated
```

### Frontend ke Vercel
1. Buat project baru di Vercel dan hubungkan repository yang sama.
2. Ubah konfigurasi Root Directory ke folder `frontend`.
3. Framework preset akan dideteksi otomatis sebagai Vite.
4. Tambahkan environment variable `VITE_API_URL` mengarah ke URL produksi backend Vercel/Cloud Run.
5. Deploy dari branch `main`.

## API Endpoint
Daftar endpoint REST yang tersedia di backend LeafGuard Tani:

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/` | Informasi dasar layanan API |
| GET | `/health` | Pemeriksaan status liveness probe server |
| POST | `/analyze` | Analisis foto tanaman/label (Mengirim form dengan mode `plant`, `label`, atau `both`) |
| GET | `/history` | Ambil daftar riwayat analisis secara keseluruhan (dapat difilter dengan `X-Device-Id` header) |
| GET | `/history/{history_id}` | Ambil detail riwayat lengkap berdasarkan ID riwayat spesifik |

## Catatan Teknis Penting
- **Multi-key rotation:** Sistem backend memiliki konfigurasi otomatis untuk beralih (rotate) kunci API jika sebuah `GEMINI_API_KEY` terkena *rate limit* atau telah habis kuotanya.
- **Pre-validation gate:** Setiap gambar secara mandiri divalidasi dan "ditolak" di tahap awal jika bukan bagian dari sektor pertanian (misalnya diunggah gambar ruangan, pembersih lantai, dll) untuk menjaga fokus AI dan efisiensi sumber daya.
- **Graceful degradation:** Modul database pada backend dirancang secara toleran; jika kredensial database tidak valid atau belum diisi, analisis AI tetap berjalan lancar namun riwayat analisis sekadar diabaikan dari penyimpanan.
- **Image compression:** Agar performa tetap optimal bagi petani di wilayah koneksi rendah, proses kompresi foto selalu dilakukan di sisi peramban pengguna melalui `browser-image-compression`.
- **JSON Repair:** Respons JSON mentah yang dikembalikan oleh LLM sering rentan cacat penulisan. API menggunakan modul `json-repair` secara universal guna merapikan JSON malformed sebelum diteruskan ke validasi Pydantic.

## Lisensi
MIT License

## Tim
- **Nama Aplikasi:** LeafGuard Tani
- **Anggota Tim:** Wahyu Setiawan & Alvin Rama Saputra
- **Kompetisi:** Mini Hackathon Antigravity — Google Developer Groups Surabaya 2026
- **Tema:** Personalized Agri-Tech Monitoring (Agriculture)