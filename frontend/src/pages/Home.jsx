import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ScanLine, Tag, Layers, Camera, Info } from 'lucide-react';

/**
 * Home — Landing page dengan mode selection (3 mode analisis).
 * Ref: spec.md §User Stories, tasks.md T031
 */

const ANALYSIS_MODES = [
  {
    id: 'plant',
    title: 'Analisis Tanaman',
    description: 'Foto daun atau batang padi untuk deteksi penyakit dan hama.',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200 hover:border-green-400',
  },
  {
    id: 'label',
    title: 'Baca Label',
    description: 'Foto label pestisida atau pupuk untuk penjelasan dosis dan keamanan.',
    icon: Tag,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
  },
  {
    id: 'both',
    title: 'Analisis Lengkap',
    description: 'Foto tanaman + label sekaligus untuk rekomendasi penanganan terpadu.',
    icon: Layers,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
  },
];

const PHOTO_TIPS = [
  'Pastikan pencahayaan cukup terang',
  'Fokuskan kamera pada bagian yang bermasalah',
  'Hindari foto buram atau terlalu jauh',
  'Untuk label, pastikan teks terbaca jelas',
];

export default function Home() {
  const navigate = useNavigate();

  const handleModeSelect = (modeId) => {
    navigate(`/analyze?mode=${modeId}`);
  };

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-4">
          <Leaf size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">LeafGuard Tani</h1>
        <p className="text-sm text-gray-500">
          Deteksi penyakit tanaman padi dari foto smartphone Anda
        </p>
      </div>

      {/* Mode Selection */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 px-1">
          Pilih Mode Analisis
        </h2>
        <div className="space-y-3">
          {ANALYSIS_MODES.map(({ id, title, description, icon: Icon, color, bgColor, borderColor }) => (
            <button
              key={id}
              onClick={() => handleModeSelect(id)}
              className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 
                         transition-all duration-200 text-left
                         active:scale-[0.98] min-h-[44px]
                         ${borderColor} bg-white hover:shadow-md`}
            >
              <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon size={24} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-snug">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tips Foto */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Camera size={18} className="text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-800">Tips Foto yang Baik</h3>
        </div>
        <ul className="space-y-1.5">
          {PHOTO_TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-400 mt-1 text-xs">●</span>
              <span className="text-sm text-amber-700">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-2 px-1">
        <Info size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400 italic leading-relaxed">
          Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan.
        </p>
      </div>
    </div>
  );
}
