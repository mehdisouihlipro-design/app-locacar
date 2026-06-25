// src/backend/routes/quotes.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';
import { nextSequenceNumber } from '../utils/number-sequence';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

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

async function findOverlap(carId: string, periodStart: string, periodEnd: string): Promise<string | null> {
  const linesRes = await global.db.get(
    `/contract_lines?car_id=eq.${carId}&status=eq.active&select=id,contract_id,car_plate,period_start,period_end`
  );
  const overlap = (linesRes.data || []).find((l: any) => periodStart <= l.period_end && periodEnd >= l.period_start);
  if (overlap) return `⚠ Le véhicule ${overlap.car_plate} est déjà engagé du ${overlap.period_start} au ${overlap.period_end} (contrat ${overlap.contract_id}).`;
  const rsvRes = await global.db.get(
    `/reservations?car_id=eq.${carId}&select=id,car_plate,start_date,end_date,status`
  );
  const rsvOverlap = (rsvRes.data || []).find((r: any) =>
    r.status !== 'annulee' && r.status !== 'terminee' && periodStart <= r.end_date && periodEnd >= r.start_date
  );
  if (rsvOverlap) return `⚠ Le véhicule ${rsvOverlap.car_plate} est déjà réservé du ${rsvOverlap.start_date} au ${rsvOverlap.end_date}.`;
  return null;
}

