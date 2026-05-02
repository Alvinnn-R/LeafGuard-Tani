# LeafGuard Tani — Project Constitution

**Version**: 1.0.0
**Ratification Date**: 2026-05-02
**Last Amended**: 2026-05-02
**Project**: LeafGuard Tani (1-leafguard-tani-core)

---

## Preamble

Konstitusi ini mendefinisikan prinsip-prinsip yang tidak dapat dinegosiasikan dalam pengembangan LeafGuard Tani. Setiap keputusan desain, implementasi, dan UX harus divalidasi terhadap prinsip-prinsip ini. Jika ada konflik antara fitur baru dan konstitusi, **konstitusi yang menang** — bukan sebaliknya.

---

## Prinsip 1: Zero Friction First

**MUST**: Setiap fitur yang membutuhkan lebih dari 3 tap dari home screen untuk menyelesaikan analisis pertama harus ditolak atau disederhanakan.

**MUST NOT**: Meminta user melakukan registrasi, login, atau pengisian form apapun sebelum dapat menggunakan fitur utama.

**Rationale**: Petani di sawah tidak punya waktu untuk navigasi kompleks. Jika apps terlalu ribet, mereka tidak akan menggunakannya.

---

## Prinsip 2: Bahasa Indonesia Always

**MUST**: Semua teks yang ditampilkan kepada user — label tombol, pesan error, loading text, hasil analisis AI, peringatan, onboarding — harus dalam Bahasa Indonesia.

**MUST NOT**: Menampilkan teks dalam Bahasa Inggris di UI, termasuk label teknis seperti "loading...", "error", atau "submit".

**MUST**: Semua field human-readable dalam JSON response dari Gemini harus dalam Bahasa Indonesia.

**Rationale**: Target pengguna adalah petani di Jawa Timur. Bahasa Inggris menciptakan barrier yang tidak perlu.

---

## Prinsip 3: No PII Without Consent

**MUST NOT**: Mengumpulkan nama, nomor telepon, lokasi GPS, atau identitas apapun dari user tanpa persetujuan eksplisit.

**MUST NOT**: Menyimpan foto user secara permanen di server tanpa persetujuan eksplisit.

**MUST**: Menggunakan session-scoped random UUID untuk path Firebase Storage (bukan nama file asli).

**MUST**: Tidak ada analytics tracking yang mengidentifikasi individu di MVP.

**Rationale**: Kepercayaan petani adalah aset utama. Data pertanian bisa sensitif secara ekonomi.

---

## Prinsip 4: Disclaimer Non-Negotiable

**MUST**: Setiap output diagnosa penyakit tanaman HARUS menyertakan disclaimer:
> *"Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan."*

**MUST NOT**: Disclaimer ini boleh dihilangkan, diperpendek, atau diganti — bahkan jika confidence AI sangat tinggi.

**MUST NOT**: AI boleh merepresentasikan dirinya sebagai pengganti penyuluh pertanian profesional.

**Rationale**: Keputusan pertanian yang salah bisa berdampak ekonomi serius bagi petani. Ini adalah safeguard minimal.

---

## Prinsip 5: Graceful Degradation

**MUST**: Setiap state kegagalan (network error, AI error, invalid image, timeout) harus menampilkan:
  1. Pesan yang menjelaskan apa yang terjadi (dalam Bahasa Indonesia, bukan kode error teknis)
  2. Satu aksi yang bisa dilakukan user selanjutnya (retry, upload ulang, dll.)

**MUST NOT**: App menampilkan layar kosong, error page blank, atau stack trace kepada user.

**MUST**: Firebase Storage upload bersifat async non-blocking — kegagalan upload TIDAK boleh mencegah result analisis ditampilkan.

**Rationale**: Koneksi di area pertanian tidak stabil. Error yang tidak ditangani membuat user berpikir app rusak.

---

## Prinsip 6: Mobile-First, Always

**MUST**: Semua komponen didesain dan ditest pada viewport 360px width terlebih dahulu sebelum ukuran lain.

**MUST**: Semua interactive elements memiliki touch target minimum 44×44px.

**MUST**: Body text minimum 16px — tidak boleh ada teks yang harus di-zoom untuk dibaca.

**MUST NOT**: Menggunakan hover-only interactions sebagai satu-satunya cara mengakses informasi penting.

**Rationale**: Petani menggunakan smartphone kelas menengah ke bawah. Desktop adalah secondary concern.

---

## Amendment Procedure

1. Perubahan pada konstitusi ini membutuhkan diskusi eksplisit antara semua anggota tim
2. Setiap amendment harus memiliki rationale yang jelas
3. Increment `Version` sesuai semantic versioning (MAJOR: perubahan prinsip, MINOR: tambah prinsip, PATCH: klarifikasi)
4. Update `Last Amended` ke tanggal perubahan
5. Catat perubahan di `CHANGELOG` di bawah

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-05-02 | Initial constitution — 6 prinsip dasar |
