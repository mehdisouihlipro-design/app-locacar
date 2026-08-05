import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';
import { nextSequenceNumber } from '../utils/number-sequence';

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

    // Lire taxe journalière et timbre depuis les paramètres
    let dailyTaxTnd = 2;
    let stampDutyTnd = 1;
    try {
      const settingsRes = await global.db.get('/settings?id=eq.1&select=daily_tax_tnd,stamp_duty_tnd');
      const s = (settingsRes.data || [])[0];
      if (s) {
        const dt = Number(s.daily_tax_tnd);
        if (!isNaN(dt) && dt >= 0) dailyTaxTnd = dt;
        const sd = Number(s.stamp_duty_tnd);
        if (!isNaN(sd) && sd >= 0) stampDutyTnd = sd;
      }
    } catch (_) { /* fallback */ }

    const periodDays = daysBetween(entry.period_start, entry.period_end);
    const nbLines = Math.max(contractLines.length, 1);

    // daily_tax_amount = taxe/j × jours_période × nb_véhicules (une ligne = un véhicule)
    const dailyTaxAmount = Math.round(dailyTaxTnd * periodDays * contractLines.length * 1000) / 1000;
    const stampDutyAmount = stampDutyTnd;
    const amountHt = Number(entry.amount_ht || 0);
    const vatAmount = Number(entry.vat_amount || 0);
    const amountTtc = Math.round((amountHt + vatAmount + dailyTaxAmount + stampDutyAmount) * 100) / 100;

    const invoiceId = `FAC-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Attribuer le numéro de facture via la souche configurée
    let invoiceNumber: string | null = null;
    try { invoiceNumber = await nextSequenceNumber('invoices'); } catch (e) { console.error('[schedule/generate] nextSequenceNumber invoices:', e); }

    // Créer la facture brouillon avec numéro de souche
    const invoiceBody = stampCreate({
      id: invoiceId,
      contract_id: entry.contract_id,
      customer_name: contract.customer_name || '',
      label: entry.label || `Loyer ${formatPeriodLabel(entry.period_start, entry.period_end)}`,
      amount_ht: amountHt,
      vat_amount: vatAmount,
      daily_tax_amount: dailyTaxAmount,
      stamp_duty_amount: stampDutyAmount,
      amount_tnd: amountTtc,
      amount_original: amountHt,
      currency: 'TND',
      period_start: entry.period_start,
      period_end: entry.period_end,
      rental_days: periodDays,
      paid_amount_tnd: 0,
      due_amount_tnd: amountTtc,
      due_date: entry.scheduled_date,
      status: 'brouillon',
      invoice_number: invoiceNumber,
      schedule_id: entry.id,
      lines: [],
    }, req);
    await global.db.post('/invoices', invoiceBody, { headers: { Prefer: 'resolution=merge-duplicates' } });

    // Désignation par ligne : designation de la ligne de contrat > marque+modèle du véhicule
    const carIds = [...new Set(contractLines.map(cl => cl.car_id).filter(Boolean))];
    const carsById: Record<string, { brand?: string; model?: string }> = {};
    if (carIds.length) {
      const carsRes = await global.db.get(`/cars?id=in.(${carIds.join(',')})&select=id,brand,model`);
      for (const c of (carsRes.data || [])) carsById[c.id] = c;
    }
    const lineDesignation = (cl: any): string => {
      if (cl.designation && String(cl.designation).trim()) return String(cl.designation).trim();
      const car = cl.car_id ? carsById[cl.car_id] : null;
      return car ? `${car.brand || ''} ${car.model || ''}`.trim() : '';
    };

    // Créer les lignes de facture (une par contract_line)
    // Chaque ligne reçoit : sa part du HT/TVA + dailyTaxTnd × jours (taxe par véhicule)
    const lineDailyTax = Math.round(dailyTaxTnd * periodDays * 1000) / 1000;
    for (const cl of contractLines) {
      const lineId = `ILN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const lineAmountHt  = Math.round(amountHt / nbLines * 1000) / 1000;
      const lineVatAmount = Math.round(vatAmount / nbLines * 1000) / 1000;
      const lineLineTtc   = Math.round((lineAmountHt + lineVatAmount + lineDailyTax) * 1000) / 1000;
      await global.db.post('/invoice_lines', stampCreate({
        id: lineId,
        invoice_id: invoiceId,
        contract_id: entry.contract_id,
        contract_line_id: cl.id || null,
        car_plate: cl.car_plate || '',
        designation: lineDesignation(cl),
        amount_original: Number(cl.amount_ht || 0) / nbLines,
        currency: 'TND',
        amount_ht: lineAmountHt,
        vat_amount: lineVatAmount,
        daily_tax_amount: lineDailyTax,
        days: periodDays,
        period_start: entry.period_start,
        period_end: entry.period_end,
        line_ttc: lineLineTtc,
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
