import React, { useState, useCallback, useMemo } from 'react';
import {
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Eye,
  Leaf,
} from 'lucide-react';

/**
 * SummaryCard — Kartu ringkasan yang bisa dibagikan via WhatsApp/native share.
 * Menampilkan diagnosa, urgensi, langkah utama, dan tombol share.
 *
 * @param {Object} props
 * @param {Object} props.result - AnalysisResult lengkap dari backend/mock
 * @param {string} props.mode - Mode analisis ("plant" | "label" | "both")
 */

const URGENCY_ICONS = {
  IMMEDIATE: AlertTriangle,
  WITHIN_3_DAYS: Clock,
  MONITOR: Eye,
};

const URGENCY_LABELS = {
  IMMEDIATE: 'Segera Ditangani',
  WITHIN_3_DAYS: 'Tangani 2–3 Hari',
  MONITOR: 'Pantau',
};

const URGENCY_EMOJI = {
  IMMEDIATE: '🔴',
  WITHIN_3_DAYS: '🟠',
  MONITOR: '🟢',
};

export default function SummaryCard({ result, mode }) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);

  const { diagnosis, label_info, recommendation } = result || {};

  /**
   * Build shareable text content
   */
  const shareText = useMemo(() => {
    const lines = ['🌾 *LeafGuard Tani — Hasil Analisis*', ''];

    // Diagnosis section
    if (diagnosis && !diagnosis.is_healthy) {
      const emoji = URGENCY_EMOJI[diagnosis.urgency] || '⚪';
      lines.push(`🔬 *Diagnosa:* ${diagnosis.disease_name}`);
      lines.push(`${emoji} *Urgensi:* ${URGENCY_LABELS[diagnosis.urgency] || diagnosis.urgency}`);
      lines.push(`📊 *Keyakinan:* ${Math.round(diagnosis.confidence_score * 100)}%`);
      lines.push('');
    } else if (diagnosis?.is_healthy) {
      lines.push('✅ *Tanaman Sehat* — Tidak ditemukan masalah');
      lines.push('');
    }

    // Label section
    if (label_info) {
      lines.push(`📦 *Produk:* ${label_info.product_name}`);
      lines.push(`💧 *Dosis:* ${label_info.dose_familiar}`);
      lines.push('');
    }

    // Recommendation section
    if (recommendation) {
      const suitIcon = recommendation.product_suitable ? '✅' : '❌';
      lines.push(`${suitIcon} *Kesesuaian:* ${recommendation.product_suitable ? 'Produk Sesuai' : 'Produk Tidak Sesuai'}`);
      lines.push('');

      if (recommendation.action_steps?.length > 0) {
        lines.push('📋 *Langkah Penanganan:*');
        recommendation.action_steps.slice(0, 3).forEach((step, idx) => {
          lines.push(`${idx + 1}. ${step}`);
        });
        lines.push('');
      }
    }

    // Disclaimer
    lines.push('⚠️ _Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian._');
    lines.push('');
    lines.push('📱 _Dianalisis oleh LeafGuard Tani_');

    return lines.join('\n');
  }, [diagnosis, label_info, recommendation]);

  /**
   * Share via Web Share API (native — WhatsApp, Telegram, dll.)
   */
  const handleShare = useCallback(async () => {
    setShareError(false);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LeafGuard Tani — Hasil Analisis',
          text: shareText,
        });
      } catch (err) {
        // User cancelled share — bukan error
        if (err.name !== 'AbortError') {
          setShareError(true);
          // Fallback ke copy
          handleCopy();
        }
      }
    } else {
      // Browser tidak support Web Share — fallback ke copy
      handleCopy();
    }
  }, [shareText]);

  /**
   * Fallback: copy text ke clipboard
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareText]);

  if (!result) return null;

  const UrgencyIcon = diagnosis ? (URGENCY_ICONS[diagnosis.urgency] || Eye) : Leaf;

  return (
    <div className="animate-slide-up">
      <div className="card bg-gradient-to-br from-primary to-primary-dark text-white overflow-hidden relative">

        {/* Decorative pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Leaf size={128} className="text-white -rotate-12" />
        </div>

        {/* Content */}
        <div className="relative z-10">

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Leaf size={18} className="text-green-200" />
            <p className="text-xs font-semibold text-green-200 uppercase tracking-wider">
              Ringkasan Analisis
            </p>
          </div>

          {/* Diagnosis summary */}
          {diagnosis && (
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1.5">
                {diagnosis.disease_name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 
                                 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                  <UrgencyIcon size={12} />
                  {URGENCY_LABELS[diagnosis.urgency]}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 
                                 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium text-white/90">
                  {Math.round(diagnosis.confidence_score * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Label summary */}
          {label_info && !diagnosis && (
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">
                {label_info.product_name}
              </h3>
              <p className="text-sm text-green-200">
                Dosis: {label_info.dose_familiar}
              </p>
            </div>
          )}

          {/* Top 3 action steps */}
          {recommendation?.action_steps && recommendation.action_steps.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-2">
                Langkah Utama
              </p>
              <ol className="space-y-1.5">
                {recommendation.action_steps.slice(0, 3).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center 
                                     text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-white/90 leading-snug">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Divider */}
          <hr className="border-white/20 -mx-4 mb-4" />

          {/* Share buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 
                         py-2.5 rounded-xl text-sm font-semibold
                         bg-white text-primary
                         hover:bg-green-50
                         transition-colors duration-200
                         min-h-[44px]
                         active:scale-[0.97]"
            >
              <Share2 size={16} />
              Bagikan
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 
                         py-2.5 px-4 rounded-xl text-sm font-medium
                         bg-white/20 text-white backdrop-blur-sm
                         hover:bg-white/30
                         transition-colors duration-200
                         min-h-[44px]
                         active:scale-[0.97]"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>

          {/* Copy success feedback */}
          {copied && (
            <p className="text-xs text-green-200 text-center mt-2 animate-fade-in">
              Teks ringkasan berhasil disalin ke clipboard
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
