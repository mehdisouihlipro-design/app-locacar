-- Migration 028 : correction de resync_sequence (extraction du compteur)
-- À exécuter dans le SQL Editor Supabase
--
-- Bug : resync_sequence extrayait TOUS les chiffres finaux du numéro existant
-- (regexp_replace(v_rec, '^.*[^0-9]', '')). Pour une souche avec include_year=true
-- et separator='' (aucun séparateur entre l'année et le compteur, ex. "CTR20260010"),
-- cette extraction récupère "20260010" (année + compteur collés) au lieu de "0010"
-- (le compteur seul). resync_sequence corrompt alors last_number à une valeur du
-- type 20260010 ; le prochain numéro généré redevient "CTR" + année + LPAD(20260011, 4)
-- (no-op car déjà plus long que 4) = "CTR202620260011" (année dupliquée visuellement).
--
-- Correctif : ne garder que les `digits` derniers caractères du bloc de chiffres
-- final (RIGHT(...)), qui correspondent toujours au compteur formaté par
-- next_sequence_number, quel que soit le séparateur ou include_year.

CREATE OR REPLACE FUNCTION resync_sequence(p_sequence_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq    number_sequences%ROWTYPE;
  v_year   INTEGER;
  v_max    INTEGER := 0;
  v_rec    TEXT;
  v_digits TEXT;
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
      BEGIN
        v_digits := regexp_replace(v_rec, '^.*[^0-9]', '');
        v_num := CAST(RIGHT(v_digits, GREATEST(v_seq.digits, 1)) AS INTEGER);
        IF v_num > v_max THEN v_max := v_num; END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  ELSIF p_sequence_id = 'contracts' THEN
    FOR v_rec IN SELECT contract_number FROM contracts WHERE contract_number IS NOT NULL LOOP
      BEGIN
        v_digits := regexp_replace(v_rec, '^.*[^0-9]', '');
        v_num := CAST(RIGHT(v_digits, GREATEST(v_seq.digits, 1)) AS INTEGER);
        IF v_num > v_max THEN v_max := v_num; END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  ELSIF p_sequence_id = 'quotes' THEN
    FOR v_rec IN SELECT quote_number FROM quotes WHERE quote_number IS NOT NULL LOOP
      BEGIN
        v_digits := regexp_replace(v_rec, '^.*[^0-9]', '');
        v_num := CAST(RIGHT(v_digits, GREATEST(v_seq.digits, 1)) AS INTEGER);
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
