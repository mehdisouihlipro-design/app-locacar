import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

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
    await global.db.post('/contracts', stampCreate({ ...req.body, id, status: req.body.status || 'active' }, req), { headers: { Prefer: 'resolution=merge-duplicates' } });
    res.status(201).json({ success: true, data: { id, ...req.body } });
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
    await global.db.delete(`/contracts?id=eq.${req.params.id}`);
    res.json({ success: true, message: 'Contrat supprimé.' });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

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

export default router;
