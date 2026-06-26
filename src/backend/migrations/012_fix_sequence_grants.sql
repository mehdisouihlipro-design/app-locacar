-- Migration 012 : Grant EXECUTE sur les fonctions de souches de numéros
-- Correction : migration 009 créait les fonctions sans GRANT EXECUTE,
-- rendant les appels RPC impossibles depuis PostgREST (anon/authenticated/service_role).

GRANT EXECUTE ON FUNCTION next_sequence_number(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION resync_sequence(TEXT) TO anon, authenticated, service_role;

-- Sécuriser aussi les lectures/écritures de la table number_sequences
GRANT SELECT, UPDATE ON number_sequences TO anon, authenticated, service_role;
