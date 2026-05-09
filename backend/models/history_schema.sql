-- ================================================================
-- LeafGuard Tani — Supabase Schema
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- Tabel utama riwayat analisis
CREATE TABLE IF NOT EXISTS history (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id    TEXT        NOT NULL,
  mode          TEXT        NOT NULL CHECK (mode IN ('plant', 'label', 'both')),
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  plant_url     TEXT,                        -- URL publik foto tanaman di Supabase Storage
  label_url     TEXT,                        -- URL publik foto label di Supabase Storage
  result        JSONB       NOT NULL,         -- AnalysisResult JSON lengkap dari Gemini
  disease_name  TEXT,                        -- Denormalized: nama penyakit (untuk display cepat)
  urgency       TEXT,                        -- Denormalized: IMMEDIATE | HIGH | MEDIUM | LOW
  product_name  TEXT                         -- Denormalized: nama produk jika mode label/both
);

-- Index untuk sorting terbaru
CREATE INDEX IF NOT EXISTS idx_history_created_at
  ON history(created_at DESC);

-- Index untuk filter per session
CREATE INDEX IF NOT EXISTS idx_history_session_id
  ON history(session_id);

-- ================================================================
-- Row Level Security (RLS) — dinonaktifkan karena backend pakai service_role
-- Service role key bypass RLS secara default
-- ================================================================
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Policy: backend (service_role) bisa akses semua
CREATE POLICY "service_role_full_access" ON history
  FOR ALL
  USING (true)
  WITH CHECK (true);
