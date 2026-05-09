/**
 * api.js — Fetch wrapper untuk komunikasi dengan backend LeafGuard API.
 * Sesuai kontrak di api-contracts.md §Frontend API Service Contract.
 *
 * Menggunakan native fetch API (bukan axios) sesuai CLAUDE.md §6.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DEVICE_ID_KEY = 'leafguard_device_id';

/**
 * Ambil atau buat Device ID unik untuk device ini.
 * Disimpan di localStorage sehingga bertahan antar sesi browser.
 * Digunakan untuk mengikat riwayat analisis ke device tertentu (tanpa login).
 *
 * @returns {string} UUID device yang persisten
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}


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

  // Timeout 90 detik — Gemini bisa butuh waktu pada jaringan lambat
  const timeoutMs = 90_000;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Gabungkan signal dari caller (tombol batal) + signal timeout
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: form,
      signal: combinedSignal,
      headers: {
        'X-Device-Id': getDeviceId(),
      },
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);

    // Re-throw ApiError langsung
    if (err instanceof ApiError) {
      throw err;
    }

    // Timeout — analisis terlalu lama
    if (err.name === 'AbortError' && !signal?.aborted) {
      throw new ApiError(
        'NETWORK_ERROR',
        'Analisis membutuhkan waktu terlalu lama. Periksa koneksi internet Anda dan coba lagi.',
        true
      );
    }

    // Dibatalkan user
    if (err.name === 'AbortError') {
      throw err;
    }

    // Network error (offline, DNS fail, CORS)
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

/**
 * Ambil daftar riwayat analisis dari backend.
 *
 * @param {Object} [params]
 * @param {number} [params.limit=20] - Jumlah item per halaman (maks 50)
 * @param {number} [params.offset=0] - Offset untuk pagination
 * @returns {Promise<{success: boolean, data: Array, total: number}>}
 */
export async function fetchHistory({ limit = 20, offset = 0 } = {}) {
  try {
    const url = `${BASE_URL}/history?limit=${limit}&offset=${offset}`;
    const response = await fetch(url, {
      headers: {
        'X-Device-Id': getDeviceId(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('fetchHistory error:', err);
    return { success: true, data: [], total: 0, limit, offset };
  }
}

/**
 * Ambil detail 1 item riwayat berdasarkan ID.
 *
 * @param {string} historyId - UUID item riwayat
 * @returns {Promise<{success: boolean, data: Object|null}>}
 */
export async function fetchHistoryDetail(historyId) {
  try {
    const response = await fetch(`${BASE_URL}/history/${historyId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('fetchHistoryDetail error:', err);
    return { success: false, data: null };
  }
}

