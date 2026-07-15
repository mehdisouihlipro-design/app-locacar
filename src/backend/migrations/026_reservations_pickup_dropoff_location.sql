-- Migration 026 : lieu de sortie / lieu d'entrée sur les réservations
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS pickup_location  VARCHAR(200);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS dropoff_location VARCHAR(200);

SELECT pg_notify('pgrst', 'reload schema');
