import { useState, useCallback, useRef } from 'react';
import { analyze, ApiError } from '../services/api';
import { getMockResult } from '../mocks/sampleData';

/**
 * useAnalysis — Custom hook untuk state management analisis.
 *
 * State machine:
 *   IDLE → PROCESSING → SUCCESS | ERROR
 *                          ↑        |
 *                          └─ RETRY ─┘
 *
 * @returns {Object} State dan actions untuk analisis
 * @returns {string}  return.status   - "idle" | "processing" | "success" | "error"
 * @returns {Object|null} return.result - Data AnalysisResult dari backend
 * @returns {Object|null} return.error  - { code, message, retryable }
 * @returns {string|null} return.mode   - Mode terakhir yang dianalisis
 * @returns {Function} return.runAnalysis - Jalankan analisis
 * @returns {Function} return.retry     - Retry analisis terakhir
 * @returns {Function} return.reset     - Reset ke IDLE state
 */

/**
 * Apakah menggunakan mock data (true) atau real API (false).
 * Toggle ini saat backend sudah siap.
 */
const USE_MOCK = true;
const MOCK_DELAY_MS = 2500;

export default function useAnalysis() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);

  // Simpan params terakhir untuk retry
  const lastParamsRef = useRef(null);

  /**
   * Jalankan analisis dengan params baru.
   *
   * @param {Object} params
   * @param {string} params.mode - "plant" | "label" | "both"
   * @param {File|null} [params.plantImage]
   * @param {File|null} [params.labelImage]
   */
  const runAnalysis = useCallback(async (params) => {
    const { mode: analysisMode, plantImage, labelImage } = params;

    // Simpan untuk retry
    lastParamsRef.current = params;
    setMode(analysisMode);
    setStatus('processing');
    setResult(null);
    setError(null);

    try {
      let data;

      if (USE_MOCK) {
        // Simulasi network delay
        await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
        data = getMockResult(analysisMode);
      } else {
        data = await analyze({ mode: analysisMode, plantImage, labelImage });
      }

      setResult(data);
      setStatus('success');

      return data;
    } catch (err) {
      const apiError =
        err instanceof ApiError
          ? { code: err.code, message: err.message, retryable: err.retryable }
          : {
              code: 'AI_ERROR',
              message: 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
              retryable: true,
            };

      setError(apiError);
      setStatus('error');

      return null;
    }
  }, []);

  /**
   * Retry analisis terakhir dengan params yang sama.
   */
  const retry = useCallback(() => {
    if (lastParamsRef.current) {
      runAnalysis(lastParamsRef.current);
    }
  }, [runAnalysis]);

  /**
   * Reset semua state ke IDLE.
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setMode(null);
    lastParamsRef.current = null;
  }, []);

  return {
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
    retry,
    reset,
  };
}
