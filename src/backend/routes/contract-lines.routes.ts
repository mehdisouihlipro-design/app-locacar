// src/backend/routes/contract-lines.routes.ts
import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

const router = Router();

// Ajoute des heures décimales à une heure "HH:MM" et retourne "HH:MM" (plafonné à 23:59).
function addHoursToTime(time: string, hours: number): string {
  if (!hours || !time) return time;
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = Math.min(h * 60 + m + Math.round(hours * 60), 23 * 60 + 59);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

// Retourne true si les deux périodes (avec heures et buffer optionnels) se chevauchent.
// Cas limite : si fin A = début B (même jour), conflit ssi heure retour A + buffer > heure pickup B.
// Si l'une des heures est absente → conservateur (conflit).
function periodsConflict(
  s1: string, e1: string, pickup1: string | null, return1: string | null,
  s2: string, e2: string, pickup2: string | null, return2: string | null,
  bufferHours: number = 0
): boolean {
  if (e1 < s2 || e2 < s1) return false;
  // Existing ends on new's start day → no conflict if existing released before new pickup
  if (e2 === s1 && return2 && pickup1) { if (addHoursToTime(return2, bufferHours) <= pickup1) return false; }
  // New ends on existing's start day → no conflict if new released before existing pickup
  if (e1 === s2 && return1 && pickup2) { if (addHoursToTime(return1, bufferHours) <= pickup2) return false; }
  return true;
}

// BR19 niveau 2 : vérifie chevauchement sur les lignes actives et les réservations.
// Applique le buffer de paramétrage pour les cas intra-journaliers (court terme).
async function findVehicleOverlap(
  carId: string,
  periodStart: string,
  periodEnd: string,
  pickupTime: string | null = null,
  returnTime: string | null = null,
  excludeLineId?: string
): Promise<{ message: string; conflict: Record<string, unknown> } | null> {
  // Lire le buffer depuis les paramètres
  let bufferHours = 0;
  try {
    const settingsRes = await global.db.get('/settings?id=eq.1&select=reservation_buffer_hours');
    bufferHours = Number((settingsRes.data || [])[0]?.reservation_buffer_hours ?? 0);
  } catch (_) { /* buffer = 0 si inaccessible */ }

  const linesResult = await global.db.get(
    `/contract_lines?car_id=eq.${carId}&status=eq.active&select=id,contract_id,car_plate,period_start,period_end,pickup_time,return_time`
  );
  const overlappingLine = (linesResult.data || []).find((line: any) => {
    if (excludeLineId && line.id === excludeLineId) return false;
    return periodsConflict(periodStart, periodEnd, pickupTime, returnTime, line.period_start, line.period_end, line.pickup_time, line.return_time, bufferHours);
  });

  if (overlappingLine) {
    const siblingLines = await global.db.get(
      `/contract_lines?contract_id=eq.${overlappingLine.contract_id}&select=id&order=created_at.asc`
    );
    const lineNumber = (siblingLines.data || []).findIndex((l: any) => l.id === overlappingLine.id) + 1;
    return {
      message: `⚠ Le véhicule ${overlappingLine.car_plate} est déjà engagé du ${overlappingLine.period_start} au ${overlappingLine.period_end} sur le contrat ${overlappingLine.contract_id} (ligne ${lineNumber || 1}). Choisissez une autre période ou un autre véhicule.`,
      conflict: {
        carId, contractId: overlappingLine.contract_id, lineId: overlappingLine.id,
        periodStart: overlappingLine.period_start, periodEnd: overlappingLine.period_end,
      },
    };
  }

  const reservationsResult = await global.db.get(
    `/reservations?car_id=eq.${carId}&select=id,car_plate,start_date,end_date,status,contract_line_id,start_time,end_time`
  );
  const overlappingReservation = (reservationsResult.data || []).find((rsv: any) => {
    if (rsv.status === 'annulee' || rsv.status === 'terminee') return false;
    if (excludeLineId && rsv.contract_line_id === excludeLineId) return false;
    return periodsConflict(periodStart, periodEnd, pickupTime, returnTime, rsv.start_date, rsv.end_date, rsv.start_time, rsv.end_time, bufferHours);
  });

  if (overlappingReservation) {
    return {
      message: `⚠ Le véhicule ${overlappingReservation.car_plate} est déjà engagé du ${overlappingReservation.start_date} au ${overlappingReservation.end_date} par la réservation ${overlappingReservation.id}. Choisissez une autre période ou un autre véhicule.`,
      conflict: {
        carId, reservationId: overlappingReservation.id,
        periodStart: overlappingReservation.start_date, periodEnd: overlappingReservation.end_date,
      },
    };
  }

  return null;
}

function isExclusionViolation(err: any): boolean {
  return err?.response?.data?.code === '23P01';
}

// BR25 : après insertion d'une ligne active, recherche ou crée une réservation liée.
// Retourne la réservation retenue/créée, ou null en cas d'erreur (non bloquant).
async function applyBR25(
  lineId: string,
  carId: string,
  carPlate: string,
  periodStart: string,
  periodEnd: string,
  contractId: string,
  pickupTime: string | null,
  returnTime: string | null,
  req: AuthRequest
): Promise<Record<string, unknown> | null> {
  try {
    // Infos client depuis le contrat
    const contractRes = await global.db.get(`/contracts?id=eq.${contractId}&select=customer_id,customer_name`);
    const contract = contractRes.data?.[0] || {};
    const customerId = contract.customer_id || null;
    const customerName = contract.customer_name || '';

    // Réservations existantes pour ce véhicule (non annulées ni terminées)
    const rsvRes = await global.db.get(
      `/reservations?car_id=eq.${carId}&select=id,start_date,end_date,status,contract_line_id`
    );
    const active = (rsvRes.data || []).filter((r: any) =>
      r.status !== 'annulee' && r.status !== 'terminee'
    );

    const exact   = active.find((r: any) => r.start_date === periodStart && r.end_date === periodEnd);
    const overlap = !exact && active.find((r: any) => periodStart <= r.end_date && periodEnd >= r.start_date);

    let reservationId: string;

    if (exact) {
      // Lier la réservation existante (correspondance exacte de période)
      reservationId = exact.id;
      await global.db.patch(
        `/reservations?id=eq.${exact.id}`,
        stampUpdate({ contract_line_id: lineId }, req),
        { headers: { Prefer: 'return=minimal' } }
      );
    } else if (overlap) {
      // Corriger les dates de la réservation chevauchante et lier
      reservationId = overlap.id;
      await global.db.patch(
        `/reservations?id=eq.${overlap.id}`,
        stampUpdate({ start_date: periodStart, end_date: periodEnd, contract_line_id: lineId }, req),
        { headers: { Prefer: 'return=minimal' } }
      );
    } else {
      // Créer une nouvelle réservation confirmée
      const rsvId = `RSV-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await global.db.post('/reservations', stampCreate({
        id: rsvId,
        car_id: carId,
        car_plate: carPlate,
        customer_id: customerId,
        customer_name: customerName,
        start_date: periodStart,
        end_date: periodEnd,
        start_time: pickupTime || '09:00',
        end_time: returnTime || '18:00',
        status: 'confirmee',
        contract_line_id: lineId,
      }, req), { headers: { Prefer: 'return=minimal' } });
      reservationId = rsvId;
    }

    // Mettre à jour reservation_id sur la ligne de contrat
    await global.db.patch(
      `/contract_lines?id=eq.${lineId}`,
      stampUpdate({ reservation_id: reservationId }, req),
      { headers: { Prefer: 'return=minimal' } }
    );

    // Retourner la réservation finale
    const finalRes = await global.db.get(`/reservations?id=eq.${reservationId}&select=*`);
    return finalRes.data?.[0] || null;
  } catch (e: any) {
    console.error('[BR25] applyBR25 error:', e?.response?.data || e?.message);
    return null; // non bloquant
  }
}

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/contract_lines?select=*&order=created_at.desc');
    res.json({ success: true, data: result.data });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/contract_lines?id=eq.${req.params.id}&select=*`);
    if (!result.data || result.data.length === 0) return res.status(404).json({ success: false, message: 'Ligne de contrat introuvable.' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const status = req.body.status || 'active';
    const pickupTime: string | null = req.body.pickup_time || null;
    const returnTime: string | null = req.body.return_time || null;
    if (status === 'active') {
      const overlap = await findVehicleOverlap(req.body.car_id, req.body.period_start, req.body.period_end, pickupTime, returnTime);
      if (overlap) return res.status(409).json({ success: false, error: 'vehicle_overlap', message: overlap.message, conflict: overlap.conflict });
    }

    const id = req.body.id || uuidv4();
    const result = await global.db.post('/contract_lines', stampCreate({ ...req.body, id, status }, req), {
      headers: { Prefer: 'return=representation' },
    });
    const line: Record<string, unknown> = Array.isArray(result.data) ? result.data[0] : result.data;

    // BR25 : créer/lier automatiquement une réservation pour toute ligne active
    let reservation: Record<string, unknown> | null = null;
    if (status === 'active' && line?.car_id && line?.period_start && line?.period_end) {
      reservation = await applyBR25(
        String(line.id),
        String(line.car_id),
        String(line.car_plate || ''),
        String(line.period_start),
        String(line.period_end),
        String(line.contract_id),
        pickupTime,
        returnTime,
        req
      );
      if (reservation) line.reservation_id = reservation.id;
    }

    res.status(201).json({ success: true, data: { line, reservation } });
  } catch (err) {
    if (isExclusionViolation(err)) return res.status(409).json({ success: false, error: 'vehicle_overlap', message: 'Ce véhicule est déjà engagé sur cette période.' });
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/contract_lines?id=eq.${req.params.id}&select=*`);
    if (!check.data || check.data.length === 0) return res.status(404).json({ success: false, message: 'Ligne de contrat introuvable.' });
    const current = check.data[0];

    const carId = req.body.car_id ?? current.car_id;
    const periodStart = req.body.period_start ?? current.period_start;
    const periodEnd = req.body.period_end ?? current.period_end;
    const status = req.body.status ?? current.status;
    const pickupTime: string | null = req.body.pickup_time !== undefined ? (req.body.pickup_time || null) : (current.pickup_time || null);
    const returnTime: string | null = req.body.return_time !== undefined ? (req.body.return_time || null) : (current.return_time || null);

    if (status === 'active') {
      const overlap = await findVehicleOverlap(carId, periodStart, periodEnd, pickupTime, returnTime, req.params.id);
      if (overlap) return res.status(409).json({ success: false, error: 'vehicle_overlap', message: overlap.message, conflict: overlap.conflict });
    }

    const result = await global.db.patch(`/contract_lines?id=eq.${req.params.id}`, stampUpdate(req.body, req), {
      headers: { Prefer: 'return=representation' },
    });
    res.json({ success: true, data: Array.isArray(result.data) ? result.data[0] : result.data });
  } catch (err) {
    if (isExclusionViolation(err)) return res.status(409).json({ success: false, error: 'vehicle_overlap', message: 'Ce véhicule est déjà engagé sur cette période.' });
    res.status(500).json({ success: false, error: String(err) });
  }
});

// BR26 : résiliation anticipée d'une ligne active avec recalcul au prorata
router.post('/:id/terminate', async (req: AuthRequest, res: Response) => {
  try {
    const { actual_end_date } = req.body;
    if (!actual_end_date) return res.status(400).json({ success: false, message: 'actual_end_date requis.' });

    const lineRes = await global.db.get(`/contract_lines?id=eq.${req.params.id}&select=*`);
    if (!lineRes.data?.[0]) return res.status(404).json({ success: false, message: 'Ligne introuvable.' });
    const line = lineRes.data[0];

    if (line.status !== 'active') {
      return res.status(422).json({ success: false, message: 'Seule une ligne active peut être résiliée.' });
    }
    if (actual_end_date < line.period_start || actual_end_date > line.period_end) {
      return res.status(400).json({ success: false, message: `La date doit être entre ${line.period_start} et ${line.period_end}.` });
    }

    // Recalcul au prorata (jours inclusifs)
    const actualDays = Math.round((new Date(actual_end_date).getTime() - new Date(line.period_start).getTime()) / 86400000) + 1;
    const originalDays = line.days || actualDays;
    const ratio = actualDays / originalDays;
    const newAmountHt  = Math.round(Number(line.amount_ht)  * ratio * 100) / 100;
    const newVatAmount = Math.round(Number(line.vat_amount) * ratio * 100) / 100;
    const newAmountTtc = Math.round((newAmountHt + newVatAmount) * 100) / 100;

    await global.db.patch(
      `/contract_lines?id=eq.${req.params.id}`,
      stampUpdate({ status: 'resilie', actual_end_date, days: actualDays, amount_ht: newAmountHt, vat_amount: newVatAmount, amount_ttc: newAmountTtc, amount_tnd: newAmountTtc }, req),
      { headers: { Prefer: 'return=minimal' } }
    );

    // Si toutes les lignes du contrat sont non-actives → contrat résiliée
    const allLinesRes = await global.db.get(`/contract_lines?contract_id=eq.${line.contract_id}&select=id,status`);
    const hasActiveLines = (allLinesRes.data || []).some((l: any) => l.id !== req.params.id && l.status === 'active');
    if (!hasActiveLines) {
      await global.db.patch(`/contracts?id=eq.${line.contract_id}`, stampUpdate({ status: 'resilie' }, req), { headers: { Prefer: 'return=minimal' } });
    }

    // Mettre à jour la réservation liée
    if (line.reservation_id) {
      const today = new Date().toISOString().split('T')[0];
      const rsvPatch: Record<string, unknown> = { end_date: actual_end_date };
      if (actual_end_date < today) rsvPatch.status = 'annulee';
      try {
        await global.db.patch(`/reservations?id=eq.${line.reservation_id}`, stampUpdate(rsvPatch, req), { headers: { Prefer: 'return=minimal' } });
      } catch (e: any) { console.warn('[BR26] reservation update:', e?.message); }
    }

    const updatedRes = await global.db.get(`/contract_lines?id=eq.${req.params.id}&select=*`);
    res.json({ success: true, data: updatedRes.data?.[0] || null });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Récupérer la ligne pour connaître la réservation liée avant suppression
    const lineRes = await global.db.get(`/contract_lines?id=eq.${req.params.id}&select=reservation_id`);
    const reservationId = lineRes.data?.[0]?.reservation_id || null;

    // Supprimer la ligne (ON DELETE SET NULL sur reservations.contract_line_id s'exécute automatiquement)
    await global.db.delete(`/contract_lines?id=eq.${req.params.id}`);

    // Si une réservation était liée, la supprimer (elle a été créée par BR25)
    if (reservationId) {
      try {
        await global.db.delete(`/reservations?id=eq.${reservationId}`);
      } catch (e: any) {
        console.warn('[BR25] Impossible de supprimer la réservation liée:', reservationId, e?.message);
      }
    }

    res.json({ success: true, message: 'Ligne de contrat supprimée.', deletedReservationId: reservationId });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

export default router;
