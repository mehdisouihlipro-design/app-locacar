-- Migration 023 : tolérance en heures pour le calcul des jours de location
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE settings ADD COLUMN IF NOT EXISTS rental_tolerance_hours INTEGER DEFAULT 0;
