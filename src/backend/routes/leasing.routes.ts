// src/backend/routes/leasing.routes.ts
import { Router, Request, Response } from 'express';
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('SELECT * FROM leasing_contracts ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, car_id, car_plate, leasing_company, contract_number, start_date, end_date, monthly_amount, currency, monthly_amount_tnd, status, notes } = req.body;
    const result = await global.db.query(
      `INSERT INTO leasing_contracts (id, car_id, car_plate, leasing_company, contract_number, start_date, end_date, monthly_amount, currency, monthly_amount_tnd, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [id, car_id, car_plate, leasing_company, contract_number, start_date, end_date, monthly_amount, currency, monthly_amount_tnd, status || 'active', notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('DELETE FROM leasing_contracts WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Leasing contract not found' });
    res.json({ success: true, message: 'Leasing contract deleted', data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
