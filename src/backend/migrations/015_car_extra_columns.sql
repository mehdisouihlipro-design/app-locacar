-- Migration 015 : colonnes supplémentaires table cars
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS registration_date DATE,
  ADD COLUMN IF NOT EXISTS fuel_type TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS purchase_date DATE;
