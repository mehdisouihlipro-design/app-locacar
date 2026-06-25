-- Migration 009 : Souches de numéros configurables
-- Couvre : factures (invoice_number existant), contrats (nouveau contract_number), devis (nouveau quote_number)

-- 1. Table de configuration des souches
CREATE TABLE IF NOT EXISTS number_sequences (
  id           TEXT PRIMARY KEY,                      -- 'invoices' | 'contracts' | 'quotes' | 'reservations'
  label        TEXT NOT NULL,                         -- libellé affiché
  prefix       TEXT NOT NULL DEFAULT '',              -- ex: 'FAC', 'CTR', 'DEV'
  separator    TEXT NOT NULL DEFAULT '-',             -- ex: '-', '/', '.', '_'
  include_year BOOLEAN NOT NULL DEFAULT TRUE,         -- inclure AAAA dans le numéro
  digits       INTEGER NOT NULL DEFAULT 4,            -- longueur du compteur (zéros de remplissage)
  last_number  INTEGER NOT NULL DEFAULT 0,            -- dernier numéro utilisé (pour l'année en cours si reset_annually)
  last_year    INTEGER,                               -- année du last_number
  reset_annually BOOLEAN NOT NULL DEFAULT TRUE,       -- remettre à 1 le 1er janvier
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Souches par défaut (cohérentes avec les formats existants)
INSERT INTO number_sequences (id, label, prefix, separator, include_year, digits, reset_annually) VALUES
  ('invoices',     'Factures',      'FAC', '-', TRUE,  4, TRUE),
  ('contracts',    'Contrats',      'CTR', '-', TRUE,  4, TRUE),
  ('quotes',       'Devis',         'DEV', '-', TRUE,  4, TRUE),
  ('reservations', 'Réservations',  'RSV', '-', FALSE, 5, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Nouvelles colonnes sur les tables métier
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_number TEXT UNIQUE;
ALTER TABLE quotes     ADD COLUMN IF NOT EXISTS quote_number   TEXT UNIQUE;
-- invoices.invoice_number existe déjà (migration 007)

-- 4. Fonction atomique de génération du prochain numéro
--    Appelée via POST /rpc/next_sequence_number { "p_sequence_id": "invoices" }
CREATE OR REPLACE FUNCTION next_sequence_number(p_sequence_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq        number_sequences%ROWTYPE;
  v_new_number INTEGER;
  v_year       INTEGER;
  v_formatted  TEXT;
BEGIN
  -- Verrouillage exclusif de la ligne pour éviter tout doublon en accès concurrent
  SELECT * INTO v_seq FROM number_sequences WHERE id = p_sequence_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Souche "%" introuvable.', p_sequence_id;
  END IF;

  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Remise à zéro annuelle si configurée et si on change d'année
  IF v_seq.reset_annually AND (v_seq.last_year IS NULL OR v_seq.last_year < v_year) THEN
    v_new_number := 1;
  ELSE
    v_new_number := COALESCE(v_seq.last_number, 0) + 1;
  END IF;

  -- Persistance du nouveau compteur
  UPDATE number_sequences
     SET last_number = v_new_number,
         last_year   = v_year,
         updated_at  = NOW()
   WHERE id = p_sequence_id;

  -- Formatage : {prefix}{sep}{année?}{sep}{000…N}
  v_formatted := '';
  IF v_seq.prefix <> '' THEN
    v_formatted := v_seq.prefix || v_seq.separator;
  END IF;
  IF v_seq.include_year THEN
    v_formatted := v_formatted || v_year::TEXT || v_seq.separator;
  END IF;
  v_formatted := v_formatted || LPAD(v_new_number::TEXT, v_seq.digits, '0');

  RETURN v_formatted;
END;
$$;

-- 5. Resynchronisation du compteur à partir des enregistrements réels
--    Appelée via POST /rpc/resync_sequence { "p_sequence_id": "invoices" }
CREATE OR REPLACE FUNCTION resync_sequence(p_sequence_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq    number_sequences%ROWTYPE;
  v_year   INTEGER;
  v_max    INTEGER := 0;
  v_rec    TEXT;
  v_num    INTEGER;
  v_prefix TEXT;
BEGIN
  SELECT * INTO v_seq FROM number_sequences WHERE id = p_sequence_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Souche "%" introuvable.', p_sequence_id;
  END IF;

  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Lecture du max selon la table cible
  IF p_sequence_id = 'invoices' THEN
    FOR v_rec IN SELECT invoice_number FROM invoices WHERE invoice_number IS NOT NULL LOOP
      -- Extraire le dernier segment numérique
      BEGIN
        v_num := CAST(regexp_replace(v_rec, '^.*[^0-9]', '') AS INTEGER);
        IF v_num > v_max THEN v_max := v_num; END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  ELSIF p_sequence_id = 'contracts' THEN
    FOR v_rec IN SELECT contract_number FROM contracts WHERE contract_number IS NOT NULL LOOP
      BEGIN
        v_num := CAST(regexp_replace(v_rec, '^.*[^0-9]', '') AS INTEGER);
        IF v_num > v_max THEN v_max := v_num; END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  ELSIF p_sequence_id = 'quotes' THEN
    FOR v_rec IN SELECT quote_number FROM quotes WHERE quote_number IS NOT NULL LOOP
      BEGIN
        v_num := CAST(regexp_replace(v_rec, '^.*[^0-9]', '') AS INTEGER);
        IF v_num > v_max THEN v_max := v_num; END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;

  UPDATE number_sequences
     SET last_number = v_max,
         last_year   = v_year,
         updated_at  = NOW()
   WHERE id = p_sequence_id;

  RETURN v_max;
END;
$$;
