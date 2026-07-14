-- Migration 022 : numéro de pièce d'identité du locataire sur le contrat
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_id_number VARCHAR(100);
