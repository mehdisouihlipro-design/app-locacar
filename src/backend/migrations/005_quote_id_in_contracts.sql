-- Migration 005 : ajouter quote_id dans contracts pour tracer le devis d'origine
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS quote_id VARCHAR(50) REFERENCES quotes(id) ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_contracts_quote ON contracts(quote_id);
