import React from 'react';
import {
  Package,
  FlaskConical,
  Droplets,
  CalendarClock,
  Target,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

/**
 * LabelResult — Card interpretasi label produk pertanian (OCR).
 * Menampilkan nama produk, bahan aktif, dosis, timing, target hama, dan safety warnings.
 *
 * @param {Object} props
 * @param {Object} props.labelInfo - LabelInfo dari backend/mock
 */

export default function LabelResult({ labelInfo }) {
  if (!labelInfo) return null;

  const {
    product_name,
    active_ingredients,
    dose_technical,
    dose_familiar,
    application_timing,
    target_pests,
    safety_warnings,
    confidence_notes,
  } = labelInfo;

  return (
    <div className="animate-slide-up">
      <div className="card border-l-4 border-l-blue-500 overflow-hidden">

        {/* Header: Product name */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Package size={22} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-0.5">
              Produk Terdeteksi
            </p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">
              {product_name}
            </h2>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100 -mx-4 mb-4" />

        {/* Bahan Aktif — as chips */}
        {active_ingredients && active_ingredients.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2.5">
              <FlaskConical size={16} className="text-purple-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-700">Bahan Aktif</h3>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {active_ingredients.map((ingredient, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 
                             bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
                >
                  {ingredient.name}
                  <span className="text-purple-400 text-xs">
                    {ingredient.concentration}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dosis — teknis + familiar side by side */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Droplets size={16} className="text-cyan-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-gray-700">Dosis</h3>
          </div>
          <div className="grid grid-cols-1 gap-2 pl-6">
            {/* Dosis teknis */}
            <div className="bg-gray-50 rounded-xl px-3.5 py-2.5">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                Sesuai Label
              </p>
              <p className="text-sm text-gray-700 font-medium">
                {dose_technical}
              </p>
            </div>
            {/* Dosis familiar */}
            <div className="bg-primary-light rounded-xl px-3.5 py-2.5 border border-green-200">
              <p className="text-[11px] font-medium text-primary uppercase tracking-wider mb-0.5">
                Takaran Mudah
              </p>
              <p className="text-sm text-primary font-semibold">
                {dose_familiar}
              </p>
            </div>
          </div>
        </div>

        {/* Waktu Aplikasi */}
        {application_timing && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock size={16} className="text-amber-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-700">Waktu Aplikasi</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed pl-6">
              {application_timing}
            </p>
          </div>
        )}

        {/* Target Hama */}
        {target_pests && target_pests.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Target size={16} className="text-orange-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-700">Sasaran Hama/Penyakit</h3>
            </div>
            <div className="flex flex-wrap gap-2 pl-6">
              {target_pests.map((pest, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 
                             bg-orange-50 text-orange-700 rounded-lg text-sm"
                >
                  {pest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Safety Warnings — SELALU tampilkan */}
        {safety_warnings && safety_warnings.length > 0 && (
          <div className="mt-2">
            <div className="bg-red-50 rounded-xl p-3.5 border border-red-100">
              <div className="flex items-center gap-2 mb-2.5">
                <ShieldAlert size={16} className="text-red-500 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-red-700">Peringatan Keselamatan</h3>
              </div>
              <ul className="space-y-2">
                {safety_warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-red-700 leading-snug">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Confidence Notes — info sumber data (OCR vs AI knowledge) */}
        {confidence_notes && confidence_notes.length > 15 && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed italic">
              {confidence_notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
