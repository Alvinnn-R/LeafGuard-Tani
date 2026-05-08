import React from 'react';
import { User, Leaf } from 'lucide-react';

/**
 * Profile — Halaman profil/tentang aplikasi.
 * Menampilkan info app, versi, dan disclaimer.
 */
export default function Profile() {
  return (
    <div className="px-5 py-6 pb-safe-nav">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <img src="/logo/logo_1.svg" alt="LeafGuard Tani" className="h-28 mx-auto mb-2" />
        <p className="text-xs text-gray-400 mt-1">Versi 1.0.0</p>
      </div>

      {/* About card */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Tentang Aplikasi</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          LeafGuard Tani membantu petani padi mendeteksi penyakit tanaman dan
          menginterpretasi label produk pertanian menggunakan teknologi AI —
          cukup dengan satu foto dari smartphone.
        </p>
      </div>

      {/* Tech card */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Teknologi</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Ditenagai oleh Gemini 1.5 Flash — model AI multimodal dari Google
          untuk analisis gambar dan OCR secara real-time.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="card bg-amber-50 border-amber-200">
        <h2 className="text-sm font-semibold text-amber-800 mb-2">Disclaimer</h2>
        <p className="text-sm text-amber-700 leading-relaxed italic">
          Hasil analisis dari aplikasi ini adalah diagnosa awal.
          Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan.
        </p>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center mt-8">
        Dibuat untuk Mini Hackathon ANTIGRAVITY — GDG Surabaya 2026
      </p>
    </div>
  );
}
