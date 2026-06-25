import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextInvoiceNumber(existing: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `${year}-`;
  const max = existing
    .filter(n => n && n.startsWith(prefix))
    .map(n => parseInt(n.slice(prefix.length), 10))
    .filter(n => !isNaN(n))
    .reduce((m, n) => Math.max(m, n), 0);
  return `${year}-${String(max + 1).padStart(4, '0')}`;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const contractId = req.query.contract_id as string | undefined;
    const filter = contractId ? `&contract_id=eq.${contractId}` : '';
    const result = await global.db.get(`/invoice_schedule?select=*&order=scheduled_date.asc${filter}`);
    res.json({ success: true, data: result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.body.id || uuidv4();
    const body = stampCreate({ ...req.body, id }, req);
    await global.db.post('/invoice_schedule', body, { headers: { Prefer: 'resolution=merge-duplicates' } });
    res.status(201).json({ success: true, data: { id, ...body } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.patch(
      `/invoice_schedule?id=eq.${req.params.id}`,
      stampUpdate(req.body, req),
      { headers: { Prefer: 'return=representation' } }
    );
    if (!result.data || result.data.length === 0)
      return res.status(404).json({ success: false, message: 'Entrée d\'échéancier introuvable.' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/invoice_schedule?id=eq.${req.params.id}&select=id,status`);
    const entry = check.data?.[0];
    if (!entry) return res.status(404).json({ success: false, message: 'Entrée d\'échéancier introuvable.' });
    if (entry.status !== 'planifie')
      return res.status(422).json({ success: false, message: `Impossible de supprimer une entrée au statut "${entry.status}".` });
    await global.db.delete(`/invoice_schedule?id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── Générer la facture brouillon depuis une entrée planifiée ──────────────────
// POST /invoice-schedule/:id/generate
// Crée une facture en statut "brouillon" sans numéro, lie l'entrée à cette facture.

router.post('/:id/generate', async (req: AuthRequest, res: Response) => {
  try {
    const schedRes = await global.db.get(`/invoice_schedule?id=eq.${req.params.id}&select=*`);
    const entry = schedRes.data?.[0];
    if (!entry) return res.status(404).json({ success: false, message: 'Entrée d\'échéancier introuvable.' });
    if (entry.status !== 'planifie')
      return res.status(422).json({ success: false, message: `Cette entrée est au statut "${entry.status}", pas "planifie".` });

    const contractRes = await global.db.get(`/contracts?id=eq.${entry.contract_id}&select=*`);
    const contract = contractRes.data?.[0];
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable.' });

    const linesRes = await global.db.get(`/contract_lines?contract_id=eq.${entry.contract_id}&status=eq.active&select=*`);
    const contractLines: any[] = linesRes.data || [];

    const invoiceId = `FAC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Créer la facture brouillon (sans invoice_number)
    const invoiceBody = stampCreate({
      id: invoiceId,
      contract_id: entry.contract_id,
      customer_name: contract.customer_name || '',
      label: entry.label || `Loyer ${formatPeriodLabel(entry.period_start, entry.period_end)}`,
      amount_ht: entry.amount_ht,
      vat_amount: entry.vat_amount,
      daily_tax_amount: entry.daily_tax_amount,
      stamp_duty_amount: 0,
      amount_tnd: entry.line_ttc,
      amount_original: entry.amount_ht,
      currency: 'TND',
      period_start: entry.period_start,
      period_end: entry.period_end,
      rental_days: daysBetween(entry.period_start, entry.period_end),
      paid_amount_tnd: 0,
      due_amount_tnd: entry.line_ttc,
      due_date: entry.scheduled_date,
      status: 'brouillon',
      invoice_number: null,
      schedule_id: entry.id,
      lines: [],
    }, req);
    await global.db.post('/invoices', invoiceBody, { headers: { Prefer: 'resolution=merge-duplicates' } });

    // Créer les lignes de facture (une par contract_line)
    for (const cl of contractLines) {
      const lineId = `ILN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await global.db.post('/invoice_lines', stampCreate({
        id: lineId,
        invoice_id: invoiceId,
        contract_id: entry.contract_id,
        contract_line_id: cl.id || null,
        car_plate: cl.car_plate || '',
        designation: cl.car_plate || '',
        amount_original: Number(cl.amount_ht || 0) / Math.max(1, contractLines.length),
        currency: 'TND',
        amount_ht: Number(entry.amount_ht) / Math.max(1, contractLines.length),
        vat_amount: Number(entry.vat_amount) / Math.max(1, contractLines.length),
        daily_tax_amount: Number(entry.daily_tax_amount) / Math.max(1, contractLines.length),
        days: daysBetween(entry.period_start, entry.period_end),
        period_start: entry.period_start,
        period_end: entry.period_end,
        line_ttc: Number(entry.line_ttc) / Math.max(1, contractLines.length),
      }, req), { headers: { Prefer: 'return=minimal' } });
    }

    // Mettre à jour l'entrée d'échéancier
    await global.db.patch(
      `/invoice_schedule?id=eq.${entry.id}`,
      stampUpdate({ status: 'brouillon', invoice_id: invoiceId }, req),
      { headers: { Prefer: 'return=minimal' } }
    );

    res.status(201).json({ success: true, data: { invoiceId, scheduleId: entry.id } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── Helpers internes ──────────────────────────────────────────────────────────

function daysBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

function formatPeriodLabel(start: string, end: string): string {
  if (!start) return '';
  const d = new Date(start);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export { nextInvoiceNumber };
export default router;
