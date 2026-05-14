import React from 'react';
import {
  AlertTriangle,
  Clock,
  Eye,
  Activity,
  Wind,
  ShieldCheck,
  Leaf,
  Info,
  Bug,
  MapPin,
  AlertCircle,
  Shield,
  Wrench,
  BookOpen,
} from 'lucide-react';

/**
 * AnalysisResult — Card hasil diagnosa penyakit tanaman.
 * Menampilkan: nama penyakit, patogen, confidence, urgency, gejala,
 * bagian terinfeksi, penyebaran, faktor epidemi, langkah pengendalian,
 * referensi, dan disclaimer.
 *
 * Rules (CLAUDE.md §8):
 * - Urgency: SELALU 3 indikator (color + icon + text)
 * - Disclaimer: SELALU ditampilkan, teks hardcoded
 *
 * @param {Object} props
 * @param {Object} props.diagnosis - DiagnosisResult dari backend
 */

/**
 * Konfigurasi visual urgency — SELALU pakai 3 indikator
 */
const URGENCY_CONFIG = {
  IMMEDIATE: {
    icon: AlertTriangle,
    label: 'Segera Ditangani',
    badgeClass: 'badge-immediate',
    borderClass: 'border-l-red-500',
    bgClass: 'bg-red-50',
  },
  HIGH: {
    icon: AlertTriangle,
    label: 'Tangani 2–3 Hari',
    badgeClass: 'badge-within3days',
    borderClass: 'border-l-orange-500',
    bgClass: 'bg-orange-50',
  },
  MEDIUM: {
    icon: Clock,
    label: 'Pantau & Tindak 1 Minggu',
    badgeClass: 'badge-within3days',
    borderClass: 'border-l-yellow-500',
    bgClass: 'bg-yellow-50',
  },
  LOW: {
    icon: Eye,
    label: 'Observasi',
    badgeClass: 'badge-monitor',
    borderClass: 'border-l-green-500',
    bgClass: 'bg-green-50',
  },
  // Legacy aliases
  WITHIN_3_DAYS: {
    icon: Clock,
    label: 'Tangani 2–3 Hari',
    badgeClass: 'badge-within3days',
    borderClass: 'border-l-orange-500',
    bgClass: 'bg-orange-50',
  },
  MONITOR: {
    icon: Eye,
    label: 'Pantau',
    badgeClass: 'badge-monitor',
    borderClass: 'border-l-green-500',
    bgClass: 'bg-green-50',
  },
};

/**
 * Konfigurasi visual confidence — berdasarkan persentase
 */
const CONFIDENCE_CONFIG = {
  HIGH: {
    badgeClass: 'badge-high',
  },
  MEDIUM: {
    badgeClass: 'badge-medium',
  },
  LOW: {
    badgeClass: 'badge-low',
  },
};

/**
 * Generate label akurasi berdasarkan confidence_score.
 * Contoh: "Akurasi 85%" atau "Akurasi 0%"
 */
function getConfidenceLabel(score) {
  const pct = Math.round((score || 0) * 100);
  return `Akurasi Gejala ${pct}%`;
}

/**
 * Tentukan apakah hasil analisis seharusnya ditampilkan sebagai "Sehat".
 * Kondisi: is_healthy=true ATAU confidence_score sangat rendah (<=5%)
 * dan disease_id UNKNOWN.
 */
function shouldShowAsHealthy(diagnosis) {
  if (diagnosis.is_healthy) return true;
  if ((diagnosis.confidence_score || 0) <= 0.05 && diagnosis.disease_id === 'UNKNOWN') return true;
  return false;
}

