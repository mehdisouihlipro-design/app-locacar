-- Migration : permettre la modification exceptionnelle de l'Id d'un contrat ou d'une facture
-- avec repercussion automatique sur les enregistrements lies (ON UPDATE CASCADE).
-- A executer dans Supabase SQL editor (DDL non disponible via l'API REST avec la cle anonyme).

-- References vers contracts(id)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_contract_id_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON UPDATE CASCADE;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_contract_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON UPDATE CASCADE;

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_contract_id_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_contract_id_fkey
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON UPDATE CASCADE;

-- References vers invoices(id)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON UPDATE CASCADE;

ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_invoice_id_fkey;
ALTER TABLE collections ADD CONSTRAINT collections_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON UPDATE CASCADE;
