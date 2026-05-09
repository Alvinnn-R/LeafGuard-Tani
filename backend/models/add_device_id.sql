-- Migration: Tambah kolom device_id ke tabel history
-- Jalankan di Supabase SQL Editor

-- 1. Tambah kolom device_id (nullable, karena data lama belum punya)
ALTER TABLE history
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 2. Index untuk query filter per device (performa)
CREATE INDEX IF NOT EXISTS idx_history_device_id ON history(device_id);

-- 3. Composite index: device_id + created_at (untuk GET /history?device_id=xxx order by created_at)
CREATE INDEX IF NOT EXISTS idx_history_device_created ON history(device_id, created_at DESC);
