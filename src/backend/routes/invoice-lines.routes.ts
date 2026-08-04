// src/backend/routes/invoice-lines.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

const router = Router();

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function recalcInvoiceTotals(invoiceId: string): Promise<void> {
  const linesRes = await global.db.get(
    `/invoice_lines?invoice_id=eq.${invoiceId}&select=amount_ht,vat_amount,daily_tax_amount,days,period_start,period_end,line_ttc`
  );
  const lines: any[] = linesRes.data || [];

  const totalHt   = lines.reduce((s, l) => s + Number(l.amount_ht        || 0), 0);
  const totalVat  = lines.reduce((s, l) => s + Number(l.vat_amount        || 0), 0);
  const totalTax  = lines.reduce((s, l) => s + Number(l.daily_tax_amount  || 0), 0);
  const totalDays = lines.reduce((s, l) => s + Number(l.days              || 0), 0);
  const totalLineTtc = lines.reduce((s, l) => s + Number(l.line_ttc       || 0), 0);

  const datesWithData = lines.filter(l => l.period_start && l.period_end);
  const periodStart = datesWithData.length
    ? datesWithData.reduce((mn, l) => l.period_start < mn ? l.period_start : mn, datesWithData[0].period_start)
    : null;
  const periodEnd = datesWithData.length
    ? datesWithData.reduce((mx, l) => l.period_end > mx ? l.period_end : mx, datesWithData[0].period_end)
    : null;

  const invRes = await global.db.get(`/invoices?id=eq.${invoiceId}&select=stamp_duty_amount,paid_amount_tnd`);
  const inv = invRes.data?.[0] || {};
  const stamp    = Number(inv.stamp_duty_amount || 0);
  const paidTnd  = Number(inv.paid_amount_tnd  || 0);
  const totalTtc = totalLineTtc + stamp;

  await global.db.patch(
    `/invoices?id=eq.${invoiceId}`,
    {
      amount_ht: totalHt, vat_amount: totalVat, daily_tax_amount: totalTax,
      amount_tnd: totalTtc, due_amount_tnd: Math.max(0, totalTtc - paidTnd),
      rental_days: totalDays, period_start: periodStart, period_end: periodEnd,
    },
    { headers: { Prefer: 'return=minimal' } }
  );
}

// ── GET ───────────────────────────────────────────────────────────────────────

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { invoice_id } = req.query as Record<string, string>;
    const filter = invoice_id
      ? `?invoice_id=eq.${invoice_id}&select=*&order=created_at.asc`
      : '?select=*&order=invoice_id.asc,created_at.asc';
    const result = await global.db.get(`/invoice_lines${filter}`);
    res.json({ success: true, data: result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── POST ──────────────────────────────────────────────────────────────────────

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = req.body.invoice_id;
    if (!invoiceId) return res.status(400).json({ success: false, message: 'invoice_id requis.' });

    // Récupérer la facture pour hériter du contract_id si besoin
    const invRes = await global.db.get(`/invoices?id=eq.${invoiceId}&select=id,contract_id,status`);
    const invoice = invRes.data?.[0];
    if (!invoice) return res.status(404).json({ success: false, message: 'Facture introuvable.' });

    // N'autoriser l'ajout que pour les factures en brouillon
    if (invoice.status && invoice.status !== 'brouillon') {
      return res.status(422).json({ success: false, message: 'Impossible d\'ajouter une ligne : la facture est déjà confirmée.' });
    }

    // Si aucun contract_id fourni, hériter de celui de la facture (utile pour factures brouillon)
    const providedContractId = req.body.contract_id || req.body.contractId || null;
    const contractIdToUse = providedContractId || invoice.contract_id || null;

    const id = req.body.id || uid('ILN');
    const bodyPayload = { ...req.body, id, contract_id: contractIdToUse };
    const body = stampCreate(bodyPayload, req);
    await global.db.post('/invoice_lines', body, { headers: { Prefer: 'return=minimal' } });

    await recalcInvoiceTotals(invoiceId);

    const result = await global.db.get(`/invoice_lines?id=eq.${id}&select=*`);
    res.status(201).json({ success: true, data: result.data?.[0] || { id, ...body } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── PUT ───────────────────────────────────────────────────────────────────────

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/invoice_lines?id=eq.${req.params.id}&select=id,invoice_id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Ligne introuvable.' });
    const invoiceId: string = check.data[0].invoice_id;

    await global.db.patch(
      `/invoice_lines?id=eq.${req.params.id}`,
      stampUpdate(req.body, req),
      { headers: { Prefer: 'return=minimal' } }
    );

    await recalcInvoiceTotals(invoiceId);

    const result = await global.db.get(`/invoice_lines?id=eq.${req.params.id}&select=*`);
    res.json({ success: true, data: result.data?.[0] });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── DELETE ────────────────────────────────────────────────────────────────────

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/invoice_lines?id=eq.${req.params.id}&select=id,invoice_id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Ligne introuvable.' });
    const invoiceId: string = check.data[0].invoice_id;

    const countRes = await global.db.get(`/invoice_lines?invoice_id=eq.${invoiceId}&select=id`);
    if ((countRes.data || []).length <= 1) {
      return res.status(422).json({ success: false, message: 'Une facture doit avoir au moins une ligne.' });
    }

    await global.db.delete(`/invoice_lines?id=eq.${req.params.id}`);
    await recalcInvoiceTotals(invoiceId);

    res.json({ success: true, message: 'Ligne supprimée.' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

export default router;
