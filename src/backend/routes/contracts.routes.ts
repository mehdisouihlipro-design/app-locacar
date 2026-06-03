// src/backend/routes/contracts.routes.ts
import { Router, Request, Response } from 'express';
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('SELECT * FROM contracts ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, customer_id, car_id, contract_date, type, days, months, rate, rate_currency, quotient, quotient_currency, quotient_tnd, total_amount_original, total_amount_tnd, payment_moment, payment_plan, status, notes } = req.body;
    const result = await global.db.query(
      `INSERT INTO contracts (id, customer_id, car_id, contract_date, type, days, months, rate, rate_currency, quotient, quotient_currency, quotient_tnd, total_amount_original, total_amount_tnd, payment_moment, payment_plan, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [id, customer_id, car_id, contract_date, type, days, months, rate, rate_currency, quotient, quotient_currency, quotient_tnd, total_amount_original, total_amount_tnd, payment_moment, payment_plan, status || 'active', notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 1}`).join(', ');
    const values = [...Object.values(updates), req.params.id];
    const result = await global.db.query(
      `UPDATE contracts SET ${fields}, updated_at = NOW() WHERE id = $${Object.keys(updates).length + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('DELETE FROM contracts WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, message: 'Contract deleted', data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
