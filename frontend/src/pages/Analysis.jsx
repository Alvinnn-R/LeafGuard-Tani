import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Leaf, Tags, Layers } from 'lucide-react';

// Components
import UploadZone from '../components/UploadZone';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import AnalysisResult from '../components/AnalysisResult';
import LabelResult from '../components/LabelResult';
import RecommendationCard from '../components/RecommendationCard';
import SummaryCard from '../components/SummaryCard';

// Hooks & Services
import { useAnalysisContext } from '../context/AnalysisContext';
import { saveToHistory } from '../services/storage';

/**
 * Analysis — Halaman utama flow analisis.
 *
 * Flow: mode (dari query param) → upload foto → loading → result → summary
 * State transitions: data-model.md §State Transitions
 */

const MODE_CONFIG = {
  plant: {
    title: 'Analisis Tanaman',
    icon: Leaf,
    color: 'text-green-600',
    needsPlant: true,
    needsLabel: false,
  },
  label: {
    title: 'Baca Label Produk',
    icon: Tags,
    color: 'text-blue-600',
    needsPlant: false,
    needsLabel: true,
  },
  both: {
    title: 'Analisis Lengkap',
    icon: Layers,
    color: 'text-purple-600',
    needsPlant: true,
    needsLabel: true,
  },
};

