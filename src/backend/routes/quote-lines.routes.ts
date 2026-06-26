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

function addHoursToTime(time: string, hours: number): string {
  if (!hours || !time) return time;
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = Math.min(h * 60 + m + Math.round(hours * 60), 23 * 60 + 59);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function periodsConflict(
  s1: string, e1: string, p1: string | null, r1: string | null,
  s2: string, e2: string, p2: string | null, r2: string | null,
  bufferHours: number = 0
): boolean {
  if (e1 < s2 || e2 < s1) return false;
  if (e1 === s2) { if (r1 && p2) return addHoursToTime(r1, bufferHours) > p2; return true; }
  if (e2 === s1) { if (r2 && p1) return addHoursToTime(r2, bufferHours) > p1; return true; }
  return true;
}

async function findQuoteOverlap(
  carId: string,
  periodStart: string,
  periodEnd: string,
  pickupTime: string | null = null,
  returnTime: string | null = null,
  excludeLineId?: string
): Promise<{ message: string } | null> {
  let bufferHours = 0;
  try {
    const settingsRes = await global.db.get('/settings?id=eq.1&select=reservation_buffer_hours');
    bufferHours = Number((settingsRes.data || [])[0]?.reservation_buffer_hours ?? 0);
  } catch (_) { /* buffer = 0 si inaccessible */ }

  const qlRes = await global.db.get(
    `/quote_lines?car_id=eq.${carId}&select=id,quote_id,car_plate,period_start,period_end,pickup_time,return_time`
  );
  const conflictQl = (qlRes.data || []).find((l: any) => {
    if (excludeLineId && l.id === excludeLineId) return false;
    return periodsConflict(periodStart, periodEnd, pickupTime, returnTime, l.period_start, l.period_end, l.pickup_time, l.return_time, bufferHours);
  });
  if (conflictQl) {
    return { message: `⚠ Le véhicule ${conflictQl.car_plate} est déjà présent dans le devis ${conflictQl.quote_id} du ${conflictQl.period_start} au ${conflictQl.period_end}. Choisissez une autre période ou un autre véhicule.` };
  }

  const clRes = await global.db.get(
    `/contract_lines?car_id=eq.${carId}&status=eq.active&select=id,contract_id,car_plate,period_start,period_end,pickup_time,return_time`
  );
  const conflictCl = (clRes.data || []).find((l: any) => {
    return periodsConflict(periodStart, periodEnd, pickupTime, returnTime, l.period_start, l.period_end, l.pickup_time, l.return_time, bufferHours);
  });
  if (conflictCl) {
    return { message: `⚠ Le véhicule ${conflictCl.car_plate} est déjà engagé sur le contrat ${conflictCl.contract_id} du ${conflictCl.period_start} au ${conflictCl.period_end}.` };
  }

  return null;
}

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { car_id, period_start, period_end, pickup_time, return_time } = req.body;
    if (car_id && period_start && period_end) {
      const overlap = await findQuoteOverlap(car_id, period_start, period_end, pickup_time || null, return_time || null);
      if (overlap) return res.status(409).json({ success: false, code: 'vehicle_overlap', message: overlap.message });
    }
    const id = req.body.id || `QL-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const body = { ...req.body, id };
    await global.db.post('/quote_lines', stampCreate(body, req), { headers: { Prefer: 'return=minimal' } });
    if (body.quote_id) await recalcQuoteTotals(body.quote_id);
    res.status(201).json({ success: true, data: { id, ...body } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/quote_lines?id=eq.${req.params.id}&select=id,quote_id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Ligne introuvable.' });
    const { car_id, period_start, period_end, pickup_time, return_time } = req.body;
    if (car_id && period_start && period_end) {
      const overlap = await findQuoteOverlap(car_id, period_start, period_end, pickup_time || null, return_time || null, req.params.id);
      if (overlap) return res.status(409).json({ success: false, code: 'vehicle_overlap', message: overlap.message });
    }
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
