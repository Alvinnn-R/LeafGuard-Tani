import React from 'react';
import { ScanLine } from 'lucide-react';

/**
 * Analysis — Placeholder analysis page.
 * Akan dibangun lengkap di Sprint 3 (T-FE-18).
 */
export default function Analysis() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4">
        <ScanLine size={32} className="text-primary" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Analisis</h1>
      <p className="text-sm text-gray-500 text-center">
        Halaman analisis akan dibangun di sprint berikutnya.
      </p>
    </div>
  );
}
