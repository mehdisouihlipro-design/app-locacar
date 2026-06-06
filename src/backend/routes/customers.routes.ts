import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/customers?select=*&order=created_at.desc');
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get(`/customers?id=eq.${req.params.id}&select=*`);
    if (!result.data || result.data.length === 0) return res.status(404).json({ success: false, message: 'Client introuvable.' });
    res.json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, address, city, postal_code, country, id_number, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Le nom est requis.' });
    const id = uuidv4();
    const result = await global.db.post('/customers', { id, name, phone, email, address, city, postal_code, country, id_number, notes }, {
      headers: { Prefer: 'return=representation' },
    });
    res.status(201).json({ success: true, data: Array.isArray(result.data) ? result.data[0] : result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/customers?id=eq.${req.params.id}&select=id`);
    if (!check.data || check.data.length === 0) return res.status(404).json({ success: false, message: 'Client introuvable.' });
    const result = await global.db.patch(`/customers?id=eq.${req.params.id}`, req.body, {
      headers: { Prefer: 'return=representation' },
    });
    res.json({ success: true, data: Array.isArray(result.data) ? result.data[0] : result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/customers?id=eq.${req.params.id}&select=id`);
    if (!check.data || check.data.length === 0) return res.status(404).json({ success: false, message: 'Client introuvable.' });
    await global.db.delete(`/customers?id=eq.${req.params.id}`);
    res.json({ success: true, message: 'Client supprimé.' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
