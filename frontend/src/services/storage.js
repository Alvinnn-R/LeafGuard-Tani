/**
 * storage.js — localStorage CRUD untuk riwayat analisis (US5).
 *
 * Schema: data-model.md §localStorage Schema
 * Key: "leafguard_history"
 * Value: AnalysisSession[] (max 50 items, FIFO eviction)
 */

const STORAGE_KEY = 'leafguard_history';
const MAX_ITEMS = 50;

/**
 * Ambil semua riwayat analisis.
 * @returns {Array} Array of AnalysisSession, terbaru di depan
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Simpan hasil analisis baru ke riwayat.
 * Item terbaru di posisi pertama. FIFO eviction jika > MAX_ITEMS.
 *
 * @param {Object} session - AnalysisSession object
 * @param {string} session.id - UUID (crypto.randomUUID())
 * @param {string} session.created_at - ISO 8601 timestamp
 * @param {string} session.mode - "plant" | "label" | "both"
 * @param {Object} session.result - AnalysisResult dari backend
 */
export function saveToHistory(session) {
  try {
    const history = getHistory();

    // Prepend (terbaru di depan)
    history.unshift(session);

    // FIFO eviction
    if (history.length > MAX_ITEMS) {
      history.length = MAX_ITEMS;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return true;
  } catch {
    // localStorage penuh atau disabled
    return false;
  }
}

/**
 * Ambil satu session berdasarkan ID.
 * @param {string} id - Session UUID
 * @returns {Object|null} AnalysisSession atau null
 */
export function getSessionById(id) {
  const history = getHistory();
  return history.find((s) => s.id === id) || null;
}

/**
 * Hapus satu session dari riwayat.
 * @param {string} id - Session UUID
 */
export function deleteSession(id) {
  try {
    const history = getHistory().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return true;
  } catch {
    return false;
  }
}

/**
 * Hapus semua riwayat.
 */
export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
