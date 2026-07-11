-- Migration 014 : trésorerie initiale par voiture
-- Chaque véhicule peut avoir un solde initial de trésorerie (capital engagé, reprise de solde…).
-- Le solde global de trésorerie de l'agence est désormais la somme de ces valeurs par voiture.
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS opening_cash_tnd DECIMAL(15, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN cars.opening_cash_tnd IS 'Solde initial de trésorerie affecté à ce véhicule (TND). Le solde global = somme de tous les véhicules.';
