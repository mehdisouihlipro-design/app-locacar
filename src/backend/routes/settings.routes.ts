// src/backend/routes/settings.routes.ts
import { Router, Request, Response } from 'express';
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('SELECT * FROM settings WHERE id = 1');
    if (result.rows.length === 0) {
      // Create default settings
      const defaults = await global.db.query(
        `INSERT INTO settings (id, base_currency, eur_to_tnd, opening_cash_tnd, reservation_buffer_hours)
         VALUES (1, 'TND', 3.4, 0, 2) RETURNING *`
      );
      return res.json({ success: true, data: defaults.rows[0] });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const { base_currency, eur_to_tnd, opening_cash_tnd, reservation_buffer_hours } = req.body;
    const result = await global.db.query(
      `UPDATE settings SET base_currency = $1, eur_to_tnd = $2, opening_cash_tnd = $3, reservation_buffer_hours = $4, updated_at = NOW() WHERE id = 1 RETURNING *`,
      [base_currency, eur_to_tnd, opening_cash_tnd, reservation_buffer_hours]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
