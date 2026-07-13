-- Migration 018 : type de négociation (journalier / mensuel) sur devis et contrats
-- Détermine le mode de calcul de l'échéancier :
--   'daily'   → montant_ht = tarif_journalier × jours (comportement actuel)
--   'monthly' → mensualité fixe indépendante du nombre de jours dans le mois

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS rate_type VARCHAR(10) DEFAULT 'daily'
    CHECK (rate_type IN ('daily', 'monthly'));

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS rate_type VARCHAR(10) DEFAULT 'daily'
    CHECK (rate_type IN ('daily', 'monthly'));
