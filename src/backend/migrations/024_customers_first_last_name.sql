-- Migration 024 : séparation nom / prénom sur la table customers
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name  VARCHAR(100);
