import React from 'react';
import { AlertTriangle, WifiOff, ImageOff, RefreshCw, Camera, ServerCrash } from 'lucide-react';

/**
 * ErrorState — Komponen error display full-screen dengan aksi retry/upload ulang.
 *
 * @param {Object} props
 * @param {string} props.code - Error code dari backend (e.g., "INVALID_IMAGE", "AI_ERROR")
 * @param {string} props.message - Pesan error dalam Bahasa Indonesia
 * @param {boolean} props.retryable - Apakah error bisa di-retry
 * @param {() => void} [props.onRetry] - Callback untuk retry (tombol "Coba Lagi")
 * @param {() => void} [props.onReset] - Callback untuk upload ulang / kembali ke awal
 */

/**
 * Mapping error code → icon & warna untuk visual feedback
 */
const ERROR_CONFIG = {
  INVALID_IMAGE: {
    icon: ImageOff,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    ringColor: 'ring-orange-100',
  },
  VALIDATION_ERROR: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    ringColor: 'ring-red-100',
  },
  FILE_TOO_LARGE: {
    icon: ImageOff,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    ringColor: 'ring-orange-100',
  },
  INVALID_FORMAT: {
    icon: ImageOff,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    ringColor: 'ring-orange-100',
  },
  AI_ERROR: {
    icon: ServerCrash,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    ringColor: 'ring-red-100',
  },
  RATE_LIMITED: {
    icon: ServerCrash,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    ringColor: 'ring-yellow-100',
  },
  NETWORK_ERROR: {
    icon: WifiOff,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    ringColor: 'ring-gray-100',
  },
};

const DEFAULT_CONFIG = {
  icon: AlertTriangle,
  color: 'text-red-500',
  bgColor: 'bg-red-50',
  ringColor: 'ring-red-100',
};

/**
 * Tips kontekstual berdasarkan error code
 */
const ERROR_TIPS = {
  INVALID_IMAGE: [
    'Pastikan foto menampilkan daun atau batang tanaman padi dengan jelas',
    'Ambil foto di tempat dengan cahaya cukup',
    'Hindari foto yang terlalu jauh atau terlalu dekat',
  ],
  FILE_TOO_LARGE: [
    'Gunakan resolusi kamera yang lebih rendah',
    'Foto akan dikompresi otomatis, tapi ukuran awal sebaiknya di bawah 10MB',
  ],
  INVALID_FORMAT: [
    'Gunakan format foto JPEG atau PNG',
    'Hindari screenshot atau gambar yang sudah diedit',
  ],
  NETWORK_ERROR: [
    'Periksa koneksi internet Anda',
    'Coba pindah ke area dengan sinyal lebih kuat',
    'Tunggu beberapa saat lalu coba lagi',
  ],
  RATE_LIMITED: [
    'Server sedang sibuk melayani banyak permintaan',
    'Tunggu 1-2 menit sebelum mencoba lagi',
  ],
};

export default function ErrorState({
  code = 'AI_ERROR',
  message,
  retryable = true,
  onRetry,
  onReset,
}) {
  const config = ERROR_CONFIG[code] || DEFAULT_CONFIG;
  const ErrorIcon = config.icon;
  const tips = ERROR_TIPS[code] || [];

  const defaultMessage = 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Error icon */}
        <div className="flex justify-center mb-6">
          <div className={`
            w-20 h-20 rounded-full flex items-center justify-center
            ${config.bgColor} ring-8 ${config.ringColor}
          `}>
            <ErrorIcon size={36} className={config.color} strokeWidth={1.8} />
          </div>
        </div>

        {/* Error title */}
        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
          {retryable ? 'Analisis Gagal' : 'Tidak Dapat Diproses'}
        </h2>

        {/* Error message */}
        <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
          {message || defaultMessage}
        </p>

        {/* Contextual tips */}
        {tips.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Tips
            </p>
            <ul className="space-y-2">
              {tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-snug">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {/* Retry button (hanya jika retryable & ada callback) */}
          {retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn-primary w-full"
            >
              <RefreshCw size={18} />
              Coba Lagi
            </button>
          )}

          {/* Reset / upload ulang button */}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className={retryable && onRetry ? 'btn-secondary w-full' : 'btn-primary w-full'}
            >
              <Camera size={18} />
              {retryable ? 'Unggah Foto Lain' : 'Kembali & Unggah Ulang'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
