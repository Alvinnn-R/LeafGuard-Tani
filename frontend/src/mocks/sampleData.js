/**
 * sampleData.js — Mock data untuk development tanpa backend.
 * Data diambil dari api-contracts.md, section Response examples.
 *
 * Gunakan data ini untuk:
 * - Development komponen result cards
 * - Testing UI tanpa koneksi ke backend
 * - Demo fallback jika backend down
 */

// ============================================================
// Mode: Plant — Wereng Cokelat (HIGH confidence, IMMEDIATE)
// ============================================================
export const MOCK_PLANT_RESULT = {
  diagnosis: {
    disease_id: 'D04',
    disease_name: 'Wereng Cokelat',
    confidence: 'HIGH',
    confidence_score: 0.92,
    urgency: 'IMMEDIATE',
    symptom_description:
      'Terdeteksi koloni wereng cokelat padat di pangkal batang. Beberapa rumpun menunjukkan tanda awal hopperburn.',
    spread_mechanism:
      'Wereng menyebar melalui penerbangan pendek antar rumpun. Kondisi lembab mempercepat reproduksi.',
    is_healthy: false,
    disclaimer:
      'Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan.',
  },
  label_info: null,
  recommendation: null,
  processing_time_ms: 2341,
};

// ============================================================
// Mode: Plant — Blas Daun (MEDIUM confidence, WITHIN_3_DAYS)
// ============================================================
export const MOCK_PLANT_BLAS = {
  diagnosis: {
    disease_id: 'D01',
    disease_name: 'Blas Daun',
    confidence: 'MEDIUM',
    confidence_score: 0.58,
    urgency: 'WITHIN_3_DAYS',
    symptom_description:
      'Terdapat bercak berbentuk belah ketupat pada beberapa daun dengan tepi berwarna cokelat dan pusat abu-abu keputihan. Lesi terlihat pada daun bagian tengah.',
    spread_mechanism:
      'Jamur Pyricularia oryzae menyebar melalui spora yang terbawa angin. Kelembaban tinggi dan suhu 25-28°C mempercepat infeksi.',
    is_healthy: false,
    disclaimer:
      'Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan.',
  },
  label_info: null,
  recommendation: null,
  processing_time_ms: 1876,
};

// ============================================================
// Mode: Plant — Tanaman Sehat (MONITOR)
// ============================================================
export const MOCK_PLANT_HEALTHY = {
  diagnosis: {
    disease_id: 'HEALTHY',
    disease_name: 'Tanaman Sehat',
    confidence: 'HIGH',
    confidence_score: 0.95,
    urgency: 'MONITOR',
    symptom_description:
      'Tidak terdeteksi gejala penyakit atau serangan hama pada foto ini. Daun berwarna hijau normal dengan struktur yang baik.',
    spread_mechanism: '-',
    is_healthy: true,
    disclaimer:
      'Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan.',
  },
  label_info: null,
  recommendation: null,
  processing_time_ms: 1523,
};

// ============================================================
// Mode: Label — PaddyShield 300SC
// ============================================================
export const MOCK_LABEL_RESULT = {
  diagnosis: null,
  label_info: {
    product_name: 'PaddyShield 300SC',
    active_ingredients: [
      { name: 'Klorantraniliprol', concentration: '100 g/l' },
      { name: 'Tiametoksam', concentration: '200 g/l' },
    ],
    dose_technical: '1.0–1.5 ml/L air bersih',
    dose_familiar: 'kira-kira ⅓ hingga ½ sendok teh per liter air',
    application_timing:
      'Semprotkan pagi hari (sebelum 09.00) atau sore hari (setelah 15.00)',
    target_pests: ['Wereng Cokelat', 'Penggerek Batang', 'Hama Putih Palsu'],
    safety_warnings: [
      'Gunakan masker dan sarung tangan karet saat pencampuran',
      'Hindari menyemprot saat angin kencang',
      'Jauhkan dari jangkauan anak-anak',
    ],
    confidence_notes: null,
  },
  recommendation: null,
  processing_time_ms: 2105,
};

