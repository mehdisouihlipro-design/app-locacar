-- Phase 2A : socle DB pour les lignes de contrat (BR18, BR19, BR20, BR20bis)
-- A executer dans l'editeur SQL Supabase. Idempotent.
-- Decoupe en etapes : si l'etape 4 (contrainte EXCLUDE) echoue a cause de
-- chevauchements deja presents dans les donnees existantes, utiliser la
-- requete de diagnostic fournie, corriger les statuts en conflit, puis
-- ne relancer que l'etape 4.

-- =====================================================================
-- Etape 1 : table contract_lines
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- created_by/updated_by sans FK vers users(id) : la table users de ce projet
-- Supabase a un id de type uuid, incompatible avec le VARCHAR(50) utilise
-- pour les ids applicatifs (CTR-xxx, etc.) -- meme convention que 001_phase1a.
CREATE TABLE IF NOT EXISTS contract_lines (
  id VARCHAR(50) PRIMARY KEY,
  contract_id VARCHAR(50) NOT NULL REFERENCES contracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  car_plate VARCHAR(20),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days INTEGER,
  months INTEGER,
  rate DECIMAL(15, 2),
  rate_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  quotient DECIMAL(15, 2),
  quotient_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  quotient_tnd DECIMAL(15, 2),
  amount_ht DECIMAL(15, 2) DEFAULT 0,
  vat_amount DECIMAL(15, 2) DEFAULT 0,
  amount_ttc DECIMAL(15, 2) DEFAULT 0,
  amount_tnd DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  actual_end_date DATE,
  reservation_id VARCHAR(50) REFERENCES reservations(id),
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_contract_line_dates CHECK (period_end >= period_start),
  CONSTRAINT chk_contract_line_actual_end CHECK (actual_end_date IS NULL OR (actual_end_date >= period_start AND actual_end_date <= period_end))
);

CREATE INDEX IF NOT EXISTS idx_contract_lines_contract ON contract_lines(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_lines_car ON contract_lines(car_id);
CREATE INDEX IF NOT EXISTS idx_contract_lines_period ON contract_lines(car_id, period_start, period_end);

-- =====================================================================
-- Etape 2 : lien reservations -> lignes de contrat
-- Deviation vs SCHEMA_REFERENCE.md (qui propose ON DELETE CASCADE) :
-- ON DELETE SET NULL est choisi pour 2A car BR25 (phase 2C) precise qu'une
-- reservation preexistante liee a une ligne ne doit PAS etre supprimee si
-- la ligne l'est. CASCADE supprimerait silencieusement la reservation avant
-- meme que cette logique applicative n'existe.
-- =====================================================================
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS contract_line_id VARCHAR(50)
  REFERENCES contract_lines(id) ON DELETE SET NULL;

-- =====================================================================
-- Etape 3 : retro-remplissage (1 contrat existant = 1 ligne)
-- BR18 : amount_ht = total_amount_tnd actuel (deja HT, le tarif saisi est
-- HT). amount_ttc/vat_amount derives via settings.vat_rate, sans taxe
-- journaliere/timbre (ces taxes restent propres aux factures).
-- period_end pour type='long' reprend la convention 30 jours/mois utilisee
-- pour generer les factures mensuelles.
-- =====================================================================
INSERT INTO contract_lines (
  id, contract_id, car_id, car_plate, period_start, period_end, days, months,
  rate, rate_currency, quotient, quotient_currency, quotient_tnd,
  amount_ht, vat_amount, amount_ttc, amount_tnd, status,
  created_by, updated_by, created_at, updated_at
)
SELECT
  c.id || '-L1',
  c.id,
  c.car_id,
  c.car_plate,
  c.contract_date,
  CASE WHEN c.type = 'long'
    THEN c.contract_date + (COALESCE(c.months, 0) * 30)
    ELSE c.contract_date + COALESCE(c.days, 0)
  END,
  c.days,
  c.months,
  c.rate,
  c.rate_currency,
  c.quotient,
  c.quotient_currency,
  c.quotient_tnd,
  COALESCE(c.total_amount_tnd, 0) AS amount_ht,
  ROUND(COALESCE(c.total_amount_tnd, 0) * s.vat_rate / 100, 2) AS vat_amount,
  ROUND(COALESCE(c.total_amount_tnd, 0) * (1 + s.vat_rate / 100), 2) AS amount_ttc,
  ROUND(COALESCE(c.total_amount_tnd, 0) * (1 + s.vat_rate / 100), 2) AS amount_tnd,
  CASE c.status
    WHEN 'actif' THEN 'active'
    WHEN 'active' THEN 'active'
    WHEN 'termine' THEN 'termine'
    WHEN 'annule' THEN 'annule'
    WHEN 'resilie' THEN 'resilie'
    ELSE 'active'
  END,
  c.created_by, c.updated_by, c.created_at, c.updated_at
FROM contracts c
CROSS JOIN (SELECT vat_rate FROM settings WHERE id = 1) s
WHERE NOT EXISTS (SELECT 1 FROM contract_lines cl WHERE cl.contract_id = c.id);

-- =====================================================================
-- Etape 4 : contrainte d'exclusion (BR19 niveau 3)
-- Le bloc BEGIN/EXCEPTION cree un savepoint implicite : si des
-- chevauchements existent deja (23P01, exclusion_violation), la
-- contrainte n'est PAS ajoutee mais les etapes 1-3 et 5 restent commitees
-- (sans ce filet, l'erreur ferait annuler tout le script, y compris la
-- creation de la table -- comportement observe sur l'editeur SQL Supabase
-- qui execute le script entier dans une seule transaction).
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'excl_contract_lines_car_period'
  ) THEN
    BEGIN
      ALTER TABLE contract_lines ADD CONSTRAINT excl_contract_lines_car_period
        EXCLUDE USING gist (car_id WITH =, daterange(period_start, period_end, '[]') WITH &&)
        WHERE (status = 'active');
    EXCEPTION WHEN exclusion_violation THEN
      RAISE WARNING 'excl_contract_lines_car_period NON ajoutee : des lignes "active" se chevauchent deja sur le meme vehicule. Executer la requete de diagnostic ci-dessous, corriger les statuts en conflit, puis relancer cette etape 4 seule (bloc DO ci-dessus).';
    END;
  END IF;
