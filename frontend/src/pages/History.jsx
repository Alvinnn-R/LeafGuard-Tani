import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Leaf, Tag, Layers, AlertTriangle, Eye,
  RotateCcw, ChevronRight, WifiOff, X, Image as ImageIcon,
} from 'lucide-react';
import { fetchHistory, fetchHistoryDetail } from '../services/api';
import { getHistory } from '../services/storage';
import AnalysisResult from '../components/AnalysisResult';
import LabelResult from '../components/LabelResult';
import RecommendationCard from '../components/RecommendationCard';

/**
 * History — Halaman riwayat analisis dengan detail bottom sheet.
 */

const URGENCY_CONFIG = {
  IMMEDIATE:     { label: 'Segera Ditangani',  color: 'text-red-600',    bg: 'bg-red-50',    icon: AlertTriangle },
  HIGH:          { label: 'Tangani 2–3 Hari',  color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
  WITHIN_3_DAYS: { label: 'Tangani 2–3 Hari',  color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
  MEDIUM:        { label: 'Pantau 1 Minggu',   color: 'text-yellow-700', bg: 'bg-yellow-50', icon: Eye },
  MONITOR:       { label: 'Pantau',            color: 'text-green-600',  bg: 'bg-green-50',  icon: Eye },
  LOW:           { label: 'Observasi',         color: 'text-green-600',  bg: 'bg-green-50',  icon: Eye },
};

const MODE_CONFIG = {
  plant: { label: 'Analisis Tanaman', icon: Leaf,   color: 'text-green-600',  bg: 'bg-green-50' },
  label: { label: 'Baca Label',       icon: Tag,    color: 'text-blue-600',   bg: 'bg-blue-50' },
  both:  { label: 'Analisis Lengkap', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
};

function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

// ──────────────────────────────────────────────
// HistoryCard
// ──────────────────────────────────────────────
function HistoryCard({ item, onClick }) {
  const modeConf   = MODE_CONFIG[item.mode] || MODE_CONFIG.plant;
  const ModeIcon   = modeConf.icon;
  const urgencyConf = item.urgency ? URGENCY_CONFIG[item.urgency] : null;
  const UrgencyIcon = urgencyConf?.icon;
  const thumbUrl    = item.plant_url || item.label_url;
  const mainLabel   = item.disease_name || item.product_name || 'Hasil Analisis';

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="w-full card flex items-center gap-3 p-3
                 active:scale-[0.98] transition-transform duration-150
                 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      aria-label={`Lihat detail: ${mainLabel}`}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        {thumbUrl ? (
          <img src={thumbUrl} alt={mainLabel} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${modeConf.bg}`}>
            <ModeIcon size={24} className={modeConf.color} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{mainLabel}</p>
        <div className="flex items-center gap-1 mt-0.5 mb-1">
          <ModeIcon size={11} className={modeConf.color} />
          <span className={`text-[10px] font-medium ${modeConf.color}`}>{modeConf.label}</span>
        </div>
        <div className="flex items-center justify-between">
          {urgencyConf ? (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${urgencyConf.bg} ${urgencyConf.color}`}>
              <UrgencyIcon size={10} />
              {urgencyConf.label}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400">—</span>
          )}
          <span className="text-[10px] text-gray-400">{formatDate(item.created_at)}</span>
        </div>
      </div>

      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

// ──────────────────────────────────────────────
// SkeletonCard
// ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card flex items-center gap-3 p-3">
      <div className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-2/3" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// EmptyState
// ──────────────────────────────────────────────
function EmptyState({ isOffline }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        {isOffline
          ? <WifiOff size={36} className="text-gray-400" />
          : <Clock size={36} className="text-gray-400" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">
        {isOffline ? 'Tidak Ada Koneksi' : 'Belum Ada Riwayat'}
      </h3>
      <p className="text-sm text-gray-500 text-center leading-relaxed">
        {isOffline
          ? 'Pastikan koneksi internet aktif untuk melihat riwayat dari server.'
          : 'Riwayat analisis Anda akan muncul di sini setelah melakukan analisis pertama.'}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// DetailSheet — bottom sheet untuk detail riwayat
// ──────────────────────────────────────────────
function DetailSheet({ item, onClose }) {
  const [detail, setDetail]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(null);

  // Fetch detail dari backend saat sheet dibuka
  useEffect(() => {
    if (!item) return;

    let cancelled = false;
    setIsLoading(true);
    setDetail(null);
    setError(null);

    fetchHistoryDetail(item.id)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setDetail(res.data);
        } else {
          setError('Detail tidak tersedia.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Gagal mengambil detail. Coba lagi.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [item?.id]);

  // Tutup saat klik backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const result   = detail?.result;
  const thumbUrl = detail?.plant_url || detail?.label_url;
  const modeConf = MODE_CONFIG[item?.mode] || MODE_CONFIG.plant;
  const ModeIcon = modeConf.icon;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Detail riwayat analisis"
    >
      {/* Sheet */}
      <div className="w-full max-h-[92vh] bg-white rounded-t-2xl flex flex-col animate-slide-up overflow-hidden">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Detail Analisis</h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(item?.created_at)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center
                       active:scale-90 transition-transform"
            aria-label="Tutup"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4 pb-8">

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-2xl" />
              <div className="h-6 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-4/6" />
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="flex flex-col items-center py-12 px-4 text-center">
              <AlertTriangle size={36} className="text-red-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">{error}</p>
            </div>
          )}

          {/* Detail content */}
          {!isLoading && !error && detail && (
            <>
              {/* Foto preview */}
              {thumbUrl && (
                <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video">
                  <img
                    src={thumbUrl}
                    alt="Foto analisis"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Mode badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${modeConf.bg} ${modeConf.color}`}>
                <ModeIcon size={13} />
                {modeConf.label}
              </div>

              {/* Hasil diagnosis tanaman */}
              {result?.diagnosis && (
                <AnalysisResult diagnosis={result.diagnosis} />
              )}

              {/* Hasil baca label */}
              {result?.label_info && (
                <LabelResult labelInfo={result.label_info} />
              )}

              {/* Rekomendasi */}
              {result?.recommendation && (
                <RecommendationCard recommendation={result.recommendation} />
              )}

              {/* Fallback jika result tidak ada */}
              {!result?.diagnosis && !result?.label_info && (
                <div className="flex flex-col items-center py-8 text-center">
                  <ImageIcon size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Detail hasil analisis tidak tersedia.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// History (main page)
// ──────────────────────────────────────────────
export default function History() {
  const [items, setItems]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isOffline, setIsOffline]   = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // untuk detail sheet

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setIsOffline(false);

    try {
      const response = await fetchHistory({ limit: 50 });
      if (response.success && response.data?.length > 0) {
        setItems(response.data);
      } else {
        // Fallback localStorage
        const local = getHistory();
        setItems(local.map((session) => ({
          id: session.id,
          session_id: session.id,
          mode: session.mode,
          created_at: session.created_at,
          plant_url: session.plant_image_url || null,
          label_url: session.label_image_url || null,
          disease_name: session.result?.diagnosis?.disease_name || null,
          urgency: session.result?.diagnosis?.urgency || null,
          product_name: session.result?.label_info?.product_name || null,
        })));
      }
    } catch {
      setIsOffline(true);
      const local = getHistory();
      setItems(local.map((session) => ({
        id: session.id,
        session_id: session.id,
        mode: session.mode,
        created_at: session.created_at,
        plant_url: null,
        label_url: null,
        disease_name: session.result?.diagnosis?.disease_name || null,
        urgency: session.result?.diagnosis?.urgency || null,
        product_name: session.result?.label_info?.product_name || null,
      })));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-safe-nav">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo/logo_2.svg" alt="" className="w-6 h-6 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Riwayat Analisis</h1>
              {!isLoading && items.length > 0 && (
                <p className="text-[11px] leading-none text-gray-400 mt-1">{items.length} analisis tersimpan</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadHistory(true)}
            disabled={isRefreshing || isLoading}
            className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200
                       flex items-center justify-center
                       active:scale-90 transition-transform duration-150
                       disabled:opacity-50"
            aria-label="Muat ulang riwayat"
          >
            <RotateCcw size={16} className={`text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Offline banner */}
        {isOffline && items.length > 0 && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
            <WifiOff size={14} className="text-yellow-600 flex-shrink-0" />
            <p className="text-xs text-yellow-700">Menampilkan riwayat lokal — koneksi tidak tersedia.</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* List */}
        {!isLoading && items.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {items.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onClick={setSelectedItem}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && items.length === 0 && (
          <EmptyState isOffline={isOffline} />
        )}
      </div>

      {/* Detail bottom sheet */}
      {selectedItem && (
        <DetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
