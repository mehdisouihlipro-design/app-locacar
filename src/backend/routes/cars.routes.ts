import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    let url = `/cars?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;
    if (status) url += `&status=eq.${status}`;
    const result = await global.db.get(url);
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/cars?id=eq.${req.params.id}&select=*`);
    if (!result.data || result.data.length === 0) return res.status(404).json({ success: false, message: 'Véhicule introuvable.' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { plate, model, brand, color, vin, status, odometer_km, agency, location, notes } = req.body;
    if (!plate || !model) return res.status(400).json({ success: false, message: 'Immatriculation et modèle requis.' });
    const id = req.body.id || uuidv4();
    await global.db.post('/cars', stampCreate({
      id, plate, model,
      ...(brand && { brand }),
      ...(color && { color }),
      ...(vin && { vin }),
      status: status || 'disponible',
      odometer_km: odometer_km || 0,
      location: location || agency || null,
      ...(notes && { notes }),
    }, req), { headers: { Prefer: 'resolution=merge-duplicates' } });
    res.status(201).json({ success: true, data: { id, plate, model, status: status || 'disponible' } });
  } catch (err: any) {
    const detail = err?.response?.data || err?.message || String(err);
    res.status(500).json({ success: false, error: String(err), detail });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/cars?id=eq.${req.params.id}&select=id`);
    if (!check.data || check.data.length === 0) return res.status(404).json({ success: false, message: 'Véhicule introuvable.' });
    const result = await global.db.patch(`/cars?id=eq.${req.params.id}`, stampUpdate(req.body, req), {
      headers: { Prefer: 'return=representation' },
    });
    res.json({ success: true, data: Array.isArray(result.data) ? result.data[0] : result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/cars?id=eq.${req.params.id}&select=id`);
    if (!check.data || check.data.length === 0) return res.status(404).json({ success: false, message: 'Véhicule introuvable.' });
    await global.db.delete(`/cars?id=eq.${req.params.id}`);
    res.json({ success: true, message: 'Véhicule supprimé.' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
