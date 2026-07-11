// Administration du portail client site-web
// Protégé par JWT (enregistré après app.use('/api/v1', authenticateToken))
import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampUpdate } from '../utils/audit';

const router = Router();

const SITE_FIELDS = 'id,brand,model,fuel_type,color,location,status,odometer_km,photo_url,site_visible,site_price_day';

// GET /api/v1/site-admin/cars
router.get('/cars', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(
      `/cars?select=${SITE_FIELDS}&order=brand.asc,model.asc&limit=200`
    );
    res.json({ success: true, data: result.data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// PUT /api/v1/site-admin/cars/:id
router.put('/cars/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { photo_url, site_visible, site_price_day } = req.body;
    const patch: Record<string, any> = {};

    if (photo_url !== undefined)      patch.photo_url      = photo_url      || null;
    if (site_visible !== undefined)   patch.site_visible   = Boolean(site_visible);
    if (site_price_day !== undefined) patch.site_price_day = site_price_day != null && site_price_day !== '' ? Number(site_price_day) : null;

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun champ à mettre à jour.' });
    }

    await global.db.patch(
      `/cars?id=eq.${req.params.id}`,
      stampUpdate(patch, req),
      { headers: { Prefer: 'return=minimal' } }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// GET /api/v1/site-admin/unavailabilities
router.get('/unavailabilities', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(
      '/site_unavailability?select=*&order=car_id.asc,from_date.asc'
    );
    res.json({ success: true, data: result.data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// POST /api/v1/site-admin/unavailabilities
router.post('/unavailabilities', async (req: AuthRequest, res: Response) => {
  try {
    const { car_id, from_date, to_date, notes } = req.body;

    if (!car_id || !from_date || !to_date) {
      return res.status(400).json({ success: false, message: 'car_id, from_date et to_date sont requis.' });
    }
    if (from_date > to_date) {
      return res.status(400).json({ success: false, message: 'La date de début doit être antérieure ou égale à la date de fin.' });
    }

    const id = uuidv4();
    await global.db.post('/site_unavailability', {
      id,
      car_id,
      from_date,
      to_date,
      notes: notes?.trim() || null,
    });

    res.status(201).json({ success: true, data: { id, car_id, from_date, to_date, notes: notes || null } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// DELETE /api/v1/site-admin/unavailabilities/:id
router.delete('/unavailabilities/:id', async (req: AuthRequest, res: Response) => {
  try {
    await global.db.delete(`/site_unavailability?id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
