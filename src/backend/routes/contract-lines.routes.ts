// src/backend/routes/contract-lines.routes.ts
import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

const router = Router();

// BR19 niveau 2 : verifie qu'une ligne (vehicule + periode, statut actif)
// ne chevauche pas une autre ligne de contrat active ou une reservation
// active sur le meme vehicule. Retourne le conflit trouve, ou null.
async function findVehicleOverlap(
  carId: string,
  periodStart: string,
  periodEnd: string,
  excludeLineId?: string
): Promise<{ message: string; conflict: Record<string, unknown> } | null> {
  const linesResult = await global.db.get(
    `/contract_lines?car_id=eq.${carId}&status=eq.active&select=id,contract_id,car_plate,period_start,period_end`
  );
  const overlappingLine = (linesResult.data || []).find((line: any) => {
    if (excludeLineId && line.id === excludeLineId) return false;
    return periodStart <= line.period_end && periodEnd >= line.period_start;
  });

  if (overlappingLine) {
    const siblingLines = await global.db.get(
      `/contract_lines?contract_id=eq.${overlappingLine.contract_id}&select=id&order=created_at.asc`
    );
    const lineNumber = (siblingLines.data || []).findIndex((l: any) => l.id === overlappingLine.id) + 1;
    return {
      message: `⚠ Le véhicule ${overlappingLine.car_plate} est déjà engagé du ${overlappingLine.period_start} au ${overlappingLine.period_end} sur le contrat ${overlappingLine.contract_id} (ligne ${lineNumber || 1}). Choisissez une autre période ou un autre véhicule.`,
      conflict: {
        carId,
        contractId: overlappingLine.contract_id,
        lineId: overlappingLine.id,
        periodStart: overlappingLine.period_start,
        periodEnd: overlappingLine.period_end,
      },
    };
  }

  const reservationsResult = await global.db.get(
    `/reservations?car_id=eq.${carId}&select=id,car_plate,start_date,end_date,status,contract_line_id`
  );
  const overlappingReservation = (reservationsResult.data || []).find((rsv: any) => {
    if (rsv.status === 'annulee' || rsv.status === 'terminee') return false;
    if (excludeLineId && rsv.contract_line_id === excludeLineId) return false;
    return periodStart <= rsv.end_date && periodEnd >= rsv.start_date;
  });

  if (overlappingReservation) {
    return {
      message: `⚠ Le véhicule ${overlappingReservation.car_plate} est déjà engagé du ${overlappingReservation.start_date} au ${overlappingReservation.end_date} par la réservation ${overlappingReservation.id}. Choisissez une autre période ou un autre véhicule.`,
      conflict: {
        carId,
        reservationId: overlappingReservation.id,
        periodStart: overlappingReservation.start_date,
        periodEnd: overlappingReservation.end_date,
      },
    };
  }

  return null;
}

function isExclusionViolation(err: any): boolean {
  return err?.response?.data?.code === '23P01';
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
    if (status === 'active') {
      const overlap = await findVehicleOverlap(req.body.car_id, req.body.period_start, req.body.period_end);
      if (overlap) return res.status(409).json({ success: false, error: 'vehicle_overlap', message: overlap.message, conflict: overlap.conflict });
    }

    const id = req.body.id || uuidv4();
    const result = await global.db.post('/contract_lines', stampCreate({ ...req.body, id, status }, req), {
      headers: { Prefer: 'return=representation' },
    });
    res.status(201).json({ success: true, data: Array.isArray(result.data) ? result.data[0] : result.data });
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

    if (status === 'active') {
      const overlap = await findVehicleOverlap(carId, periodStart, periodEnd, req.params.id);
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

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await global.db.delete(`/contract_lines?id=eq.${req.params.id}`);
    res.json({ success: true, message: 'Ligne de contrat supprimée.' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

export default router;
