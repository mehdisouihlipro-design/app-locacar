import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';
import { nextSequenceNumber, releaseSequenceOnDelete } from '../utils/number-sequence';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/contracts?select=*&order=created_at.desc');
    res.json({ success: true, data: result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/contracts?id=eq.${req.params.id}&select=*`);
    if (!result.data || result.data.length === 0) return res.status(404).json({ success: false, message: 'Contrat introuvable.' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.body.id || uuidv4();
    // Générer un numéro de contrat séquentiel si pas déjà fourni
    let contractNumber = req.body.contract_number || null;
    if (!contractNumber) {
      try { contractNumber = await nextSequenceNumber('contracts'); } catch (seqErr) { console.error('[contracts] nextSequenceNumber failed:', seqErr); }
    }
    await global.db.post('/contracts', stampCreate({ ...req.body, id, contract_number: contractNumber, status: req.body.status || 'active' }, req), { headers: { Prefer: 'resolution=merge-duplicates' } });
    res.status(201).json({ success: true, data: { id, contract_number: contractNumber, ...req.body } });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/contracts?id=eq.${req.params.id}&select=id`);
    if (!check.data || check.data.length === 0) return res.status(404).json({ success: false, message: 'Contrat introuvable.' });
    const result = await global.db.patch(`/contracts?id=eq.${req.params.id}`, stampUpdate(req.body, req), {
      headers: { Prefer: 'return=representation' },
    });
    res.json({ success: true, data: Array.isArray(result.data) ? result.data[0] : result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/contracts?id=eq.${req.params.id}&select=id`);
    if (!check.data?.[0]) return res.status(404).json({ success: false, message: 'Contrat introuvable.' });

    // Refuser si des factures non-brouillon existent
    const invRes = await global.db.get(`/invoices?contract_id=eq.${req.params.id}&status=neq.brouillon&select=id&limit=1`);
    if ((invRes.data || []).length > 0) {
      return res.status(422).json({ success: false, message: 'Impossible de supprimer ce contrat : il possède des factures confirmées. Annulez-les d\'abord.' });
    }

    // Refuser si des paiements existent
    const payRes = await global.db.get(`/payments?contract_id=eq.${req.params.id}&select=id&limit=1`);
    if ((payRes.data || []).length > 0) {
      return res.status(422).json({ success: false, message: 'Impossible de supprimer ce contrat : des paiements y sont associés.' });
    }

    await global.db.delete(`/contracts?id=eq.${req.params.id}`);
    releaseSequenceOnDelete('contracts').catch(() => {});
    res.json({ success: true, message: 'Contrat supprimé.' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// Phase 5 (BR20) : confirmation d'un contrat brouillon → active
// BR19 pour chaque ligne, puis BR25, puis PATCH statuts
router.post('/:id/confirm', async (req: AuthRequest, res: Response) => {
  try {
    const contractRes = await global.db.get(`/contracts?id=eq.${req.params.id}&select=*`);
    const contract = contractRes.data?.[0];
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable.' });
    if (contract.status !== 'brouillon') {
      return res.status(422).json({ success: false, message: `Ce contrat est au statut "${contract.status}", pas "brouillon".` });
    }

    const linesRes = await global.db.get(`/contract_lines?contract_id=eq.${req.params.id}&status=eq.brouillon&select=*&order=created_at.asc`);
    const lines: any[] = linesRes.data || [];
    if (lines.length === 0) {
      return res.status(422).json({ success: false, message: 'Ce contrat n\'a aucune ligne brouillon à confirmer.' });
    }

    // BR19 : vérifier les chevauchements pour toutes les lignes avant d'écrire quoi que ce soit
    for (const line of lines) {
      if (!line.car_id || !line.period_start || !line.period_end) continue;
      const linesCheck = await global.db.get(
        `/contract_lines?car_id=eq.${line.car_id}&status=eq.active&select=id,contract_id,car_plate,period_start,period_end`
      );
      const overlap = (linesCheck.data || []).find((l: any) =>
        line.period_start <= l.period_end && line.period_end >= l.period_start
      );
      if (overlap) {
        return res.status(409).json({
          success: false, error: 'vehicle_overlap',
          message: `⚠ Le véhicule ${overlap.car_plate} est déjà engagé du ${overlap.period_start} au ${overlap.period_end} sur le contrat ${overlap.contract_id}. La ligne ${line.id} est en conflit.`,
          conflictLineId: line.id,
        });
      }
      const rsvCheck = await global.db.get(
        `/reservations?car_id=eq.${line.car_id}&select=id,car_plate,start_date,end_date,status,contract_line_id`
      );
      const rsvOverlap = (rsvCheck.data || []).find((r: any) =>
        r.status !== 'annulee' && r.status !== 'terminee' &&
        r.contract_line_id !== line.id &&
        line.period_start <= r.end_date && line.period_end >= r.start_date
      );
      if (rsvOverlap) {
        return res.status(409).json({
          success: false, error: 'vehicle_overlap',
          message: `⚠ Le véhicule ${rsvOverlap.car_plate} est déjà réservé du ${rsvOverlap.start_date} au ${rsvOverlap.end_date} (réservation ${rsvOverlap.id}).`,
          conflictLineId: line.id,
        });
      }
    }

    // Tous les contrôles passés → passer toutes les lignes à active
    for (const line of lines) {
      await global.db.patch(
        `/contract_lines?id=eq.${line.id}`,
        stampUpdate({ status: 'active' }, req),
        { headers: { Prefer: 'return=minimal' } }
      );
    }

    // Passer le contrat à active
    await global.db.patch(
      `/contracts?id=eq.${req.params.id}`,
      stampUpdate({ status: 'active' }, req),
      { headers: { Prefer: 'return=minimal' } }
    );

    // BR25 : créer/lier réservations pour chaque ligne
    const reservations: any[] = [];
    for (const line of lines) {
      if (!line.car_id || !line.period_start || !line.period_end) continue;
      try {
        const contractInfoRes = await global.db.get(`/contracts?id=eq.${req.params.id}&select=customer_id,customer_name`);
        const contractInfo = contractInfoRes.data?.[0] || {};
        const rsvRes = await global.db.get(`/reservations?car_id=eq.${line.car_id}&select=id,start_date,end_date,status,contract_line_id`);
        const active = (rsvRes.data || []).filter((r: any) => r.status !== 'annulee' && r.status !== 'terminee');
        const exact   = active.find((r: any) => r.start_date === line.period_start && r.end_date === line.period_end);
        const overlap = !exact && active.find((r: any) => line.period_start <= r.end_date && line.period_end >= r.start_date);
        let reservationId: string;
        if (exact) {
          reservationId = exact.id;
          await global.db.patch(`/reservations?id=eq.${exact.id}`, stampUpdate({ contract_line_id: line.id }, req), { headers: { Prefer: 'return=minimal' } });
        } else if (overlap) {
          reservationId = overlap.id;
          await global.db.patch(`/reservations?id=eq.${overlap.id}`, stampUpdate({ start_date: line.period_start, end_date: line.period_end, contract_line_id: line.id }, req), { headers: { Prefer: 'return=minimal' } });
        } else {
          const rsvId = `RSV-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
          await global.db.post('/reservations', stampUpdate({
            id: rsvId, car_id: line.car_id, car_plate: line.car_plate || '',
            customer_id: contractInfo.customer_id || null, customer_name: contractInfo.customer_name || '',
            start_date: line.period_start, end_date: line.period_end,
            start_time: '09:00', end_time: '18:00', status: 'confirmee', contract_line_id: line.id,
          }, req), { headers: { Prefer: 'return=minimal' } });
          reservationId = rsvId;
        }
        await global.db.patch(`/contract_lines?id=eq.${line.id}`, stampUpdate({ reservation_id: reservationId }, req), { headers: { Prefer: 'return=minimal' } });
        const finalRsv = await global.db.get(`/reservations?id=eq.${reservationId}&select=*`);
        if (finalRsv.data?.[0]) reservations.push(finalRsv.data[0]);
      } catch (e: any) { console.warn('[BR25/confirm]', e?.message); }
    }

    res.json({ success: true, linesConfirmed: lines.length, reservations });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// BR27 : générer l'échéancier mensuel d'un contrat long terme