// ============================================================
// Mode: Both — Wereng + PaddyShield (product SUITABLE)
// ============================================================
export const MOCK_BOTH_RESULT = {
  diagnosis: {
    disease_id: 'D04',
    disease_name: 'Wereng Cokelat',
    confidence: 'HIGH',
    confidence_score: 0.92,
    urgency: 'IMMEDIATE',
    symptom_description:
      'Terdeteksi koloni wereng cokelat padat di pangkal batang. Beberapa rumpun menunjukkan tanda awal hopperburn.',
    spread_mechanism:
      'Wereng menyebar melalui penerbangan pendek antar rumpun. Kondisi lembab mempercepat reproduksi.',
    is_healthy: false,
    disclaimer:
      'Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan.',
  },
  label_info: {
    product_name: 'PaddyShield 300SC',
    active_ingredients: [
      { name: 'Klorantraniliprol', concentration: '100 g/l' },
      { name: 'Tiametoksam', concentration: '200 g/l' },
    ],
    dose_technical: '1.0–1.5 ml/L air bersih',
    dose_familiar: 'kira-kira ⅓ hingga ½ sendok teh per liter air',
    application_timing:
      'Semprotkan pagi hari (sebelum 09.00) atau sore hari (setelah 15.00)',
    target_pests: ['Wereng Cokelat', 'Penggerek Batang', 'Hama Putih Palsu'],
    safety_warnings: [
      'Gunakan masker dan sarung tangan karet saat pencampuran',
      'Hindari menyemprot saat angin kencang',
      'Jauhkan dari jangkauan anak-anak',
    ],
    confidence_notes: null,
  },
  recommendation: {
    product_suitable: true,
    suitability_reason:
      'PaddyShield 300SC mengandung Tiametoksam yang efektif terhadap Wereng Cokelat sesuai dengan hama yang terdeteksi.',
    recommended_product_type: null,
    action_steps: [
      'Campurkan 1,5 ml PaddyShield dengan 1 liter air bersih di tangki semprot',
      'Semprotkan sore hari setelah pukul 15.00 agar efektivitas maksimal',
      'Fokuskan semprotan di pangkal batang dan bagian bawah daun',
      'Ulangi penyemprotan setelah 7 hari jika serangan masih terlihat',
      'Pasang lampu perangkap di sekitar lahan untuk memantau populasi wereng',
    ],
  },
  processing_time_ms: 3892,
};

// ============================================================
// Mode: Both — Blas Daun + produk TIDAK SESUAI
// ============================================================
export const MOCK_BOTH_NOT_SUITABLE = {
  diagnosis: {
    disease_id: 'D01',
    disease_name: 'Blas Daun',
    confidence: 'HIGH',
    confidence_score: 0.85,
    urgency: 'WITHIN_3_DAYS',
    symptom_description:
      'Terdeteksi lesi berbentuk belah ketupat khas blas daun pada daun bendera. Tepi cokelat dengan pusat abu-abu keputihan.',
    spread_mechanism:
      'Jamur Pyricularia oryzae menyebar melalui spora yang terbawa angin. Kelembaban tinggi mempercepat penyebaran.',
    is_healthy: false,
    disclaimer:
      'Hasil ini adalah diagnosa awal. Konfirmasikan dengan penyuluh pertanian untuk penanganan lanjutan.',
  },
  label_info: {
    product_name: 'PaddyShield 300SC',
    active_ingredients: [
      { name: 'Klorantraniliprol', concentration: '100 g/l' },
      { name: 'Tiametoksam', concentration: '200 g/l' },
    ],
    dose_technical: '1.0–1.5 ml/L air bersih',
    dose_familiar: 'kira-kira ⅓ hingga ½ sendok teh per liter air',
    application_timing:
      'Semprotkan pagi hari (sebelum 09.00) atau sore hari (setelah 15.00)',
    target_pests: ['Wereng Cokelat', 'Penggerek Batang', 'Hama Putih Palsu'],
    safety_warnings: [
      'Gunakan masker dan sarung tangan karet saat pencampuran',
      'Hindari menyemprot saat angin kencang',
      'Jauhkan dari jangkauan anak-anak',
    ],
    confidence_notes: null,
  },
  recommendation: {
    product_suitable: false,
    suitability_reason:
      'PaddyShield 300SC ditujukan untuk hama serangga (Wereng, Penggerek), bukan penyakit jamur seperti Blas Daun.',
    recommended_product_type: 'Fungisida berbahan aktif Trisiklazol atau Isoprotiolan',
    action_steps: [
      'JANGAN gunakan PaddyShield untuk Blas Daun — produk ini untuk hama serangga',
      'Cari fungisida yang mengandung Trisiklazol 75 WP di toko pertanian terdekat',
      'Potong dan buang daun yang sudah terinfeksi parah untuk mencegah penyebaran',
      'Kurangi pemberian pupuk nitrogen berlebih karena mempercepat infeksi',
      'Hubungi penyuluh pertanian setempat untuk rekomendasi produk spesifik',
    ],
  },
  processing_time_ms: 4120,
};

// ============================================================
// Error responses for testing ErrorState
// ============================================================
export const MOCK_ERROR_INVALID_IMAGE = {
  code: 'INVALID_IMAGE',
  message:
    'Foto tidak dapat dianalisis. Pastikan foto menampilkan daun, batang tanaman padi, atau label produk pertanian yang cukup jelas dan terang.',
  retryable: true,
};

export const MOCK_ERROR_AI = {
  code: 'AI_ERROR',
  message: 'Terjadi kesalahan saat menganalisis foto. Silakan coba lagi.',
  retryable: true,
};

export const MOCK_ERROR_NETWORK = {
  code: 'NETWORK_ERROR',
  message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
  retryable: true,
};

// ============================================================
// Helper: mendapatkan mock result berdasarkan mode
// ============================================================
export function getMockResult(mode) {
  switch (mode) {
    case 'plant':
      return MOCK_PLANT_RESULT;
    case 'label':
      return MOCK_LABEL_RESULT;
    case 'both':
      return MOCK_BOTH_RESULT;
    default:
      return MOCK_PLANT_RESULT;
  }
}
