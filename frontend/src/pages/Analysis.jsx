import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, RotateCcw } from 'lucide-react';
import useAnalysis from '../hooks/useAnalysis';
import UploadZone from '../components/UploadZone';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import AnalysisResult from '../components/AnalysisResult';
import LabelResult from '../components/LabelResult';
import RecommendationCard from '../components/RecommendationCard';
import SummaryCard from '../components/SummaryCard';

/**
 * Analysis — Halaman upload → proses → hasil analisis.
 *
 * Flow:
 *   1. Mode dipilih dari Home (via query param ?mode=plant|label|both)
 *   2. User upload foto → UploadZone
 *   3. Klik "Analisis" → LoadingState
 *   4. Hasil → AnalysisResult / LabelResult / RecommendationCard
 *   5. SummaryCard + tombol "Analisis Baru"
 *
 * Ref: tasks.md T032, spec.md §US1-US3
 */

const MODE_CONFIG = {
  plant: {
    title: 'Analisis Tanaman',
    needsPlant: true,
    needsLabel: false,
  },
  label: {
    title: 'Baca Label',
    needsPlant: false,
    needsLabel: true,
  },
  both: {
    title: 'Analisis Lengkap',
    needsPlant: true,
    needsLabel: true,
  },
};

export default function Analysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'plant';
  const config = MODE_CONFIG[mode] || MODE_CONFIG.plant;

  // Image state
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
   * Cek apakah semua foto yang dibutuhkan sudah diunggah
   */
  const canSubmit = useMemo(() => {
    if (config.needsPlant && !plantImage) return false;
    if (config.needsLabel && !labelImage) return false;
    return true;
  }, [config, plantImage, labelImage]);

  /**
   * Kirim foto ke backend untuk dianalisis
   */
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    await runAnalysis({
      mode,
      plantImage: config.needsPlant ? plantImage : null,
      labelImage: config.needsLabel ? labelImage : null,
    });
  }, [canSubmit, mode, plantImage, labelImage, config, runAnalysis]);

  /**
   * Reset semua dan mulai analisis baru
   */
  const handleNewAnalysis = useCallback(() => {
    reset();
    setPlantImage(null);
    setLabelImage(null);
    navigate('/');
  }, [reset, navigate]);

  /**
   * Reset dan tetap di mode yang sama
   */
  const handleRetryFresh = useCallback(() => {
    reset();
    setPlantImage(null);
    setLabelImage(null);
  }, [reset]);

  // === RENDER: Loading State ===
  if (isProcessing) {
    return <LoadingState mode={mode} />;
  }

  // === RENDER: Error State ===
  if (isError && error) {
    return (
      <ErrorState
        code={error.code}
        message={error.message}
        retryable={error.retryable}
        onRetry={retry}
        onUploadAgain={handleRetryFresh}
      />
    );
  }

  // === RENDER: Success — Show Results ===
  if (isSuccess && result) {
    return (
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleNewAnalysis}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center 
                       hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Hasil Analisis</h1>
        </div>

        {/* Result Cards */}
        <div className="space-y-4">
          {result.diagnosis && (
            <AnalysisResult diagnosis={result.diagnosis} />
          )}

          {result.label_info && (
            <LabelResult labelInfo={result.label_info} />
          )}

          {result.recommendation && (
            <RecommendationCard recommendation={result.recommendation} />
          )}

          {/* Summary Card */}
          <SummaryCard result={result} mode={mode} />
        </div>

        {/* Analisis Baru Button */}
        <div className="mt-6">
          <button
            onClick={handleNewAnalysis}
            className="w-full btn-primary py-3 text-base"
          >
            <RotateCcw size={18} />
            Analisis Baru
          </button>
        </div>
      </div>
    );
  }

  // === RENDER: Upload Form (Idle State) ===
  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center 
                     hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px]"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{config.title}</h1>
          <p className="text-xs text-gray-500">Unggah foto untuk memulai analisis</p>
        </div>
      </div>

      {/* Upload Zones */}
      <div className="space-y-5">
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

      {/* Submit Button */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl
                     text-base font-semibold transition-all duration-200 min-h-[44px]
                     ${canSubmit
                       ? 'bg-primary text-white hover:bg-green-700 active:scale-[0.98] shadow-md shadow-green-200'
                       : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                     }`}
        >
          <Send size={18} />
          Mulai Analisis
        </button>
      </div>

      {/* Info */}
      {!canSubmit && (
        <p className="text-xs text-gray-400 text-center mt-3 animate-fade-in">
          Unggah semua foto yang dibutuhkan untuk melanjutkan
        </p>
      )}
    </div>
  );
}
