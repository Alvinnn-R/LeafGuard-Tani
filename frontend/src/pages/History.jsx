import React from 'react';
import { Clock } from 'lucide-react';

/**
 * History — Placeholder history page.
 * Akan dibangun di Sprint 4 (T-FE-24, low priority).
 */
export default function History() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
        <Clock size={32} className="text-primary" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Riwayat</h1>
      <p className="text-sm text-gray-500 text-center">
        Halaman riwayat akan dibangun di sprint berikutnya.
      </p>
    </div>
  );
}
