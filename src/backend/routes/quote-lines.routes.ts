// src/backend/routes/quote-lines.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

const router = Router();

async function recalcQuoteTotals(quoteId: string): Promise<void> {
  const linesRes = await global.db.get(`/quote_lines?quote_id=eq.${quoteId}&select=amount_ht,vat_amount,amount_ttc`);
  const lines: any[] = linesRes.data || [];
  const totalHt  = lines.reduce((s: number, l: any) => s + Number(l.amount_ht  || 0), 0);
  const totalVat = lines.reduce((s: number, l: any) => s + Number(l.vat_amount || 0), 0);
  const totalTtc = lines.reduce((s: number, l: any) => s + Number(l.amount_ttc || 0), 0);
  await global.db.patch(
    `/quotes?id=eq.${quoteId}`,
    { total_amount_ht: totalHt, total_vat_amount: totalVat, total_amount_ttc: totalTtc },
    { headers: { Prefer: 'return=minimal' } }
  );
}

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/quote_lines?select=*&order=created_at.asc');
    res.json({ success: true, data: result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.body.id || `QL-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const body = { ...req.body, id };
    await global.db.post('/quote_lines', stampCreate(body, req), { headers: { Prefer: 'return=minimal' } });
    // Recalculer les totaux du devis
    if (body.quote_id) await recalcQuoteTotals(body.quote_id);
    res.status(201).json({ success: true, data: { id, ...body } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/quote_lines?id=eq.${req.params.id}&select=id,quote_id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Ligne introuvable.' });
    const result = await global.db.patch(`/quote_lines?id=eq.${req.params.id}`, stampUpdate(req.body, req), { headers: { Prefer: 'return=representation' } });
    const updated = Array.isArray(result.data) ? result.data[0] : result.data;
    const quoteId = updated?.quote_id || check.data[0].quote_id;
    if (quoteId) await recalcQuoteTotals(quoteId);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/quote_lines?id=eq.${req.params.id}&select=id,quote_id`);
    const quoteId = check.data?.[0]?.quote_id || null;
    await global.db.delete(`/quote_lines?id=eq.${req.params.id}`);
    if (quoteId) await recalcQuoteTotals(quoteId);
    res.json({ success: true, message: 'Ligne de devis supprimée.' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

export default router;