async function applyBR25ForLine(
  lineId: string, carId: string, carPlate: string,
  periodStart: string, periodEnd: string, contractId: string, req: AuthRequest
): Promise<Record<string, unknown> | null> {
  try {
    const contractRes = await global.db.get(`/contracts?id=eq.${contractId}&select=customer_id,customer_name`);
    const contract = contractRes.data?.[0] || {};
    const rsvRes = await global.db.get(`/reservations?car_id=eq.${carId}&select=id,start_date,end_date,status`);
    const active = (rsvRes.data || []).filter((r: any) => r.status !== 'annulee' && r.status !== 'terminee');
    const exact   = active.find((r: any) => r.start_date === periodStart && r.end_date === periodEnd);
    const overlap = !exact && active.find((r: any) => periodStart <= r.end_date && periodEnd >= r.start_date);
    let reservationId: string;
    if (exact) {
      reservationId = exact.id;
      await global.db.patch(`/reservations?id=eq.${exact.id}`, stampUpdate({ contract_line_id: lineId }, req), { headers: { Prefer: 'return=minimal' } });
    } else if (overlap) {
      reservationId = overlap.id;
      await global.db.patch(`/reservations?id=eq.${overlap.id}`, stampUpdate({ start_date: periodStart, end_date: periodEnd, contract_line_id: lineId }, req), { headers: { Prefer: 'return=minimal' } });
    } else {
      const rsvId = uid('RSV');
      await global.db.post('/reservations', stampCreate({
        id: rsvId, car_id: carId, car_plate: carPlate,
        customer_id: contract.customer_id || null, customer_name: contract.customer_name || '',
        start_date: periodStart, end_date: periodEnd, start_time: '09:00', end_time: '18:00',
        status: 'confirmee', contract_line_id: lineId,
      }, req), { headers: { Prefer: 'return=minimal' } });
      reservationId = rsvId;
    }
    await global.db.patch(`/contract_lines?id=eq.${lineId}`, stampUpdate({ reservation_id: reservationId }, req), { headers: { Prefer: 'return=minimal' } });
    const finalRes = await global.db.get(`/reservations?id=eq.${reservationId}&select=*`);
    return finalRes.data?.[0] || null;
  } catch (e: any) {
    console.error('[BR25/validate]', e?.message);
    return null;
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/quotes?select=*&order=created_at.desc');
    res.json({ success: true, data: result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/quotes?id=eq.${req.params.id}&select=*`);
    if (!result.data?.[0]) return res.status(404).json({ success: false, message: 'Devis introuvable.' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.body.id || uid('QUO');
    let quoteNumber = req.body.quote_number || null;
    if (!quoteNumber) {
      try { quoteNumber = await nextSequenceNumber('quotes'); } catch { /* non bloquant si souche absente */ }
    }
    const body = {
      ...req.body, id,
      quote_number: quoteNumber,
      status: req.body.status || 'brouillon',
      total_amount_ht: 0, total_vat_amount: 0, total_amount_ttc: 0,
    };
    await global.db.post('/quotes', stampCreate(body, req), { headers: { Prefer: 'return=minimal' } });
    res.status(201).json({ success: true, data: { id, ...body } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/quotes?id=eq.${req.params.id}&select=id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Devis introuvable.' });
    const result = await global.db.patch(`/quotes?id=eq.${req.params.id}`, stampUpdate(req.body, req), { headers: { Prefer: 'return=representation' } });
    res.json({ success: true, data: Array.isArray(result.data) ? result.data[0] : result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await global.db.delete(`/quotes?id=eq.${req.params.id}`);
    res.json({ success: true, message: 'Devis supprimé.' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── Validation → Contrat (BR27) ───────────────────────────────────────────────

router.post('/:id/validate', async (req: AuthRequest, res: Response) => {
  try {
    const quoteRes = await global.db.get(`/quotes?id=eq.${req.params.id}&select=*`);
    const quote = quoteRes.data?.[0];
    if (!quote) return res.status(404).json({ success: false, message: 'Devis introuvable.' });
    if (!['brouillon', 'envoye'].includes(quote.status)) {
      return res.status(422).json({ success: false, message: `Ce devis est déjà ${quote.status}.` });
    }

    const linesRes = await global.db.get(`/quote_lines?quote_id=eq.${req.params.id}&select=*&order=created_at.asc`);
    const quoteLines: any[] = linesRes.data || [];

    // BR19 : vérifier chevauchements avant de créer quoi que ce soit
    for (const ql of quoteLines) {
      if (!ql.car_id || !ql.period_start || !ql.period_end) continue;
      const conflict = await findOverlap(ql.car_id, ql.period_start, ql.period_end);
      if (conflict) return res.status(409).json({ success: false, error: 'vehicle_overlap', message: conflict });
    }

    // Créer le contrat entête
    const contractId = uid('CTR');
    const contractDate = new Date().toISOString().split('T')[0];
    const contractType = quote.type || 'court';
    const paymentPlan = contractType === 'long' ? 'mensualite' : 'paiement client debut';
    const contractBody = stampCreate({
      id: contractId,
      quote_id: req.params.id,
      customer_id: quote.customer_id,
      customer_name: quote.customer_name,
      car_id: null, car_plate: '',
      contract_date: contractDate,
      type: contractType,
      days: 0, months: 0, rate: 0, rate_currency: 'TND',
      quotient: 0, quotient_currency: 'TND', quotient_tnd: 0,
      total_amount_original: 0, total_amount_tnd: 0,
      payment_moment: 'debut', payment_plan: paymentPlan,
      status: 'active',
    }, req);
    await global.db.post('/contracts', contractBody, { headers: { Prefer: 'return=minimal' } });

    // Créer les lignes de contrat et appliquer BR25
    const createdLines: any[] = [];
    const createdReservations: any[] = [];
    try {
      for (const ql of quoteLines) {
        const lineId = uid('CL');
        const lineBody = stampCreate({
          id: lineId,
          contract_id: contractId,
          car_id: ql.car_id, car_plate: ql.car_plate || '',
          period_start: ql.period_start, period_end: ql.period_end,
          days: ql.days || 0, months: ql.months || 0,
          rate: ql.rate || 0, rate_currency: ql.rate_currency || 'TND',
          amount_ht: ql.amount_ht || 0, vat_amount: ql.vat_amount || 0,
          amount_ttc: ql.amount_ttc || 0, amount_tnd: ql.amount_tnd || 0,
          status: 'active',
        }, req);
        await global.db.post('/contract_lines', lineBody, { headers: { Prefer: 'return=minimal' } });
        createdLines.push({ ...lineBody });

        if (ql.car_id && ql.period_start && ql.period_end) {
          const rsv = await applyBR25ForLine(lineId, ql.car_id, ql.car_plate || '', ql.period_start, ql.period_end, contractId, req);
          if (rsv) createdReservations.push(rsv);
        }
      }
    } catch (lineErr: any) {
      // Rollback : supprimer les lignes déjà créées et le contrat
      for (const cl of createdLines) {
        await global.db.delete(`/contract_lines?id=eq.${cl.id}`).catch(() => {});
      }
      await global.db.delete(`/contracts?id=eq.${contractId}`).catch(() => {});
      throw lineErr;
    }

    // Marquer le devis comme validé
    await global.db.patch(
      `/quotes?id=eq.${req.params.id}`,
      stampUpdate({ status: 'valide', converted_contract_id: contractId }, req),
      { headers: { Prefer: 'return=minimal' } }
    );

    res.json({ success: true, contractId, data: { contractId, lines: createdLines, reservations: createdReservations } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

export default router;
