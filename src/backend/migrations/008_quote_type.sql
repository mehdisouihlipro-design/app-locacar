-- Migration 008 : ajout du type (court/long/autre) sur les devis
-- Permet de propager le type au contrat lors de la validation (BR27 + BR32)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'court'
  CHECK (type IN ('court', 'long', 'autre'));
