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
    // Upsert: la ligne id=1 peut ne pas encore exister (table settings vide au premier
    // enregistrement) — un simple PATCH sur id=eq.1 ne crée rien et persiste 0 ligne.
    const result = await global.db.post('/settings?on_conflict=id', { id: 1, ...req.body }, {
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    });
    res.json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
