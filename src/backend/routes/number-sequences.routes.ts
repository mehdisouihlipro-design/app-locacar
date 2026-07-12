// src/backend/routes/number-sequences.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { resyncSequence } from '../utils/number-sequence';

const router = Router();

// ── GET / — liste toutes les souches avec aperçu du prochain numéro ────────────

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/number_sequences?select=*&order=id.asc');
    const sequences = result.data || [];

    const year = new Date().getFullYear();
    const enriched = sequences.map((s: any) => {
      const nextN = s.reset_annually && s.last_year && s.last_year < year
        ? 1
        : (s.last_number || 0) + 1;
      let preview = '';
      if (s.prefix) preview += s.prefix + s.separator;
      if (s.include_year) preview += year + s.separator;
      preview += String(nextN).padStart(s.digits, '0');
      return { ...s, next_preview: preview };
    });

    res.json({ success: true, data: enriched });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── GET /:id — détail d'une souche ────────────────────────────────────────────

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/number_sequences?id=eq.${req.params.id}&select=*`);
    if (!result.data?.[0]) return res.status(404).json({ success: false, message: 'Souche introuvable.' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── PUT /:id — mettre à jour la configuration d'une souche ───────────────────

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/number_sequences?id=eq.${req.params.id}&select=id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Souche introuvable.' });

    const allowed = ['prefix', 'separator', 'include_year', 'digits', 'reset_annually'];
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key];
    }

    if (typeof update['digits'] === 'number' && (update['digits'] < 1 || update['digits'] > 10)) {
      return res.status(422).json({ success: false, message: 'digits doit être compris entre 1 et 10.' });
    }
    if (typeof update['prefix'] === 'string' && update['prefix'].length > 20) {
      return res.status(422).json({ success: false, message: 'Le préfixe ne peut pas dépasser 20 caractères.' });
    }

    const result = await global.db.patch(
      `/number_sequences?id=eq.${req.params.id}`,
      update,
      { headers: { Prefer: 'return=representation' } }
    );
    res.json({ success: true, data: Array.isArray(result.data) ? result.data[0] : result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── POST /:id/resync — resynchronise last_number sur le max réel en base ─────

router.post('/:id/resync', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/number_sequences?id=eq.${req.params.id}&select=id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Souche introuvable.' });

    const newMax = await resyncSequence(req.params.id);
    res.json({ success: true, message: `Souche resynchronisée. Dernier numéro en base : ${newMax}.`, last_number: newMax });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── GET /:id/audit — détecte les trous dans la séquence ──────────────────────

router.get('/:id/audit', async (req: AuthRequest, res: Response) => {
  const TABLE_MAP: Record<string, { table: string; col: string }> = {
    invoices:  { table: 'invoices',  col: 'invoice_number' },
    contracts: { table: 'contracts', col: 'contract_number' },
    quotes:    { table: 'quotes',    col: 'quote_number' },
  };
  const target = TABLE_MAP[req.params.id];
  if (!target) return res.status(400).json({ success: false, message: 'Audit non disponible pour cette souche.' });

  try {
    const seqRes = await global.db.get(`/number_sequences?id=eq.${req.params.id}&select=*`);
    const seq = seqRes.data?.[0];
    if (!seq) return res.status(404).json({ success: false, message: 'Souche introuvable.' });

    const recsRes = await global.db.get(`/${target.table}?${target.col}=not.is.null&select=${target.col}&order=${target.col}.asc`);
    const numbers: number[] = (recsRes.data || [])
      .map((r: any) => {
        const raw: string = r[target.col] || '';
        const match = raw.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n: number | null): n is number => n !== null)
      .sort((a: number, b: number) => a - b);

    if (!numbers.length) {
      return res.json({ success: true, data: { gaps: [], duplicates: [], total: 0, min: null, max: null } });
    }

    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const set = new Set(numbers);
    const gaps: number[] = [];
    const duplicates: number[] = [];

    for (let i = min; i <= max; i++) {
      if (!set.has(i)) gaps.push(i);
    }
    numbers.forEach((n, idx) => {
      if (idx > 0 && numbers[idx - 1] === n) duplicates.push(n);
    });

    res.json({ success: true, data: { gaps, duplicates, total: numbers.length, min, max, last_number: seq.last_number } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── POST /:id/reset — remet le compteur à 0 (prochain numéro = 1) ─────────────
router.post('/:id/reset', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/number_sequences?id=eq.${req.params.id}&select=id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Souche introuvable.' });
    await global.db.patch(
      `/number_sequences?id=eq.${req.params.id}`,
      { last_number: 0, last_year: null, updated_at: new Date().toISOString() },
      { headers: { Prefer: 'return=minimal' } }
    );
    res.json({ success: true, message: 'Souche remise à zéro. Prochain numéro : 1.' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

export default router;
