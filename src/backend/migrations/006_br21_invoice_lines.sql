-- Migration 006 : table invoice_lines relationnelle (BR21)
-- À exécuter dans le SQL Editor Supabase

CREATE TABLE IF NOT EXISTS invoice_lines (
  id             VARCHAR(50)    PRIMARY KEY,
  invoice_id     VARCHAR(100)   NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  contract_line_id VARCHAR(50)  REFERENCES contract_lines(id) ON DELETE SET NULL,
  contract_id    VARCHAR(50),
  car_plate      VARCHAR(20)    DEFAULT '',
  designation    TEXT           DEFAULT '',
  amount_original DECIMAL(12,3) DEFAULT 0,
  currency       VARCHAR(10)    DEFAULT 'TND',
  amount_ht      DECIMAL(12,3)  DEFAULT 0,
  vat_amount     DECIMAL(12,3)  DEFAULT 0,
  daily_tax_amount DECIMAL(12,3) DEFAULT 0,
  days           INTEGER        DEFAULT 0,
  period_start   DATE,
  period_end     DATE,
  line_ttc       DECIMAL(12,3)  DEFAULT 0,
  created_at     TIMESTAMPTZ    DEFAULT NOW(),
  created_by     VARCHAR(100),
  updated_at     TIMESTAMPTZ    DEFAULT NOW(),
  updated_by     VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_contract_line ON invoice_lines(contract_line_id);
