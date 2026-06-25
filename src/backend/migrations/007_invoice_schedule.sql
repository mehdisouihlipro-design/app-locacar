-- Migration 007 : Échéancier de facturation (BR27)
-- Sépare la planification (invoice_schedule) de la facture officielle (invoices).
-- Le numéro de facture (invoice_number) n'est attribué qu'à la confirmation.

-- Table principale de l'échéancier
CREATE TABLE IF NOT EXISTS invoice_schedule (
  id                TEXT         PRIMARY KEY,
  contract_id       TEXT         NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  scheduled_date    DATE         NOT NULL,           -- date prévue de facturation
  period_start      DATE         NOT NULL,           -- début de la période couverte
  period_end        DATE         NOT NULL,           -- fin de la période couverte
  amount_ht         DECIMAL(12,3) NOT NULL DEFAULT 0,
  vat_amount        DECIMAL(12,3) NOT NULL DEFAULT 0,
  daily_tax_amount  DECIMAL(12,3) NOT NULL DEFAULT 0,
  line_ttc          DECIMAL(12,3) NOT NULL DEFAULT 0,
  label             TEXT,                            -- ex: "Loyer Janvier 2026 — Peugeot 208 TN-1234"
  status            TEXT         NOT NULL DEFAULT 'planifie'
                    CHECK (status IN ('planifie','brouillon','confirme','annule')),
  invoice_id        TEXT         REFERENCES invoices(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  created_by        TEXT,
  updated_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_by        TEXT
);

CREATE INDEX IF NOT EXISTS idx_invoice_schedule_contract ON invoice_schedule(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoice_schedule_invoice  ON invoice_schedule(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_schedule_status   ON invoice_schedule(status);
CREATE INDEX IF NOT EXISTS idx_invoice_schedule_date     ON invoice_schedule(scheduled_date);

-- Numéro de facture séquentiel (NULL pour les brouillons, assigné à la confirmation)
-- Format : AAAA-NNNN  ex: 2026-0001
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;

-- Lien retour vers l'entrée d'échéancier (sans contrainte FK pour éviter la circularité)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS schedule_id TEXT;
