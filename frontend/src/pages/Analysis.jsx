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
import useAnalysis from '../hooks/useAnalysis';
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

  const mode = searchParams.get('mode') || 'plant';
  const config = MODE_CONFIG[mode] || MODE_CONFIG.plant;
  const ModeIcon = config.icon;

  // File states
  const [plantImage, setPlantImage] = useState(null);
  const [labelImage, setLabelImage] = useState(null);

  // Analysis hook
  const {
    status,
    result,
    error,
    isIdle,
    isProcessing,
    isSuccess,
    isError,
    runAnalysis,
    retry,
    reset,
  } = useAnalysis();

  /**
   * Cek apakah semua foto yang dibutuhkan sudah ada
   */
  const canSubmit = useMemo(() => {
    if (config.needsPlant && !plantImage) return false;
    if (config.needsLabel && !labelImage) return false;
    return true;
  }, [config, plantImage, labelImage]);

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

      {/* Loading overlay */}
      {isProcessing && <LoadingState mode={mode} />}

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
      <div className="px-5 py-4 pb-safe-nav">

        {/* Header bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 
                       flex items-center justify-center
                       hover:bg-gray-50 active:scale-95 
                       transition-all duration-200
                       min-h-[44px] min-w-[44px]"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <ModeIcon size={20} className={config.color} />
            <h1 className="text-lg font-bold text-gray-900">{config.title}</h1>
          </div>
        </div>

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
  );
}
