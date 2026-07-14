import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

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
    const { name, first_name, last_name, type, phone, email, address, city, postal_code, country, id_number, tax_id, notes } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Le nom est requis.' });
    const id = req.body.id || uuidv4();

    // Tentative 1 : INSERT complet avec tous les champs
    try {
      await global.db.post('/customers', stampCreate({ id, name, first_name, last_name, type, phone, email, address, city, postal_code, country, id_number, tax_id, notes }, req), { headers: { Prefer: 'resolution=merge-duplicates' } });
    } catch (e1: any) {
      // Tentative 2 : INSERT sans les champs potentiellement absents du cache PostgREST,
      // puis PATCH pour les ajouter séparément
      console.warn('[customers POST] insert complet échoué, fallback:', e1?.response?.data?.message || String(e1));
      await global.db.post('/customers', stampCreate({ id, name, phone, email, address, city, postal_code, country, id_number, tax_id, notes }, req), { headers: { Prefer: 'resolution=merge-duplicates' } });
      const patch: Record<string, unknown> = {};
      if (first_name != null) patch.first_name = first_name;
      if (last_name  != null) patch.last_name  = last_name;
      if (type       != null) patch.type        = type;
      if (Object.keys(patch).length > 0) {
        try { await global.db.patch(`/customers?id=eq.${id}`, stampUpdate(patch, req)); }
        catch (e2: any) { console.warn('[customers POST] patch new fields échoué:', e2?.response?.data?.message || String(e2)); }
      }
    }

    res.status(201).json({ success: true, data: { id, name, first_name, last_name, type, phone, email } });
  } catch (err: any) {
    const detail = err?.response?.data?.message || err?.response?.data || String(err);
    console.error('[customers POST]', detail);
    res.status(500).json({ success: false, error: String(detail) });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const check = await global.db.get(`/customers?id=eq.${req.params.id}&select=id`);
    if (!check.data || check.data.length === 0) return res.status(404).json({ success: false, message: 'Client introuvable.' });
    const result = await global.db.patch(`/customers?id=eq.${req.params.id}`, stampUpdate(req.body, req), {
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
