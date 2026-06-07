// src/backend/routes/invoices.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/invoices?select=*&order=created_at.desc');
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/invoices?id=eq.${req.params.id}&select=*`);
    if (!result.data || result.data.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.post('/invoices', {
      ...req.body,
      id: req.body.id || uuidv4(),
      status: req.body.status || 'en_attente'
    }, { headers: { Prefer: 'resolution=merge-duplicates' } });
    res.status(201).json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.patch(`/invoices?id=eq.${req.params.id}`, req.body);
    if (!result.data || result.data.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await global.db.delete(`/invoices?id=eq.${req.params.id}`);
    res.json({ success: true, message: 'Invoice deleted', data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
