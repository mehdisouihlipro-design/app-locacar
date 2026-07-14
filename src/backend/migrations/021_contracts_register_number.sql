-- Migration 021 : numéro de registre de commerce du locataire
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS register_number VARCHAR(100);
