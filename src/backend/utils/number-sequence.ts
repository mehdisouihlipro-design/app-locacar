// src/backend/utils/number-sequence.ts
// Génère le prochain numéro d'une souche via la fonction RPC Supabase (atomique, FOR UPDATE).

export async function nextSequenceNumber(sequenceId: string): Promise<string> {
  const res = await global.db.post('/rpc/next_sequence_number', { p_sequence_id: sequenceId });
  const value = res.data;
  if (typeof value !== 'string' || !value) {
    throw new Error(`nextSequenceNumber: réponse inattendue pour "${sequenceId}": ${JSON.stringify(value)}`);
  }
  return value;
}

export async function resyncSequence(sequenceId: string): Promise<number> {
  const res = await global.db.post('/rpc/resync_sequence', { p_sequence_id: sequenceId });
  return Number(res.data ?? 0);
}
