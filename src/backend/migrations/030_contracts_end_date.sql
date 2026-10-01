-- Migration 030 : ajouter la colonne end_date sur contracts
-- Date de fin d'entête, distincte de contract_date (date de signature). Permet de
-- cascader automatiquement les dates vers les contract_lines à la modification.
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS end_date DATE;
