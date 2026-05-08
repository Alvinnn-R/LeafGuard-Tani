import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ScanLine, Tags, Layers, Camera, Sun, Maximize } from 'lucide-react';

/**
 * Home — Landing page dengan mode selection.
 * User memilih 1 dari 3 mode analisis, lalu navigasi ke /analyze?mode=xxx
 *
 * Flow (constitution §1): Home → pilih mode → Analysis ≤ 3 tap
 */

const MODES = [
  {
    id: 'plant',
    title: 'Analisis Tanaman',
    description: 'Foto daun atau batang padi untuk diagnosa penyakit dan tingkat urgensi',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    accentColor: 'from-green-500 to-emerald-600',
  },
  {
    id: 'label',
    title: 'Baca Label Produk',
    description: 'Foto label pestisida atau pupuk untuk penjelasan dosis dan cara pakai',
    icon: Tags,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    accentColor: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'both',
    title: 'Analisis Lengkap',
    description: 'Foto tanaman + label sekaligus untuk rekomendasi penanganan terpadu',
    icon: Layers,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    accentColor: 'from-purple-500 to-violet-600',
  },
];

const PHOTO_TIPS = [
  {
    icon: Camera,
    text: 'Arahkan kamera langsung ke bagian yang bermasalah',
  },
  {
    icon: Sun,
    text: 'Pastikan cahaya cukup terang, hindari bayangan',
  },
  {
    icon: Maximize,
    text: 'Foto dari jarak 20–30 cm agar detail terlihat jelas',
  },
];

export default function Home() {
  const navigate = useNavigate();

  const handleSelectMode = (modeId) => {
    navigate(`/analyze?mode=${modeId}`);
  };

  return (
    <div className="px-5 py-6 pb-safe-nav">

      {/* Hero section */}
      <div className="text-center mb-8">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 
                        rounded-2xl bg-gradient-to-br from-primary to-emerald-600 
                        shadow-lg shadow-primary/25 mb-4">
          <Leaf size={32} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          LeafGuard Tani
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          Deteksi penyakit tanaman padi dan interpretasi label produk pertanian — cukup dari foto.
        </p>
      </div>

      {/* Mode selection cards */}
      <div className="space-y-3 mb-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">
          Pilih Mode Analisis
        </h2>

        {MODES.map((mode) => {
          const ModeIcon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className={`
                w-full card border ${mode.borderColor}
                flex items-start gap-4 text-left
                hover:shadow-md hover:scale-[1.01]
                active:scale-[0.99]
                transition-all duration-200 ease-out
                min-h-[44px]
              `}
            >
              {/* Icon */}
              <div className={`
                w-12 h-12 rounded-xl ${mode.bgColor} 
                flex items-center justify-center flex-shrink-0
              `}>
                <ModeIcon size={24} className={mode.color} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 py-0.5">
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                  {mode.title}
                </h3>
                <p className="text-sm text-gray-500 leading-snug">
                  {mode.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center w-8 h-12 flex-shrink-0">
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="text-gray-300">
                  <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Photo tips */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-amber-800 mb-3">
          💡 Tips Foto yang Baik
        </h3>
        <ul className="space-y-2.5">
          {PHOTO_TIPS.map((tip, idx) => {
            const TipIcon = tip.icon;
            return (
              <li key={idx} className="flex items-start gap-3">
                <TipIcon size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-amber-700 leading-snug">{tip.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
