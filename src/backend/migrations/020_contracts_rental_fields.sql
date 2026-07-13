-- Migration 020 : champs complémentaires contrat de location (court terme)
-- À exécuter dans le SQL Editor Supabase

-- Groupe 2 : financier contrat
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS franchise_amount          DECIMAL(15,2);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS insurance_rc_amount       DECIMAL(15,2);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS insurance_passengers_amount DECIMAL(15,2);

-- Groupe 3 : état véhicule prise / restitution
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS mileage_start             INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS mileage_end               INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS fuel_level_start          VARCHAR(10);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS fuel_level_end            VARCHAR(10);

-- Groupe 4 : checklist accessoires
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS has_spare_tire            BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS has_jack_tools            BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS has_radio                 BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS has_hubcaps               BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS has_mirrors               BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS has_ac                    BOOLEAN DEFAULT false;

-- Groupe 5 : identification locataire complémentaire
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_dob              DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_nationality      VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_entry_date_tn   DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_id_issued_date   DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_id_issued_at     VARCHAR(200);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_license_number   VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_license_issued_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_license_issued_at VARCHAR(200);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_local_address    TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_stay_reason      VARCHAR(50);

-- Groupe 6 : 2ème conducteur
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS driver2_name              VARCHAR(200);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS driver2_id_number         VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS driver2_id_issued_date    DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS driver2_id_issued_at      VARCHAR(200);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS driver2_license_number    VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS driver2_license_issued_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS driver2_license_issued_at VARCHAR(200);

-- Groupe 7 : changement de voiture en cours de location
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS replacement_car_model     VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS replacement_car_plate      VARCHAR(20);
