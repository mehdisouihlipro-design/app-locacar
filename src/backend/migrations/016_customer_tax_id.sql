-- Migration 016 : matricule fiscal client
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_id TEXT;
