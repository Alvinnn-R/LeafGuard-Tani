import React, { useState, useEffect } from 'react';
import { Leaf, Search, FlaskConical, ClipboardCheck, Sparkles } from 'lucide-react';

/**
 * LoadingState — Full-screen loading overlay dengan animasi dan pesan rotasi.
 * Ditampilkan saat proses analisis berjalan.
 *
 * @param {Object} props
 * @param {string} [props.mode="plant"] - Mode analisis ("plant" | "label" | "both")
 */

const MESSAGES = {
  plant: [
    { text: 'Sedang menganalisis foto Anda...', icon: Search },
    { text: 'Mencocokkan pola penyakit...', icon: Leaf },
    { text: 'Mengidentifikasi gejala tanaman...', icon: FlaskConical },
    { text: 'Menyiapkan hasil diagnosa...', icon: ClipboardCheck },
  ],
  label: [
    { text: 'Membaca teks pada label...', icon: Search },
    { text: 'Mengekstrak informasi produk...', icon: FlaskConical },
    { text: 'Menerjemahkan dosis ke satuan familiar...', icon: ClipboardCheck },
    { text: 'Menyiapkan interpretasi label...', icon: Sparkles },
  ],
  both: [
    { text: 'Sedang menganalisis foto tanaman...', icon: Search },
    { text: 'Membaca label produk Anda...', icon: Leaf },
    { text: 'Mencocokkan produk dengan penyakit...', icon: FlaskConical },
    { text: 'Menyiapkan rekomendasi penanganan...', icon: ClipboardCheck },
    { text: 'Hampir selesai...', icon: Sparkles },
  ],
};

const ROTATION_INTERVAL_MS = 2800;

export default function LoadingState({ mode = 'plant' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const messages = MESSAGES[mode] || MESSAGES.plant;

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);

      // Delay index change to allow fade-out
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % messages.length);
        setIsTransitioning(false);
      }, 300);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[activeIndex];
  const ActiveIcon = currentMessage.icon;

  // Progress dots
  const progress = ((activeIndex + 1) / messages.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm px-6">
      {/* Animated leaf circle */}
      <div className="relative mb-8">
        {/* Outer ring pulse */}
        <div className="absolute inset-0 w-28 h-28 rounded-full bg-primary/10 animate-ping" 
             style={{ animationDuration: '2s' }} />

        {/* Middle ring */}
        <div className="absolute inset-0 w-28 h-28 rounded-full border-2 border-primary/20 animate-pulse-slow" />

        {/* Spinner ring */}
        <div className="w-28 h-28 rounded-full border-[3px] border-gray-200 border-t-primary animate-spin"
             style={{ animationDuration: '1.2s' }} />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`
            transition-all duration-300 ease-out
            ${isTransitioning ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}
          `}>
            <ActiveIcon size={32} className="text-primary" strokeWidth={1.8} />
          </div>
        </div>
      </div>

      {/* Message text */}
      <div className="h-14 flex items-center justify-center">
        <p className={`
          text-base font-medium text-gray-700 text-center
          transition-all duration-300 ease-out
          ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        `}>
          {currentMessage.text}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-48 mt-6">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicator dots */}
      <div className="flex items-center gap-2 mt-4">
        {messages.map((_, idx) => (
          <div
            key={idx}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${idx === activeIndex
                ? 'bg-primary w-4'
                : idx < activeIndex
                  ? 'bg-primary/40'
                  : 'bg-gray-200'
              }
            `}
          />
        ))}
      </div>

      {/* Subtle hint */}
      <p className="mt-8 text-xs text-gray-400 text-center">
        Proses ini memerlukan koneksi internet
      </p>
    </div>
  );
}
