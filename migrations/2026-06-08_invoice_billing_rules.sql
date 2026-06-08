-- Migration : regles de facturation HT <-> TTC + edition/impression de factures
-- A executer dans Supabase SQL editor (le client utilise une cle anonyme et ne peut pas faire de DDL via l'API REST)

-- 1. Parametres de facturation + coordonnees legales (table settings)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 19,
  ADD COLUMN IF NOT EXISTS daily_tax_tnd DECIMAL(10, 3) NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS stamp_duty_tnd DECIMAL(10, 3) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS company_address TEXT,
  ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_rib VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_tax_id VARCHAR(50);

-- 2. Ventilation HT/TVA/taxe journaliere/timbre par facture (amount_tnd reste le total TTC)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS amount_ht DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_tax_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stamp_duty_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rental_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period_start DATE,
  ADD COLUMN IF NOT EXISTS period_end DATE;
