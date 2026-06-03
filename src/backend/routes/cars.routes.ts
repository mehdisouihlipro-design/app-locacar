// src/backend/routes/cars.routes.ts

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validateCarCreation = [
  body('plate').isString().trim().notEmpty().withMessage('Plate is required'),
  body('model').isString().trim().notEmpty().withMessage('Model is required'),
  body('brand').optional().isString().trim(),
  body('vin').optional().isString().trim(),
  body('status').optional().isIn(['disponible', 'location', 'maintenance', 'restitution']),
];

const validateCarUpdate = [
  param('id').isUUID().withMessage('Invalid car ID'),
  body('plate').optional().isString().trim(),
  body('model').optional().isString().trim(),
  body('status').optional().isIn(['disponible', 'location', 'maintenance', 'restitution']),
];

// Error handler
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
    return true;
  }
  return false;
};

// Get all cars with pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const page = (req.query.page as any) || 1;
      const limit = (req.query.limit as any) || 20;
      const status = req.query.status as string | undefined;
      const offset = (page - 1) * limit;

      let countQuery = 'SELECT COUNT(*) as total FROM cars';
      let selectQuery = 'SELECT * FROM cars ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const params: any[] = [limit, offset];

      if (status) {
        countQuery += ' WHERE status = $1';
        selectQuery = `SELECT * FROM cars WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
        params.unshift(status);
      }

      const countResult = await global.db.query(countQuery, status ? [status] : []);
      const total = parseInt(countResult.rows[0].total);

      const result = await global.db.query(selectQuery, params);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error('[Error] Get cars:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch cars', error: String(err) });
    }
  }
);

// Get car by ID
router.get('/:id', [param('id').isUUID().withMessage('Invalid car ID')], async (req: AuthRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const result = await global.db.query('SELECT * FROM cars WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Error] Get car by ID:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch car', error: String(err) });
  }
});

// Create car
router.post('/', validateCarCreation, async (req: AuthRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const id = uuidv4();
    const {
      plate,
      model,
      brand,
      vin,
      registration_number,
      registration_date,
      fuel_type,
      color,
      purchase_price,
      purchase_date,
      odometer_km,
      status,
      location,
      owner_name,
      leasing_status,
      notes,
    } = req.body;

    // Check if plate already exists
    const existingCar = await global.db.query('SELECT id FROM cars WHERE plate = $1', [plate]);
    if (existingCar.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Car with this plate already exists' });
    }

    const query = `
      INSERT INTO cars (
        id, plate, model, brand, vin, registration_number, registration_date,
        fuel_type, color, purchase_price, purchase_date, odometer_km, status,
        location, owner_name, leasing_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const result = await global.db.query(query, [
      id,
      plate,
      model,
      brand || null,
      vin || null,
      registration_number || null,
      registration_date || null,
      fuel_type || null,
      color || null,
      purchase_price || null,
      purchase_date || null,
      odometer_km || 0,
      status || 'disponible',
      location || null,
      owner_name || null,
      leasing_status || null,
      notes || null,
    ]);

    res.status(201).json({ success: true, message: 'Car created successfully', data: result.rows[0] });
  } catch (err) {
    console.error('[Error] Create car:', err);
    res.status(500).json({ success: false, message: 'Failed to create car', error: String(err) });
  }
});

// Update car
router.put('/:id', validateCarUpdate, async (req: AuthRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;

    // Check car exists
    const carCheck = await global.db.query('SELECT id FROM cars WHERE id = $1', [id]);
    if (carCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(req.body).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE cars SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await global.db.query(query, values);

    res.json({ success: true, message: 'Car updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('[Error] Update car:', err);
    res.status(500).json({ success: false, message: 'Failed to update car', error: String(err) });
  }
});

// Delete car
router.delete('/:id', [param('id').isUUID().withMessage('Invalid car ID')], async (req: AuthRequest, res: Response) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const result = await global.db.query('DELETE FROM cars WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }

    res.json({ success: true, message: 'Car deleted successfully', data: { id } });
  } catch (err) {
    console.error('[Error] Delete car:', err);
    res.status(500).json({ success: false, message: 'Failed to delete car', error: String(err) });
  }
});

// Update car GPS location
router.patch(
  '/:id/gps',
  [
    param('id').isUUID().withMessage('Invalid car ID'),
    body('gps_lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('gps_lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('gps_speed').optional().isInt({ min: 0 }).toInt(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { id } = req.params;
      const { gps_lat, gps_lng, gps_speed } = req.body;

      const carCheck = await global.db.query('SELECT id FROM cars WHERE id = $1', [id]);
      if (carCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Car not found' });
      }

      const query = `
        UPDATE cars 
        SET gps_lat = $1, gps_lng = $2, gps_speed = $3, gps_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const result = await global.db.query(query, [gps_lat, gps_lng, gps_speed || 0, id]);

      res.json({ success: true, message: 'GPS location updated', data: result.rows[0] });
    } catch (err) {
      console.error('[Error] Update GPS:', err);
      res.status(500).json({ success: false, message: 'Failed to update GPS', error: String(err) });
    }
  }
);

// Search cars by plate, model, brand or location
router.get('/search/:query', async (req: AuthRequest, res: Response) => {
  try {
    const searchQuery = `%${req.params.query}%`;
    const result = await global.db.query(
      `SELECT * FROM cars
       WHERE plate ILIKE $1 OR model ILIKE $1 OR brand ILIKE $1 OR location ILIKE $1
       ORDER BY created_at DESC`,
      [searchQuery]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Error] Search cars:', err);
    res.status(500).json({ success: false, message: 'Failed to search cars', error: String(err) });
  }
});

export default router;
