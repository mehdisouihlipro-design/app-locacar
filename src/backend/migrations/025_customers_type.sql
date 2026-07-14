-- Migration 025 : type de client (particulier / entreprise) sur la table customers
-- À exécuter dans le SQL Editor Supabase
-- Suivi de : NOTIFY pgrst, 'reload schema';

ALTER TABLE customers ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'particulier';

-- S'assurer que le cache PostgREST est rechargé pour first_name, last_name, type
SELECT pg_notify('pgrst', 'reload schema');
