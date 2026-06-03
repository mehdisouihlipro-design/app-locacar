// src/backend/routes/vignettes.routes.ts
import { Router, Request, Response } from 'express';
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('SELECT * FROM vignettes ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, car_id, car_plate, fiscal_year, amount_original, currency, amount_tnd, due_date, status, notes } = req.body;
    const result = await global.db.query(
      `INSERT INTO vignettes (id, car_id, car_plate, fiscal_year, amount_original, currency, amount_tnd, due_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, car_id, car_plate, fiscal_year, amount_original, currency, amount_tnd, due_date, status || 'a_payer', notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('DELETE FROM vignettes WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Vignette not found' });
    res.json({ success: true, message: 'Vignette deleted', data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
