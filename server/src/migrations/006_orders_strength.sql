-- Migration 006: Add strength and hookah_mix columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS strength VARCHAR(20) DEFAULT 'medium';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hookah_mix TEXT DEFAULT '';

