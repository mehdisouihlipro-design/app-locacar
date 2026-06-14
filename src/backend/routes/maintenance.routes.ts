// src/backend/routes/maintenance_costs.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import { stampCreate } from '../utils/audit';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/maintenance_costs?select=*&order=created_at.desc');
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.post('/maintenance_costs', stampCreate({
      ...req.body,
      id: req.body.id || uuidv4(),
      status: req.body.status || 'paye'
    }, req), { headers: { Prefer: 'resolution=merge-duplicates' } });
    res.status(201).json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await global.db.delete(`/maintenance_costs?id=eq.${req.params.id}`);
    res.json({ success: true, message: 'Maintenance deleted', data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
