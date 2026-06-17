-- Phase 4 : Devis entête + lignes (BR27)
-- À exécuter dans le SQL Editor Supabase

CREATE TABLE IF NOT EXISTS quotes (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id),
  customer_name VARCHAR(255),
  quote_date DATE NOT NULL,
  validity_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'brouillon',
  notes TEXT,
  total_amount_ht DECIMAL(15,2) DEFAULT 0,
  total_vat_amount DECIMAL(15,2) DEFAULT 0,
  total_amount_ttc DECIMAL(15,2) DEFAULT 0,
  converted_contract_id VARCHAR(50),
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_lines (
  id VARCHAR(50) PRIMARY KEY,
  quote_id VARCHAR(50) NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  car_id VARCHAR(50) REFERENCES cars(id),
  car_plate VARCHAR(50),
  period_start DATE,
  period_end DATE,
  days INTEGER DEFAULT 0,
  months INTEGER DEFAULT 0,
  rate DECIMAL(15,2) DEFAULT 0,
  rate_currency VARCHAR(10) DEFAULT 'TND',
  amount_ht DECIMAL(15,2) DEFAULT 0,
  vat_amount DECIMAL(15,2) DEFAULT 0,
  amount_ttc DECIMAL(15,2) DEFAULT 0,
  amount_tnd DECIMAL(15,2) DEFAULT 0,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
