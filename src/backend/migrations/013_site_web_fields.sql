-- Migration 013 — Portail client site-web
-- Ajoute les champs publics sur la table cars
-- et crée la table de plages d'indisponibilité manuelles

-- Champs site-web sur la table cars
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS photo_url      TEXT,
  ADD COLUMN IF NOT EXISTS site_visible   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS site_price_day DECIMAL(10, 2);

-- Table des plages d'indisponibilité manuelles (indépendant des contrats)
-- Une voiture est disponible par défaut sauf si une plage couvre la période recherchée.
CREATE TABLE IF NOT EXISTS site_unavailability (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id     VARCHAR(50)  NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  from_date  DATE         NOT NULL,
  to_date    DATE         NOT NULL,
  notes      VARCHAR(255),
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_dates CHECK (from_date <= to_date)
);

CREATE INDEX IF NOT EXISTS idx_site_unavailability_car_id    ON site_unavailability(car_id);
CREATE INDEX IF NOT EXISTS idx_site_unavailability_from_date ON site_unavailability(from_date);
CREATE INDEX IF NOT EXISTS idx_site_unavailability_to_date   ON site_unavailability(to_date);

-- Accès pour la clé anonyme (portail public) et service_role
GRANT SELECT ON site_unavailability TO anon;
GRANT SELECT ON site_unavailability TO authenticated;
GRANT ALL    ON site_unavailability TO service_role;