// POST /contracts/:id/generate-schedule
// Body optionnel : { override: true } pour regénérer en supprimant les entrées planifiées existantes
router.post('/:id/generate-schedule', async (req: AuthRequest, res: Response) => {
  try {
    const contractRes = await global.db.get(`/contracts?id=eq.${req.params.id}&select=*`);
    const contract = contractRes.data?.[0];
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable.' });
    if (contract.type !== 'long')
      return res.status(422).json({ success: false, message: 'L\'échéancier ne s\'applique qu\'aux contrats long terme.' });

    const linesRes = await global.db.get(`/contract_lines?contract_id=eq.${req.params.id}&status=eq.active&select=*&order=period_start.asc`);
    const lines: any[] = linesRes.data || [];
    if (lines.length === 0)
      return res.status(422).json({ success: false, message: 'Ce contrat n\'a aucune ligne active. Ajoutez des lignes avant de générer l\'échéancier.' });

    // Calcul de la plage globale du contrat
    const globalStart = lines.reduce((min, l) => (!min || l.period_start < min ? l.period_start : min), '');
    const globalEnd   = lines.reduce((max, l) => (!max || l.period_end   > max ? l.period_end   : max), '');
    if (!globalStart || !globalEnd)
      return res.status(422).json({ success: false, message: 'Les lignes du contrat n\'ont pas de dates de période valides.' });

    // Supprimer les entrées planifiées existantes si override
    if (req.body.override) {
      const existing = await global.db.get(`/invoice_schedule?contract_id=eq.${req.params.id}&status=eq.planifie&select=id`);
      for (const e of existing.data || []) {
        await global.db.delete(`/invoice_schedule?id=eq.${e.id}`);
      }
    } else {
      // Vérifier qu'il n'y a pas déjà un échéancier
      const existing = await global.db.get(`/invoice_schedule?contract_id=eq.${req.params.id}&select=id`);
      if (existing.data && existing.data.length > 0)
        return res.status(409).json({ success: false, message: 'Un échéancier existe déjà pour ce contrat. Utilisez override:true pour régénérer.' });
    }

    // Lire TVA et taxe journalière depuis les paramètres
    let vatRate = 0.19;
    let dailyTaxTnd = 2;
    try {
      const settingsRes = await global.db.get('/settings?id=eq.1&select=vat_rate,daily_tax_tnd');
      const s = (settingsRes.data || [])[0];
      if (s) {
        const vr = Number(s.vat_rate);
        if (!isNaN(vr) && vr >= 0) vatRate = vr / 100;
        const dt = Number(s.daily_tax_tnd);
        if (!isNaN(dt) && dt >= 0) dailyTaxTnd = dt;
      }
    } catch (_) { /* fallback */ }

    const rateType: string = contract.rate_type || 'daily';

    // Pré-calcul des taux par ligne selon le mode de négociation
    const linesWithRate = lines.map((l: any) => {
      if (rateType === 'monthly') {
        // Mensuel : tarif mensuel stocké directement dans l.rate
        return { ...l, monthlyRate: Number(l.rate || 0) };
      } else {
        // Journalier : taux journalier = amount_ht / durée en jours
        const lineDays = daysOverlap(l.period_start, l.period_end, l.period_start, l.period_end);
        return { ...l, dailyRate: Number(l.amount_ht || 0) / Math.max(lineDays, 1) };
      }
    });

    // Générer une entrée par mois entre globalStart et globalEnd
    const entries: any[] = [];
    let current = new Date(globalStart);
    const end    = new Date(globalEnd);

    while (current <= end) {
      const periodStart = toIso(current);

      // Fin de la période = même jour du mois suivant - 1
      const nextMonth = new Date(current);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      // Ne pas dépasser globalEnd
      const periodEnd = toIso(nextMonth > end ? end : new Date(nextMonth.getTime() - 86400000));

      let monthlyAmountHt: number;
      if (rateType === 'monthly') {
        // Mensuel : plein tarif si mois complet, prorata si mois partiel (dernier mois)
        const pDays = daysOverlap(periodStart, periodEnd, periodStart, periodEnd);
        const curD = new Date(`${periodStart}T00:00:00`);
        const nxtD = new Date(curD); nxtD.setMonth(nxtD.getMonth() + 1);
        const fullPD = Math.round((nxtD.getTime() - curD.getTime()) / 86400000);
        const prorata = Math.min(1, pDays / fullPD);
        monthlyAmountHt = Math.round(
          linesWithRate.reduce((sum: number, l: any) => {
            const overlap = daysOverlap(periodStart, periodEnd, l.period_start, l.period_end);
            return sum + (overlap > 0 ? (l as any).monthlyRate * prorata : 0);
          }, 0) * 1000
        ) / 1000;
      } else {
        // Journalier : taux journalier × jours chevauchant ce mois
        monthlyAmountHt = Math.round(
          linesWithRate.reduce((sum: number, l: any) => {
            const overlap = daysOverlap(periodStart, periodEnd, l.period_start, l.period_end);
            return sum + (l as any).dailyRate * overlap;
          }, 0) * 1000
        ) / 1000;
      }

      const vatAmount = Math.round(monthlyAmountHt * vatRate * 1000) / 1000;

      // Taxe journalière : dailyTaxTnd × jours de la période × nombre de lignes chevauchant ce mois
      const periodDays = daysOverlap(periodStart, periodEnd, globalStart, globalEnd);
      const overlappingLinesCount = linesWithRate.filter(
        (l: any) => daysOverlap(periodStart, periodEnd, l.period_start, l.period_end) > 0
      ).length;
      const dailyTaxAmount = Math.round(dailyTaxTnd * periodDays * overlappingLinesCount * 1000) / 1000;

      const lineTtc = Math.round((monthlyAmountHt + vatAmount + dailyTaxAmount) * 1000) / 1000;

      const carPlates = lines.map((l: any) => l.car_plate || '').filter(Boolean).join(', ');
      const label = `Loyer ${formatMonthLabel(periodStart)}${carPlates ? ' — ' + carPlates : ''}`;

      const id = `SCH-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const entry = stampCreate({
        id,
        contract_id:      req.params.id,
        scheduled_date:   periodStart,
        period_start:     periodStart,
        period_end:       periodEnd,
        amount_ht:        monthlyAmountHt,
        vat_amount:       vatAmount,
        daily_tax_amount: dailyTaxAmount,
        line_ttc:         lineTtc,
        label,
        status:           'planifie',
        invoice_id:       null,
      }, req);
      await global.db.post('/invoice_schedule', entry, { headers: { Prefer: 'return=minimal' } });
      entries.push(entry);

      // Avancer d'un mois
      current = nextMonth > end ? new Date(end.getTime() + 86400000) : nextMonth;
    }

    res.status(201).json({ success: true, count: entries.length, data: entries });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// Montant HT pour un tarif mensuel sur une période : mois complets + prorata dernier mois
function calcMonthlyAmountFn(monthlyRate: number, periodStart: string, periodEnd: string): number {
  if (!periodStart || !periodEnd || periodEnd < periodStart) return 0;
  const s = new Date(`${periodStart}T00:00:00`);
  const e = new Date(`${periodEnd}T00:00:00`);
  let fullMonths = 0;
  let cur = new Date(s);
  while (true) {
    const nxt = new Date(cur); nxt.setMonth(nxt.getMonth() + 1);
    if (nxt > e) break;
    fullMonths++; cur = nxt;
  }
  const nxt = new Date(cur); nxt.setMonth(nxt.getMonth() + 1);
  const remainingMs = e.getTime() - cur.getTime() + 86400000;
  const fullPeriodMs = nxt.getTime() - cur.getTime();
  return Math.round(monthlyRate * (fullMonths + remainingMs / fullPeriodMs) * 100) / 100;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Nombre de jours inclusifs dans l'intersection de deux périodes ISO
function daysOverlap(startA: string, endA: string, startB: string, endB: string): number {
  const s = Math.max(new Date(`${startA}T00:00:00`).getTime(), new Date(`${startB}T00:00:00`).getTime());
  const e = Math.min(new Date(`${endA}T00:00:00`).getTime(),   new Date(`${endB}T00:00:00`).getTime());
  return s > e ? 0 : Math.round((e - s) / 86400000) + 1;
}

// Nombre de périodes de facturation entre deux dates ISO (même logique que la boucle de génération).
// end.day >= start.day → une période complète de plus dans le dernier mois.
function countCalendarMonths(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const yearDiff  = e.getFullYear() - s.getFullYear();
  const monthDiff = e.getMonth()    - s.getMonth();
  const dayDiff   = e.getDate()     - s.getDate();
  return Math.max(1, yearDiff * 12 + monthDiff + (dayDiff >= 0 ? 1 : 0));
}

function formatMonthLabel(isoDate: string): string {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

// Phase 2A : lignes d'un contrat (BR20, modele entete + lignes)
router.get('/:id/lines', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/contract_lines?contract_id=eq.${req.params.id}&select=*&order=created_at.asc`);
    res.json({ success: true, data: result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// Phase 2A (BR20bis) : creation atomique d'un contrat + ses lignes via RPC.
// Body attendu : { contract: {...}, lines: [{...}, ...] }
router.post('/with-lines', async (req: AuthRequest, res: Response) => {
  try {
    const lines = (req.body.lines || []).map((line: any) => stampCreate({ ...line, id: line.id || uuidv4(), status: line.status || 'active' }, req));
    const firstLine = lines[0] || {};

    // contracts.car_id (et plusieurs autres colonnes) restent NOT NULL (modele
    // entete v1, non modifie en Phase 2A). Tant que le frontend ne gere pas
    // encore de contrats multi-lignes (Phase 2B), on reprend les valeurs de
    // la premiere ligne pour l'entete afin que les ecrans/KPI existants, qui
    // lisent contracts.car_id/car_plate/rate/total_amount_tnd, continuent de
    // fonctionner pour un contrat cree via /with-lines.
    const totalAmountTnd = lines.reduce((sum: number, l: any) => sum + (Number(l.amount_ht) || 0), 0);
    const contract = stampCreate({
      car_id: firstLine.car_id,
      car_plate: firstLine.car_plate,
      days: firstLine.days,
      months: firstLine.months,
      rate: firstLine.rate,
      rate_currency: firstLine.rate_currency || 'TND',
      quotient: firstLine.quotient,
      quotient_currency: firstLine.quotient_currency || 'TND',
      quotient_tnd: firstLine.quotient_tnd,
      total_amount_original: totalAmountTnd,
      total_amount_tnd: totalAmountTnd,
      ...req.body.contract,
      id: req.body.contract?.id || uuidv4(),
      status: req.body.contract?.status || 'active',
    }, req);

    const result = await global.db.post('/rpc/create_contract_with_lines', { p_contract: contract, p_lines: lines });
    res.status(201).json({ success: true, data: result.data });
  } catch (err: any) {
    if (err?.response?.data?.code === '23P01') {
      return res.status(409).json({ success: false, error: 'vehicle_overlap', message: 'Un véhicule de ce contrat est déjà engagé sur la période demandée. Choisissez une autre période ou un autre véhicule.' });
    }
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Mise à jour du type de négociation + recalcul des montants de toutes les lignes
router.put('/:id/update-rates', async (req: AuthRequest, res: Response) => {
  try {
    const contractRes = await global.db.get(`/contracts?id=eq.${req.params.id}&select=*`);
    const contract = contractRes.data?.[0];
    if (!contract) return res.status(404).json({ success: false, message: 'Contrat introuvable.' });

    const { rate_type, rate } = req.body;
    if (!rate_type || !['daily', 'monthly'].includes(rate_type))
      return res.status(400).json({ success: false, message: 'rate_type invalide (daily ou monthly).' });
    if (!rate || Number(rate) <= 0)
      return res.status(400).json({ success: false, message: 'Tarif requis et doit être > 0.' });

    let vatRate = 0.19;
    try {
      const s = (await global.db.get('/settings?id=eq.1&select=vat_rate')).data?.[0];
      const vr = Number(s?.vat_rate);
      if (!isNaN(vr) && vr >= 0) vatRate = vr / 100;
    } catch (_) {}

    await global.db.patch(`/contracts?id=eq.${req.params.id}`, stampUpdate({ rate_type }, req), { headers: { Prefer: 'return=minimal' } });

    const linesRes = await global.db.get(`/contract_lines?contract_id=eq.${req.params.id}&status=neq.annule&select=*`);
    const lines: any[] = linesRes.data || [];
    const updatedLines: any[] = [];

    for (const l of lines) {
      let amountHt: number;
      if (rate_type === 'monthly') {
        amountHt = calcMonthlyAmountFn(Number(rate), l.period_start, l.period_end);
      } else {
        const days = daysOverlap(l.period_start, l.period_end, l.period_start, l.period_end);
        amountHt = Math.round(Number(rate) * days * 100) / 100;
      }
      const vatAmount  = Math.round(amountHt * vatRate * 1000) / 1000;
      const amountTtc  = Math.round((amountHt + vatAmount) * 1000) / 1000;
      await global.db.patch(`/contract_lines?id=eq.${l.id}`, stampUpdate({
        rate: Number(rate), rate_currency: 'TND',
        amount_ht: amountHt, vat_amount: vatAmount, amount_ttc: amountTtc, amount_tnd: amountTtc,
      }, req), { headers: { Prefer: 'return=minimal' } });
      updatedLines.push({ id: l.id, amount_ht: amountHt, vat_amount: vatAmount, amount_ttc: amountTtc });
    }

    res.json({ success: true, updatedLines });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

export default router;
