// src/backend/utils/number-sequence.ts
// Génère le prochain numéro d'une souche via la fonction RPC Supabase (atomique, FOR UPDATE).
// Fallback : si le GRANT EXECUTE n'est pas encore appliqué, lit/écrit la table directement.

export async function nextSequenceNumber(sequenceId: string): Promise<string> {
  // 1. Essai via RPC (atomique, préféré)
  try {
    const res = await global.db.post('/rpc/next_sequence_number', { p_sequence_id: sequenceId });
    const value = res.data;
    if (typeof value === 'string' && value) return value;
  } catch (rpcErr: any) {
    console.warn(`[sequence] RPC next_sequence_number indisponible pour "${sequenceId}" (GRANT manquant ?), fallback REST:`, rpcErr?.response?.data || rpcErr?.message);
  }

  // 2. Fallback : lecture + mise à jour directe via REST (service_role a accès aux tables)
  const seqRes = await global.db.get(`/number_sequences?id=eq.${sequenceId}&select=*`);
  const seq = (seqRes.data || [])[0];
  if (!seq) throw new Error(`Souche "${sequenceId}" introuvable.`);

  const year = new Date().getFullYear();
  let newNumber: number;
  if (seq.reset_annually && (!seq.last_year || Number(seq.last_year) < year)) {
    newNumber = 1;
  } else {
    newNumber = (Number(seq.last_number) || 0) + 1;
  }

  await global.db.patch(
    `/number_sequences?id=eq.${sequenceId}`,
    { last_number: newNumber, last_year: year, updated_at: new Date().toISOString() },
    { headers: { Prefer: 'return=minimal' } }
  );

  let formatted = '';
  if (seq.prefix) formatted = seq.prefix + seq.separator;
  if (seq.include_year) formatted += String(year) + seq.separator;
  formatted += String(newNumber).padStart(Number(seq.digits) || 4, '0');

  return formatted;
}

export async function resyncSequence(sequenceId: string): Promise<number> {
  try {
    const res = await global.db.post('/rpc/resync_sequence', { p_sequence_id: sequenceId });
    return Number(res.data ?? 0);
  } catch (rpcErr: any) {
    console.warn(`[sequence] RPC resync_sequence indisponible pour "${sequenceId}":`, rpcErr?.response?.data || rpcErr?.message);
    return 0;
  }
}

// Mapping séquence → table/colonne pour la libération après suppression
const SEQ_TABLE_MAP: Record<string, { table: string; col: string }> = {
  invoices:  { table: 'invoices',  col: 'invoice_number' },
  contracts: { table: 'contracts', col: 'contract_number' },
  quotes:    { table: 'quotes',    col: 'quote_number' },
};

// Après suppression d'un enregistrement, recalcule last_number = MAX des numéros restants.
// Permet de réutiliser le numéro libéré au prochain enregistrement créé.
export async function releaseSequenceOnDelete(sequenceId: string): Promise<void> {
  // 1. Essai via RPC (plus fiable, géré côté base)
  try {
    await global.db.post('/rpc/resync_sequence', { p_sequence_id: sequenceId });
    return;
  } catch (_) {
    console.warn(`[sequence] RPC resync_sequence indisponible pour "${sequenceId}", fallback REST.`);
  }

  // 2. Fallback REST : lit tous les numéros restants, extrait la partie numérique, prend le max
  const target = SEQ_TABLE_MAP[sequenceId];
  if (!target) return;

  try {
    const records = await global.db.get(`/${target.table}?${target.col}=not.is.null&select=${target.col}&limit=2000`);
    const nums: number[] = (records.data || [])
      .map((r: any) => {
        const m = String(r[target.col] || '').match(/(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n: number) => n > 0);
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;

    await global.db.patch(
      `/number_sequences?id=eq.${sequenceId}`,
      { last_number: maxNum, updated_at: new Date().toISOString() },
      { headers: { Prefer: 'return=minimal' } }
    );
    console.log(`[sequence] Souche "${sequenceId}" libérée → last_number=${maxNum}`);
  } catch (err: any) {
    console.warn(`[sequence] releaseSequenceOnDelete fallback échoué pour "${sequenceId}":`, err?.message);
  }
}
