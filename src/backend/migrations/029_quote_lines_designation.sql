-- Migration 029 : ajouter la colonne designation sur quote_lines
-- Aligne quote_lines sur contract_lines (cf. migration 019) pour que les lignes de
-- devis puissent avoir une désignation personnalisée, comme les lignes de contrat.
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE quote_lines
  ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT '';
