-- Migration 017 : rendre customer_id optionnel dans les réservations
-- Permet la création rapide depuis le Gantt sans client associé

ALTER TABLE reservations
  ALTER COLUMN customer_id DROP NOT NULL;
