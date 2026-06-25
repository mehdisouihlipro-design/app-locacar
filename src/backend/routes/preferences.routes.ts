// src/backend/routes/preferences.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/v1/preferences/:key — renvoie { value } pour l'utilisateur courant
router.get('/:key', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { key } = req.params;
    const result = await global.db.get(
      `/user_preferences?user_id=eq.${encodeURIComponent(userId)}&key=eq.${encodeURIComponent(key)}&select=value&limit=1`
    );
    if (!result.data || result.data.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: result.data[0].value });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// PUT /api/v1/preferences/:key — upsert { value } pour l'utilisateur courant
router.put('/:key', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ success: false, error: 'Champ "value" requis' });
    }
    await global.db.post(
      '/user_preferences?on_conflict=user_id,key',
      { user_id: userId, key, value, updated_at: new Date().toISOString() },
      { headers: { Prefer: 'resolution=merge-duplicates' } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
