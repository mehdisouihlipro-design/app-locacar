// src/backend/routes/invoices.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import { stampCreate, stampUpdate } from '../utils/audit';
import { nextSequenceNumber, releaseSequenceOnDelete } from '../utils/number-sequence';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/invoices?select=*&order=created_at.desc');
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/invoices?id=eq.${req.params.id}&select=*`);
    if (!result.data || result.data.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { lines = [], ...invoiceBody } = req.body;

    if (lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Une facture doit avoir au moins une ligne.' });
    }

    const id = invoiceBody.id || uuidv4();
    const body = stampCreate({ ...invoiceBody, id, status: invoiceBody.status || 'en_attente', lines: [] }, req);
    await global.db.post('/invoices', body, { headers: { Prefer: 'resolution=merge-duplicates' } });

    // Insert each line into invoice_lines table (BR21)
    for (const line of lines) {
      const lineId = line.id || `ILN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await global.db.post('/invoice_lines', stampCreate({
        id: lineId,
        invoice_id: id,
        contract_id:      line.contractId      || line.contract_id      || null,
        contract_line_id: line.contractLineId  || line.contract_line_id || null,
        car_plate:        line.carPlate        || line.car_plate        || '',
        designation:      line.designation     || '',
        amount_original:  line.amountOriginal  || line.amount_original  || 0,
        currency:         line.currency        || 'TND',
        amount_ht:        line.amountHt        || line.amount_ht        || 0,
        vat_amount:       line.vatAmount       || line.vat_amount       || 0,
        daily_tax_amount: line.dailyTaxAmount  || line.daily_tax_amount || 0,
        days:             line.days            || 0,
        period_start:     line.periodStart     || line.period_start     || null,
        period_end:       line.periodEnd       || line.period_end       || null,
        line_ttc:         line.lineTtc         || line.line_ttc         || 0,
      }, req), { headers: { Prefer: 'return=minimal' } });
    }

    res.status(201).json({ success: true, data: { id, ...body } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.patch(`/invoices?id=eq.${req.params.id}`, stampUpdate(req.body, req), {
      headers: { Prefer: 'return=representation' },
    });
    if (!result.data || result.data.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/invoices?id=eq.${req.params.id}&select=id,status,invoice_number`);
    const inv = check.data?.[0];
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (['payee', 'partiel'].includes(inv.status))
      return res.status(422).json({ success: false, message: 'Impossible de supprimer une facture partiellement ou totalement payée.' });
    // Vérifier qu'il n'y a pas de paiements confirmés liés
    const payCheck = await global.db.get(`/payments?invoice_id=eq.${req.params.id}&select=id&limit=1`);
    if ((payCheck.data || []).length > 0)
      return res.status(422).json({ success: false, message: 'Impossible de supprimer cette facture : des paiements y sont associés.' });
    // Remettre l'entrée d'échéancier liée en statut planifié
    const schedCheck = await global.db.get(`/invoice_schedule?invoice_id=eq.${req.params.id}&select=id`);
    for (const s of schedCheck.data || []) {
      await global.db.patch(`/invoice_schedule?id=eq.${s.id}`, { status: 'planifie', invoice_id: null }, { headers: { Prefer: 'return=minimal' } });
    }
    await global.db.delete(`/invoices?id=eq.${req.params.id}`);
    // Si la facture supprimée avait un numéro de souche, libérer ce numéro pour qu'il
    // soit réutilisé par la prochaine facture confirmée (ex. suppression d'une facture
    // en double générée par erreur).
    if (inv.invoice_number) releaseSequenceOnDelete('invoices').catch(() => {});
    res.json({ success: true, message: 'Invoice deleted', data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ── Confirmer un brouillon → en_attente + attribution du numéro séquentiel ───
// POST /invoices/:id/confirm
router.post('/:id/confirm', async (req: AuthRequest, res: Response) => {
  let claimed = false;
  try {
    // Verrou atomique : ne bascule "brouillon" -> "en_attente" que si le statut est encore
    // "brouillon" au moment de l'UPDATE SQL. Empêche un double-clic (ou deux requêtes
    // concurrentes) de confirmer deux fois la même facture et de consommer deux numéros.
    const claimRes = await global.db.patch(
      `/invoices?id=eq.${req.params.id}&status=eq.brouillon`,
      stampUpdate({ status: 'en_attente' }, req),
      { headers: { Prefer: 'return=representation' } }
    );
    const invoice = claimRes.data?.[0];
    if (!invoice) {
      const check = await global.db.get(`/invoices?id=eq.${req.params.id}&select=id,status`);
      const existing = check.data?.[0];
      if (!existing) return res.status(404).json({ success: false, message: 'Facture introuvable.' });
      return res.status(422).json({ success: false, message: `Cette facture est au statut "${existing.status}", pas "brouillon".` });
    }
    claimed = true;

    // Si la facture a déjà un numéro (généré à la création via l'échéancier), le conserver
    // sans consommer un nouveau numéro de souche.
    let invoiceNumber: string | null = invoice.invoice_number || null;
    if (!invoiceNumber) {
      invoiceNumber = await nextSequenceNumber('invoices');
      await global.db.patch(
        `/invoices?id=eq.${req.params.id}`,
        stampUpdate({ invoice_number: invoiceNumber }, req),
        { headers: { Prefer: 'return=minimal' } }
      );
      invoice.invoice_number = invoiceNumber;
    }

    // Si la facture vient d'un échéancier, mettre à jour son statut
    if (invoice.schedule_id) {
      await global.db.patch(
        `/invoice_schedule?id=eq.${invoice.schedule_id}`,
        stampUpdate({ status: 'confirme' }, req),
        { headers: { Prefer: 'return=minimal' } }
      );
    }

    res.json({ success: true, data: invoice, invoiceNumber });
  } catch (err) {
    if (claimed) {
      try {
        await global.db.patch(
          `/invoices?id=eq.${req.params.id}&status=eq.en_attente`,
          stampUpdate({ status: 'brouillon' }, req),
          { headers: { Prefer: 'return=minimal' } }
        );
      } catch (_) { /* best-effort */ }
    }
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
