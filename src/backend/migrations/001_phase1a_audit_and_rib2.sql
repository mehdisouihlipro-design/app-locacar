-- Phase 1A : piste d'audit (BR23) + second RIB (BR22)
-- A executer dans l'editeur SQL Supabase. Idempotent (ADD COLUMN IF NOT EXISTS).

-- Piste d'audit : created_by / updated_by sur les 16 tables concernees
-- (pas de contrainte FK vers users : evite les soucis d'ordre de creation /
-- de suppression d'utilisateur, coherent avec schema.sql)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','cars','reservations','contracts','invoices','payments',
    'collections','maintenance_costs','insurances','insurance_installments',
    'leasing_contracts','leasing_installments','vignettes','inspections',
    'inspection_details','settings'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by VARCHAR(50)', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50)', t);
  END LOOP;
END $$;

-- BR22 : second RIB sur settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_rib_label VARCHAR(120);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_rib_2 VARCHAR(50);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_rib_2_label VARCHAR(120);

-- BR22 : RIB choisi, fige sur chaque facture
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rib VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rib_label VARCHAR(120);