export default function AnalysisResult({ diagnosis }) {
  if (!diagnosis) return null;

  const {
    disease_name,
    confidence,
    confidence_score,
    urgency,
    symptom_description,
    spread_mechanism,
    disclaimer,
    // Extended BBPOPT fields
    pathogen,
    pathogen_type,
    affected_part,
    epidemic_factors,
    control_measures,
    reference,
  } = diagnosis;

  // Cek apakah harus ditampilkan sebagai "Sehat"
  const isHealthy = shouldShowAsHealthy(diagnosis);
  const displayName = isHealthy ? 'Tanaman Terlihat Sehat' : disease_name;

  const urgencyConfig = isHealthy
    ? URGENCY_CONFIG.MONITOR
    : (URGENCY_CONFIG[urgency] || URGENCY_CONFIG.MONITOR);
  const confidenceConfig = CONFIDENCE_CONFIG[confidence] || CONFIDENCE_CONFIG.MEDIUM;
  const UrgencyIcon = urgencyConfig.icon;

  return (
    <div className="animate-slide-up">
      {/* Main card */}
      <div className={`card border-l-4 ${urgencyConfig.borderClass} overflow-hidden`}>

        {/* Header: Disease name + badges */}
        <div className="mb-4">
          {/* Disease name */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              ${isHealthy ? 'bg-green-100' : 'bg-red-50'}
            `}>
              {isHealthy
                ? <ShieldCheck size={22} className="text-green-600" />
                : <Activity size={22} className="text-red-500" />
              }
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {displayName}
              </h2>
              {/* Patogen info */}
              {pathogen && !isHealthy && (
                <p className="text-xs text-gray-500 mt-0.5 italic">
                  {pathogen} {pathogen_type ? `(${pathogen_type})` : ''}
                </p>
              )}
              {isHealthy && (
                <p className="text-sm text-green-600 font-medium mt-0.5">
                  Tidak ditemukan gejala penyakit pada tanaman
                </p>
              )}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2">
            {/* Urgency badge — color + icon + text (3 indikator) */}
            <span className={urgencyConfig.badgeClass}>
              <UrgencyIcon size={14} />
              {urgencyConfig.label}
            </span>

            {/* Confidence / Akurasi Gejala badge — hide saat sehat karena tidak ada gejala */}
            {!isHealthy && (
              <span className={confidenceConfig.badgeClass}>
                {getConfidenceLabel(confidence_score)}
              </span>
            )}

            {/* Affected part badge */}
            {affected_part && !isHealthy && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <MapPin size={12} />
                {affected_part}
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100 -mx-4 mb-4" />

        {/* Gejala yang terdeteksi — hide jika healthy */}
        {!isHealthy && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={16} className="text-green-600 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-700">
                Gejala yang Terdeteksi
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed pl-6">
              {symptom_description}
            </p>
          </div>
        )}

        {/* Mekanisme penyebaran — hide jika healthy */}
        {!isHealthy && spread_mechanism && spread_mechanism !== '-' && spread_mechanism !== 'Tidak diketahui.' && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Wind size={16} className="text-orange-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-700">
                Cara Penyebaran
              </h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed pl-6">
              {spread_mechanism}
            </p>
          </div>
        )}

        {/* Faktor epidemi */}
        {!isHealthy && epidemic_factors && epidemic_factors.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-700">
                Faktor Pemicu
              </h3>
            </div>
            <ul className="space-y-1 pl-6">
              {epidemic_factors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-1 text-xs">●</span>
                  <span className="text-sm text-gray-600">{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ====== TINDAKAN PENGENDALIAN ====== */}
        {!isHealthy && control_measures && (
          <div className="mb-4">
            {/* Preventif */}
            {control_measures.preventive && control_measures.preventive.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-blue-500 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Tindakan Pencegahan
                  </h3>
                </div>
                <ol className="space-y-1.5 pl-6">
                  {control_measures.preventive.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-600 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Kuratif */}
            {control_measures.curative && control_measures.curative.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench size={16} className="text-red-500 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Tindakan Pengobatan
                  </h3>
                </div>
                <ol className="space-y-1.5 pl-6">
                  {control_measures.curative.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-600 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Referensi */}
        {reference && (
          <div className="flex items-start gap-2 mb-3 pl-0">
            <BookOpen size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400 italic">
              Sumber: {reference}
            </p>
          </div>
        )}

        {/* Disclaimer — NON-NEGOTIABLE, selalu tampil */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl mt-2 border border-amber-100">
          <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed italic">
            {disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
