-- Migration 011 : heures de prise en charge et de restitution
-- Ajout sur contract_lines, quote_lines (court terme) et reservations

ALTER TABLE contract_lines
  ADD COLUMN IF NOT EXISTS pickup_time TIME,
  ADD COLUMN IF NOT EXISTS return_time TIME;

ALTER TABLE quote_lines
  ADD COLUMN IF NOT EXISTS pickup_time TIME,
  ADD COLUMN IF NOT EXISTS return_time TIME;

-- reservations possède déjà start_time / end_time — pas de nouveau champ nécessaire
