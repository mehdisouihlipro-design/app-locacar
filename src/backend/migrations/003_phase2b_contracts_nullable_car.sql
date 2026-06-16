-- Phase 2B : contracts.car_id devient nullable pour permettre la creation
-- d'un entete de contrat sans vehicule (les vehicules sont geres en tant que
-- lignes de contrat dans contract_lines, ajoutees via le modal de detail).
-- Additive et retrocompatible : tous les contrats existants ont deja un car_id.
-- A executer dans l'editeur SQL Supabase (idempotent).

ALTER TABLE contracts ALTER COLUMN car_id DROP NOT NULL;
ALTER TABLE contracts ALTER COLUMN rate_currency SET DEFAULT 'TND';
ALTER TABLE contracts ALTER COLUMN quotient_currency SET DEFAULT 'TND';