export default function Analysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryMode = searchParams.get('mode');
  
  // Analysis hook
  const {
    plantImage,
    setPlantImage,
    labelImage,
    setLabelImage,
    status,
    result,
    error,
    mode: contextMode,
    isIdle,
    isProcessing,
    isSuccess,
    isError,
    runAnalysis,
    cancelAnalysis,
    retry,
    reset,
  } = useAnalysisContext();

  React.useEffect(() => {
    // Jika user explicitly memilih mode dari Beranda (?mode=xxx)
    // yang berbeda dari mode di riwayat (contextMode), reset state.
    if (queryMode && contextMode && queryMode !== contextMode) {
      reset();
    }
  }, [queryMode, contextMode, reset]);

  // activeMode = prioritas query URL > prioritas context > default 'plant'
  const activeMode = queryMode || contextMode || 'plant';
  const config = MODE_CONFIG[activeMode] || MODE_CONFIG.plant;
  const mode = activeMode;

  /**
   * Cek apakah semua foto yang dibutuhkan sudah ada
   */
  const canSubmit = useMemo(() => {
    if (config.needsPlant && !plantImage) return false;
    if (config.needsLabel && !labelImage) return false;
    return true;
  }, [config, plantImage, labelImage]);

  /**
   * URL preview untuk animasi scanning (memoized agar tidak bocor memory)
   */
  const scanPreviewUrl = useMemo(() => {
    const file = plantImage || labelImage;
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [plantImage, labelImage]);

  const labelPreviewUrl = useMemo(() => {
    if (!labelImage) return null;
    return URL.createObjectURL(labelImage);
  }, [labelImage]);

  // Cleanup URL saat berubah
  React.useEffect(() => {
    return () => {
      if (scanPreviewUrl) URL.revokeObjectURL(scanPreviewUrl);
    };
  }, [scanPreviewUrl]);

  React.useEffect(() => {
    return () => {
      if (labelPreviewUrl) URL.revokeObjectURL(labelPreviewUrl);
    };
  }, [labelPreviewUrl]);

  /**
   * Submit analisis
   */
  const handleSubmit = useCallback(async () => {
    const data = await runAnalysis({ mode, plantImage, labelImage });

    // Simpan ke history jika berhasil
    if (data) {
      saveToHistory({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        mode,
        plant_image_url: null,
        label_image_url: null,
        result: data,
      });
    }
  }, [mode, plantImage, labelImage, runAnalysis]);

  /**
   * Reset semua state untuk analisis baru
   */
  const handleNewAnalysis = useCallback(() => {
    setPlantImage(null);
    setLabelImage(null);
    reset();
  }, [reset]);

  /**
   * Kembali ke home
   */
  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  /**
   * Reset dari error → kembali ke upload
   */
  const handleResetFromError = useCallback(() => {
    setPlantImage(null);
    setLabelImage(null);
    reset();
  }, [reset]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">

      {/* Loading overlay with scanning animation */}
      {isProcessing && (
        <LoadingState
          mode={mode}
          imageUrl={scanPreviewUrl}
          labelImageUrl={mode === 'both' ? labelPreviewUrl : null}
          onCancel={cancelAnalysis}
        />
      )}

      {/* Error overlay */}
      {isError && error && (
        <ErrorState
          code={error.code}
          message={error.message}
          retryable={error.retryable}
          onRetry={retry}
          onReset={handleResetFromError}
        />
      )}

      {/* Main content */}
      <div className="pb-safe-nav">
        {/* Header bar */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 
                         flex items-center justify-center
                         hover:bg-gray-50 active:scale-95 transition-all
                         flex-shrink-0"
              aria-label="Kembali ke beranda"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo/logo_2.svg" alt="" className="w-6 h-6 object-contain" />
              <h1 className="text-lg font-bold text-gray-900">{config.title}</h1>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
        {/* === UPLOAD STATE === */}
        {isIdle && (
          <div className="animate-fade-in">

            {/* Upload zones */}
            <div className="space-y-4 mb-6">
              {config.needsPlant && (
                <UploadZone
                  label="Foto Tanaman Padi"
                  hint="Ambil foto daun, batang, atau malai tanaman padi"
                  value={plantImage}
                  onChange={setPlantImage}
                />
              )}

              {config.needsLabel && (
                <UploadZone
                  label="Foto Label Produk"
                  hint="Ambil foto label kemasan pestisida atau pupuk"
                  value={labelImage}
                  onChange={setLabelImage}
                />
              )}
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`
                w-full btn-primary text-base py-3.5
                ${!canSubmit ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              Mulai Analisis
            </button>

            {/* Mode info hint */}
            <p className="text-xs text-gray-400 text-center mt-3">
              {mode === 'plant' && 'AI akan mendiagnosa penyakit dari foto tanaman Anda'}
              {mode === 'label' && 'AI akan membaca dan menjelaskan isi label produk'}
              {mode === 'both' && 'AI akan mencocokkan produk dengan penyakit yang terdeteksi'}
            </p>
          </div>
        )}

        {/* === RESULT STATE === */}
        {isSuccess && result && (
          <div className="space-y-4 animate-fade-in">

            {/* Foto yang dianalisis */}
            {scanPreviewUrl && (
              <div className="card overflow-hidden p-0">
                <div className="relative aspect-[16/10] bg-gray-100">
                  <img
                    src={scanPreviewUrl}
                    alt="Foto tanaman yang dianalisis"
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay bawah */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {/* Badge mode di atas foto */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 
                                     bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
                      <img src="/logo/logo_2.svg" alt="" className="w-3.5 h-3.5" />
                      {mode === 'both' ? 'Foto Tanaman' : config.title}
                    </span>
                  </div>
                  {/* Status badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 
                                     bg-green-500/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-white">
                      ✓ Analisis Selesai
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Foto label (mode: both) */}
            {mode === 'both' && labelPreviewUrl && (
              <div className="card overflow-hidden p-0">
                <div className="relative aspect-[16/10] bg-gray-100">
                  <img
                    src={labelPreviewUrl}
                    alt="Foto label yang dianalisis"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 
                                     bg-white/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-gray-700 shadow-sm">
                      <img src="/logo/logo_2.svg" alt="" className="w-3.5 h-3.5" />
                      Foto Label
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 
                                     bg-green-500/90 backdrop-blur-sm rounded-lg text-xs font-semibold text-white">
                      ✓ Label Terbaca
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnosis card (mode: plant, both) */}
            {result.diagnosis && (
              <AnalysisResult diagnosis={result.diagnosis} />
            )}

            {/* Label card (mode: label, both) */}
            {result.label_info && (
              <LabelResult labelInfo={result.label_info} />
            )}

            {/* Recommendation card (mode: both only) */}
            {result.recommendation && (
              <RecommendationCard recommendation={result.recommendation} />
            )}

            {/* Summary + Share card */}
            <SummaryCard result={result} mode={mode} />

            {/* Processing time */}
            {result.processing_time_ms && (
              <p className="text-xs text-gray-400 text-center">
                Dianalisis dalam {(result.processing_time_ms / 1000).toFixed(1)} detik
              </p>
            )}

            {/* New analysis button */}
            <div className="pt-2 pb-4">
              <button
                type="button"
                onClick={handleNewAnalysis}
                className="w-full btn-outline text-base"
              >
                <RotateCcw size={18} />
                Analisis Baru
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
