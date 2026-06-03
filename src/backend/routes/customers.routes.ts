// src/backend/routes/customers.routes.ts

import { Router, Request, Response } from 'express';

const router = Router();

// Get all customers
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Get customer by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Create customer
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, name, phone, email, address, city, postal_code, country, id_number, notes } = req.body;
    const result = await global.db.query(
      `INSERT INTO customers (id, name, phone, email, address, city, postal_code, country, id_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, name, phone, email, address, city, postal_code, country, id_number, notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Update customer
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    const fields = Object.keys(updates).map((key, idx) => `${key} = $${idx + 1}`).join(', ');
    const values = [...Object.values(updates), req.params.id];
    const result = await global.db.query(
      `UPDATE customers SET ${fields}, updated_at = NOW() WHERE id = $${Object.keys(updates).length + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Delete customer
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('DELETE FROM customers WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted', data: { id: req.params.id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
