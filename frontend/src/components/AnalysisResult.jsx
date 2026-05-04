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
} from 'lucide-react';

/**
 * AnalysisResult — Card hasil diagnosa penyakit tanaman.
 * Menampilkan nama penyakit, confidence, urgency, gejala, penyebaran, dan disclaimer.
 *
 * Rules (CLAUDE.md §8):
 * - Urgency: SELALU 3 indikator (color + icon + text)
 * - Disclaimer: SELALU ditampilkan, teks hardcoded
 *
 * @param {Object} props
 * @param {Object} props.diagnosis - DiagnosisResult dari backend/mock
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
 * Konfigurasi visual confidence
 */
const CONFIDENCE_CONFIG = {
  HIGH: {
    label: 'Keyakinan Tinggi',
    badgeClass: 'badge-high',
  },
  MEDIUM: {
    label: 'Keyakinan Sedang',
    badgeClass: 'badge-medium',
  },
  LOW: {
    label: 'Keyakinan Rendah',
    badgeClass: 'badge-low',
  },
};

export default function AnalysisResult({ diagnosis }) {
  if (!diagnosis) return null;

  const {
    disease_name,
    confidence,
    confidence_score,
    urgency,
    symptom_description,
    spread_mechanism,
    is_healthy,
    disclaimer,
  } = diagnosis;

  const urgencyConfig = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.MONITOR;
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
              ${is_healthy ? 'bg-green-100' : 'bg-red-50'}
            `}>
              {is_healthy
                ? <ShieldCheck size={22} className="text-green-600" />
                : <Activity size={22} className="text-red-500" />
              }
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {disease_name}
              </h2>
              {is_healthy && (
                <p className="text-sm text-green-600 font-medium mt-0.5">
                  Tidak ditemukan masalah
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

            {/* Confidence badge */}
            <span className={confidenceConfig.badgeClass}>
              {confidenceConfig.label} ({Math.round(confidence_score * 100)}%)
            </span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100 -mx-4 mb-4" />

        {/* Gejala yang terdeteksi */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} className="text-primary flex-shrink-0" />
            <h3 className="text-sm font-semibold text-gray-700">
              Gejala yang Terdeteksi
            </h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed pl-6">
            {symptom_description}
          </p>
        </div>

        {/* Mekanisme penyebaran — hide jika healthy */}
        {!is_healthy && spread_mechanism && spread_mechanism !== '-' && (
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
