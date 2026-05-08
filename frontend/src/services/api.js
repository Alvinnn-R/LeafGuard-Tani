/**
 * api.js — Fetch wrapper untuk komunikasi dengan backend LeafGuard API.
 * Sesuai kontrak di api-contracts.md §Frontend API Service Contract.
 *
 * Menggunakan native fetch API (bukan axios) sesuai CLAUDE.md §6.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom error class untuk API errors.
 * Menyimpan code, message, dan flag retryable dari backend.
 */
export class ApiError extends Error {
  /**
   * @param {string} code - Error code (e.g., "INVALID_IMAGE", "AI_ERROR")
   * @param {string} message - Pesan error dalam Bahasa Indonesia
   * @param {boolean} retryable - Apakah request bisa di-retry
   */
  constructor(code, message, retryable = false) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Kirim foto untuk dianalisis oleh AI.
 *
 * @param {Object} params
 * @param {string} params.mode - Mode analisis: "plant" | "label" | "both"
 * @param {File|null} [params.plantImage] - Foto tanaman (required jika mode = plant|both)
 * @param {File|null} [params.labelImage] - Foto label (required jika mode = label|both)
 * @returns {Promise<import('../mocks/sampleData').AnalysisResult>} Data hasil analisis
 * @throws {ApiError} Jika request gagal atau backend mengembalikan error
 */
export async function analyze({ mode, plantImage, labelImage, signal }) {
  const form = new FormData();
  form.append('mode', mode);
  if (plantImage) form.append('plant_image', plantImage);
  if (labelImage) form.append('label_image', labelImage);

  try {
    const response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: form,
      signal,
    });

    // Handle non-JSON responses (e.g., 502 Bad Gateway)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError(
        'AI_ERROR',
        'Server tidak merespons dengan benar. Silakan coba lagi.',
        true
      );
    }

    const data = await response.json();

    // Backend selalu mengembalikan { success, data, error }
    if (!data.success) {
      throw new ApiError(
        data.error?.code || 'AI_ERROR',
        data.error?.message || 'Terjadi kesalahan saat menganalisis foto.',
        data.error?.retryable ?? true
      );
    }

    return data.data;
  } catch (err) {
    // Re-throw ApiError langsung
    if (err instanceof ApiError) {
      throw err;
    }

    // Network error (offline, DNS fail, CORS, timeout)
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new ApiError(
        'NETWORK_ERROR',
        'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        true
      );
    }

    // Catch-all
    throw new ApiError(
      'AI_ERROR',
      'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
      true
    );
  }
}

/**
 * Health check endpoint.
 * @returns {Promise<{status: string, version: string}>}
 */
export async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  return response.json();
}
