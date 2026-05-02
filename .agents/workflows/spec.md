# LeafGuard Tani — Feature Specification

**Version**: 1.0.0
**Created**: 2026-05-02
**Feature Branch**: `1-leafguard-tani-core`
**Status**: Ready for Planning

---

## Overview

LeafGuard Tani adalah autonomous AI agent berbasis PWA yang membantu petani padi mendeteksi penyakit tanaman, menginterpretasi label produk pertanian, dan mendapat rekomendasi penanganan — hanya dari satu foto smartphone.

**Problem**: Petani padi di Jawa Timur kehilangan 15–20% produksi tahunan akibat hama/penyakit yang terlambat ditangani. Jeda antara "melihat gejala" dan "tindakan tepat" rata-rata 3–7 hari.

**Solution**: Memangkas jeda itu menjadi < 5 menit menggunakan multimodal AI (Gemini 1.5 Flash) — tanpa install, tanpa login, tanpa perangkat khusus.

**Scope**: MVP untuk Mini Hackathon ANTIGRAVITY (GDG Surabaya, deadline: 9 Mei 2026). Fokus pada padi (*Oryza sativa*) konteks Jawa Timur.

---

## Actors

| Actor | Deskripsi | Goal Utama |
|---|---|---|
| **Petani** | Petani padi, literasi smartphone dasar, koneksi terbatas di sawah | Dapat diagnosa cepat tanpa perlu agronomis |
| **Penyuluh** | Petugas penyuluhan pertanian (post-MVP) | Validasi dan tindak lanjut kasus yang terflag |

**Primary actor MVP**: Petani.

---

## User Stories

### US1 — Deteksi Penyakit Tanaman (P1 — Must Have)
> Sebagai petani, saya ingin mengunggah foto daun/batang padi dan mendapat diagnosa AI segera, supaya saya tahu masalahnya dan seberapa mendesak.

**Acceptance Criteria:**
- Sistem mengidentifikasi penyakit/hama dari daftar scope berdasarkan foto yang jelas
- Output mencakup: nama penyakit, tingkat keyakinan (Tinggi/Sedang/Rendah), deskripsi gejala, tingkat urgensi (Segera / 2–3 hari / Pantau), penjelasan mekanisme penyebaran
- Foto bukan tanaman padi atau terlalu buram → pesan error jelas + panduan foto ulang
- Analisis selesai ≤ 5 detik pada koneksi 4G
- Semua output dalam Bahasa Indonesia

### US2 — OCR & Interpretasi Label Produk (P1 — Must Have)
> Sebagai petani, saya ingin memotret label pestisida/pupuk dan mendapat penjelasan dalam bahasa sederhana, supaya saya bisa menggunakannya dengan benar dan aman.

**Acceptance Criteria:**
- Output mencakup: nama produk, bahan aktif, dosis dalam satuan familiar (sendok makan, tutup botol), waktu aplikasi, target hama/tanaman, peringatan keselamatan
- Label teks kecil atau sebagian tertutup → ekstraksi best-effort dengan catatan field yang low-confidence
- Analisis selesai ≤ 5 detik pada koneksi 4G

### US3 — Rekomendasi Penanganan Terpadu (P2 — Should Have)
> Sebagai petani, saya ingin mengunggah foto tanaman + foto label sekaligus, supaya AI memberi tahu apakah produk yang saya punya tepat untuk masalah yang terdeteksi.

**Acceptance Criteria:**
- Sistem melakukan cross-reference penyakit terdeteksi vs target produk
- Output menyatakan jelas: "Produk sesuai / tidak sesuai untuk masalah yang terdeteksi"
- Jika tidak sesuai, sistem merekomendasikan jenis produk yang tepat
- Disajikan sebagai action card dengan 3–5 langkah konkret untuk 24 jam ke depan

### US4 — Summary Card (P2 — Should Have)
> Sebagai petani, saya ingin mendapat kartu ringkasan yang bisa disimpan/dibagikan via WhatsApp.

**Acceptance Criteria:**
- Kartu berisi: nama diagnosa, badge urgensi, 3–5 langkah tindakan, rekomendasi produk
- Dapat dibagikan via native share API (WhatsApp, dll.)

### US5 — Riwayat Analisis (P3 — Nice to Have)
> Sebagai petani yang kembali ke app, saya ingin melihat analisis sebelumnya untuk memantau kesehatan lahan dari waktu ke waktu.

**Acceptance Criteria:**
- Riwayat disimpan di localStorage (tidak perlu login)
- Tampilkan: tanggal, thumbnail, nama diagnosa
- User bisa membuka kembali hasil lama

---

## Out of Scope (MVP)

- Autentikasi / akun pengguna
- Persistent server-side history (Firestore untuk US5 → localStorage saja)
- Push notification / peringatan proaktif
- Komoditas selain padi
- Dashboard penyuluh
- Input sensor IoT
- Full offline mode
- Fine-tuned model training
- Dark mode / multi-bahasa

---

## Assumptions

1. Petani memiliki smartphone Android/iOS dengan kamera dan browser
2. Koneksi tersedia saat analisis (minimum 2G, tipikal 4G)
3. Gemini 1.5 Flash free tier cukup untuk volume demo hackathon (<1000 request)
4. Firebase free tier (Spark Plan) cukup untuk storage + hosting
5. Foto diambil dalam cahaya cukup — kegelapan ekstrem adalah edge case
6. Bahasa app: Bahasa Indonesia saja

---

## Clarifications

### Session 2026-05-02
- Q: Apakah riwayat analisis disimpan server-side atau client-side? → A: Client-side saja (localStorage) untuk MVP.
- Q: Berapa maksimal foto per sesi? → A: 2 foto per sesi (1 tanaman + 1 label).
- Q: Apakah support dark mode? → A: Tidak untuk MVP. Satu light theme.
