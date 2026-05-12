import React, { useState, useEffect, useMemo } from 'react';
import { Search, FlaskConical, ClipboardCheck, Sparkles, Leaf, XCircle } from 'lucide-react';

/**
 * LoadingState — Full-screen loading overlay dengan animasi scanning dan tombol batal.
 *
 * Menampilkan preview foto yang sedang dianalisis dengan efek scanning line
 * yang bergerak naik-turun, corner brackets, dan progress messages.
 *
 * @param {Object} props
 * @param {string} [props.mode="plant"] - Mode analisis ("plant" | "label" | "both")
 * @param {string|null} [props.imageUrl] - URL preview foto tanaman untuk animasi scanning
 * @param {string|null} [props.labelImageUrl] - URL preview foto label (untuk mode "both")
 * @param {Function} [props.onCancel] - Callback saat tombol batal diklik
 */

const MESSAGES = {
  plant: [
    { text: 'Menganalisis foto tanaman...', icon: Search },
    { text: 'Mencocokkan pola penyakit...', icon: Leaf },
    { text: 'Mengidentifikasi gejala...', icon: FlaskConical },
    { text: 'Menyiapkan hasil diagnosa...', icon: ClipboardCheck },
  ],
  label: [
    { text: 'Membaca teks pada label...', icon: Search },
    { text: 'Mengekstrak informasi produk...', icon: FlaskConical },
    { text: 'Menerjemahkan dosis...', icon: ClipboardCheck },
    { text: 'Menyiapkan interpretasi...', icon: Sparkles },
  ],
  both: [
    { text: 'Menganalisis foto tanaman...', icon: Search },
    { text: 'Membaca label produk...', icon: Leaf },
    { text: 'Mencocokkan produk & penyakit...', icon: FlaskConical },
    { text: 'Menyiapkan rekomendasi...', icon: ClipboardCheck },
    { text: 'Hampir selesai...', icon: Sparkles },
  ],
};

const ROTATION_INTERVAL_MS = 2800;

export default function LoadingState({ mode = 'plant', imageUrl = null, labelImageUrl = null, onCancel }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0); // 0 = plant, 1 = label

  // Untuk mode "both": bergantian foto tanaman ↔ label setiap 3 detik
  const hasDualImages = mode === 'both' && imageUrl && labelImageUrl;
  useEffect(() => {
    if (!hasDualImages) return;
    const interval = setInterval(() => {
      setActiveImageIdx((prev) => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, [hasDualImages]);

  const currentImageUrl = hasDualImages
    ? (activeImageIdx === 0 ? imageUrl : labelImageUrl)
    : (imageUrl || labelImageUrl);
  const currentImageLabel = hasDualImages
    ? (activeImageIdx === 0 ? '🌿 Tanaman' : '🏷️ Label')
    : null;

  const messages = MESSAGES[mode] || MESSAGES.plant;

  // Rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % messages.length);
        setIsTransitioning(false);
      }, 300);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentMessage = messages[activeIndex];
  const ActiveIcon = currentMessage.icon;
  const progress = ((activeIndex + 1) / messages.length) * 100;

  const formattedTime = useMemo(() => {
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    return m > 0 ? `${m}m ${s}d` : `${s} detik`;
  }, [elapsedSeconds]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white/90 backdrop-blur-md">

      {/* ============================================ */}
      {/* TOP SECTION: Scanning Image Preview */}
      {/* ============================================ */}
      <div className="flex-1 flex items-center justify-center px-6 pt-10">
        <div className="relative w-full max-w-[320px] md:max-w-[260px] lg:max-w-[240px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">

          {/* Image or Placeholder */}
          {currentImageUrl ? (
            <img
              key={currentImageUrl}
              src={currentImageUrl}
              alt="Foto sedang dianalisis"
              className="w-full h-full object-cover animate-fade-in"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <img src="/logo/logo_2.svg" alt="" className="w-20 h-20 opacity-20" />
            </div>
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Badge foto aktif (mode both) */}
          {currentImageLabel && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center px-2.5 py-1
                               bg-white/90 backdrop-blur-sm rounded-lg
                               text-[10px] font-bold text-gray-700 shadow-sm
                               transition-all duration-300">
                {currentImageLabel}
              </span>
            </div>
          )}

          {/* ======= SCANNING LINE ANIMATION ======= */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Main scan line — garis hijau menyala bergerak naik-turun */}
            <div className="scan-line absolute left-0 right-0 h-[2px]"
                 style={{
                   background: 'linear-gradient(90deg, transparent, #22c55e 20%, #4ade80 50%, #22c55e 80%, transparent)',
                   boxShadow: '0 0 15px 4px rgba(34, 197, 94, 0.5), 0 0 40px 8px rgba(34, 197, 94, 0.2)',
                 }}
            />
            {/* Secondary subtle glow trail */}
            <div className="scan-line-trail absolute left-0 right-0 h-[60px]"
                 style={{
                   background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.15) 0%, transparent 100%)',
                 }}
            />
          </div>

          {/* ======= CORNER BRACKETS ======= */}
          <div className="absolute inset-0 pointer-events-none p-4">
            {/* Top-left */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-green-400/80 rounded-tl-lg corner-pulse" />
            {/* Top-right */}
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-400/80 rounded-tr-lg corner-pulse" style={{ animationDelay: '0.2s' }} />
            {/* Bottom-left */}
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-400/80 rounded-bl-lg corner-pulse" style={{ animationDelay: '0.4s' }} />
            {/* Bottom-right */}
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-green-400/80 rounded-br-lg corner-pulse" style={{ animationDelay: '0.6s' }} />
          </div>

          {/* ======= DATA POINTS / HUD OVERLAY ======= */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Floating data dot top-left */}
            <div className="absolute top-8 left-8 flex items-center gap-1.5 data-point" style={{ animationDelay: '1s' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-green-400/80 font-mono tracking-wider">SCANNING</span>
            </div>
            {/* Floating data dot bottom-right */}
            <div className="absolute bottom-8 right-8 flex items-center gap-1.5 data-point" style={{ animationDelay: '2s' }}>
              <span className="text-[9px] text-green-400/80 font-mono tracking-wider">{formattedTime}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>

          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
               style={{
                 backgroundImage: 'linear-gradient(0deg, white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
               }}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* BOTTOM SECTION: Messages + Progress + Cancel */}
      {/* ============================================ */}
      <div className="px-6 pb-8 pt-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>

        {/* Message + icon */}
        <div className="flex items-center justify-center gap-3 h-12 mb-4">
          <div className={`transition-all duration-300 ease-out
            ${isTransitioning ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
            <ActiveIcon size={20} className="text-green-400" strokeWidth={2} />
          </div>
          <p className={`text-sm font-medium text-gray-800 transition-all duration-300 ease-out
            ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            {currentMessage.text}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-[280px] mx-auto mb-2">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out
                         bg-gradient-to-r from-green-500 to-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {messages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300
                ${idx === activeIndex
                  ? 'bg-green-400 w-5'
                  : idx < activeIndex
                    ? 'bg-green-400/40 w-1.5'
                    : 'bg-gray-300 w-1.5'
                }`}
            />
          ))}
        </div>

        {/* Cancel button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mx-auto flex items-center justify-center gap-2
                       px-6 py-3 rounded-xl text-sm font-semibold
                       text-red-600 bg-red-50 border border-red-100
                       hover:bg-red-100 hover:text-red-700
                       active:scale-95 transition-all duration-200
                       min-h-[44px] min-w-[44px]"
          >
            <XCircle size={18} />
            Batalkan Analisis
          </button>
        )}
      </div>
    </div>
  );
}
