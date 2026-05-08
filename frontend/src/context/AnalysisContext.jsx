import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { analyze, ApiError } from '../services/api';
import { getMockResult } from '../mocks/sampleData';

const AnalysisContext = createContext(null);

const USE_MOCK = false;
const MOCK_DELAY_MS = 2500;

export function AnalysisProvider({ children }) {
  // UI states
  const [plantImage, setPlantImage] = useState(null);
  const [labelImage, setLabelImage] = useState(null);

  // Analysis states
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);

  const lastParamsRef = useRef(null);
  const abortControllerRef = useRef(null);

  const runAnalysis = useCallback(async (params) => {
    const { mode: analysisMode, plantImage: pImg, labelImage: lImg } = params;

    // Batalkan request sebelumnya jika masih berjalan
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Buat AbortController baru
    const controller = new AbortController();
    abortControllerRef.current = controller;

    lastParamsRef.current = params;
    setMode(analysisMode);
    setStatus('processing');
    setResult(null);
    setError(null);

    try {
      let data;
      if (USE_MOCK) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, MOCK_DELAY_MS);
          controller.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
        data = getMockResult(analysisMode);
      } else {
        data = await analyze({
          mode: analysisMode,
          plantImage: pImg,
          labelImage: lImg,
          signal: controller.signal,
        });
      }

      setResult(data);
      setStatus('success');
      abortControllerRef.current = null;
      return data;
    } catch (err) {
      // Jika dibatalkan user, kembali ke idle tanpa error
      if (err.name === 'AbortError') {
        setStatus('idle');
        abortControllerRef.current = null;
        return null;
      }

      const apiError = err instanceof ApiError
        ? { code: err.code, message: err.message, retryable: err.retryable }
        : { code: 'AI_ERROR', message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.', retryable: true };

      setError(apiError);
      setStatus('error');
      abortControllerRef.current = null;
      return null;
    }
  }, []);

  /**
   * Batalkan analisis yang sedang berjalan
   */
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      runAnalysis(lastParamsRef.current);
    }
  }, [runAnalysis]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setResult(null);
    setError(null);
    setMode(null);
    setPlantImage(null);
    setLabelImage(null);
    lastParamsRef.current = null;
  }, []);

  const value = {
    // Images
    plantImage,
    setPlantImage,
    labelImage,
    setLabelImage,

    // State
    status,
    result,
    error,
    mode,

    // Derived state
    isIdle: status === 'idle',
    isProcessing: status === 'processing',
    isSuccess: status === 'success',
    isError: status === 'error',

    // Actions
    runAnalysis,
    cancelAnalysis,
    retry,
    reset,
  };

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider');
  }
  return context;
}
