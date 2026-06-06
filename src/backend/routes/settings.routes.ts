// src/backend/routes/settings.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const DEFAULT_SETTINGS = { id: 1, base_currency: 'TND', eur_to_tnd: 3.4, opening_cash_tnd: 0, reservation_buffer_hours: 2 };

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/settings?select=*');
    if (!result.data || result.data.length === 0) {
      return res.json({ success: true, data: DEFAULT_SETTINGS });
    }
    res.json({ success: true, data: result.data[0] });
  } catch (_err) {
    // Table may not be accessible via anon key — return defaults
    res.json({ success: true, data: DEFAULT_SETTINGS });
  }
});

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.patch('/settings?id=eq.1', req.body, { headers: { Prefer: 'return=representation' } });
    res.json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
