import React from 'react';
import { Leaf } from 'lucide-react';

/**
 * Home — Placeholder landing page.
 * Akan dibangun lengkap di Sprint 3 (T-FE-17).
 */
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
        <Leaf size={32} className="text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">LeafGuard Tani</h1>
      <p className="text-sm text-gray-500 text-center">
        Deteksi penyakit tanaman padi dari foto smartphone Anda.
      </p>
    </div>
  );
}
