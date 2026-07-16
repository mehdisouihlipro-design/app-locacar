-- Migration 027 : champs identification locataire sur la table customers
-- À exécuter dans le SQL Editor Supabase

ALTER TABLE customers ADD COLUMN IF NOT EXISTS id_number       VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS id_issued_date  DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS id_issued_place VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS license_number       VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS license_issued_date  DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS license_issued_place VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS dob             DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS nationality     VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS entry_date_tn   DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS stay_reason     VARCHAR(50);

SELECT pg_notify('pgrst', 'reload schema');
