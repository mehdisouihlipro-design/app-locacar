-- Migration 019 : ajouter la colonne designation sur contract_lines
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE contract_lines
  ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT '';