END $$;

-- Diagnostic en cas d'echec de l'etape 4 : trouve les paires de lignes actives
-- qui se chevauchent sur le meme vehicule (a corriger manuellement, ex. passer
-- l'une des deux en statut 'termine' ou 'annule', avant de relancer l'etape 4
-- seule) :
--
-- SELECT a.id, a.contract_id, a.car_id, a.period_start, a.period_end,
--        b.id AS conflict_id, b.contract_id AS conflict_contract_id,
--        b.period_start AS conflict_start, b.period_end AS conflict_end
-- FROM contract_lines a
-- JOIN contract_lines b ON a.car_id = b.car_id AND a.id < b.id
--   AND a.status = 'active' AND b.status = 'active'
--   AND daterange(a.period_start, a.period_end, '[]') && daterange(b.period_start, b.period_end, '[]');

-- =====================================================================
-- Etape 5 : RPC create_contract_with_lines (BR20bis, creation atomique)
-- Pas de bloc EXCEPTION : toute erreur (y compris 23P01 levee par
-- excl_contract_lines_car_period) annule toute la fonction, donc l'entete
-- contracts insere plus haut est aussi annule (pas d'orphelin).
-- =====================================================================
CREATE OR REPLACE FUNCTION create_contract_with_lines(p_contract JSONB, p_lines JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_contract_id VARCHAR(50);
  v_line JSONB;
  v_lines_result JSONB := '[]'::jsonb;
  v_line_id VARCHAR(50);
BEGIN
  INSERT INTO contracts (
    id, customer_id, car_id, customer_name, car_plate, contract_date, type,
    days, months, rate, rate_currency, quotient, quotient_currency, quotient_tnd,
    total_amount_original, total_amount_tnd, payment_moment, payment_plan, status, notes,
    created_by, updated_by
  )
  SELECT
    p_contract->>'id', p_contract->>'customer_id', p_contract->>'car_id',
    p_contract->>'customer_name', p_contract->>'car_plate',
    (p_contract->>'contract_date')::date, p_contract->>'type',
    (p_contract->>'days')::int, (p_contract->>'months')::int,
    (p_contract->>'rate')::decimal, COALESCE(p_contract->>'rate_currency', 'TND'),
    (p_contract->>'quotient')::decimal, COALESCE(p_contract->>'quotient_currency', 'TND'),
    (p_contract->>'quotient_tnd')::decimal,
    (p_contract->>'total_amount_original')::decimal, (p_contract->>'total_amount_tnd')::decimal,
    p_contract->>'payment_moment', p_contract->>'payment_plan',
    COALESCE(p_contract->>'status', 'active'), p_contract->>'notes',
    p_contract->>'created_by', p_contract->>'updated_by'
  RETURNING id INTO v_contract_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    INSERT INTO contract_lines (
      id, contract_id, car_id, car_plate, period_start, period_end, days, months,
      rate, rate_currency, quotient, quotient_currency, quotient_tnd,
      amount_ht, vat_amount, amount_ttc, amount_tnd, status,
      created_by, updated_by
    )
    SELECT
      v_line->>'id', v_contract_id, v_line->>'car_id', v_line->>'car_plate',
      (v_line->>'period_start')::date, (v_line->>'period_end')::date,
      (v_line->>'days')::int, (v_line->>'months')::int,
      (v_line->>'rate')::decimal, COALESCE(v_line->>'rate_currency', 'TND'),
      (v_line->>'quotient')::decimal, COALESCE(v_line->>'quotient_currency', 'TND'), (v_line->>'quotient_tnd')::decimal,
      (v_line->>'amount_ht')::decimal, (v_line->>'vat_amount')::decimal,
      (v_line->>'amount_ttc')::decimal, (v_line->>'amount_tnd')::decimal,
      COALESCE(v_line->>'status', 'active'),
      p_contract->>'created_by', p_contract->>'updated_by'
    RETURNING id INTO v_line_id;

    v_lines_result := v_lines_result || jsonb_build_object('id', v_line_id);
  END LOOP;

  RETURN jsonb_build_object('id', v_contract_id, 'lines', v_lines_result);
END;
$$;

GRANT EXECUTE ON FUNCTION create_contract_with_lines(JSONB, JSONB) TO anon, authenticated, service_role;

-- Force PostgREST a recharger son cache de schema (nouvelle table + RPC),
-- pour que les routes /contract_lines et /rpc/create_contract_with_lines
-- soient immediatement disponibles sans attendre le prochain redemarrage.
NOTIFY pgrst, 'reload schema';
