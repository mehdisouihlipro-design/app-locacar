// src/backend/routes/inspections.routes.ts
import { Router, Request, Response } from 'express';
const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('SELECT * FROM inspections ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const inspection = await global.db.query('SELECT * FROM inspections WHERE id = $1', [req.params.id]);
    if (inspection.rows.length === 0) return res.status(404).json({ success: false, message: 'Inspection not found' });
    
    const details = await global.db.query('SELECT * FROM inspection_details WHERE inspection_id = $1', [req.params.id]);
    const data = { ...inspection.rows[0], checklistDetails: {} };
    
    details.rows.forEach(detail => {
      data.checklistDetails[detail.point_key] = {
        rating: detail.rating,
        observation: detail.observation,
        photo: { name: detail.photo_name, type: detail.photo_type, mediaRef: detail.media_ref }
      };
    });
    
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, type, contract_id, car_id, car_plate, date, time, odometer_km, fuel_level, interior_cleanliness, exterior_cleanliness, condition_note, observation, global_score, checklistDetails } = req.body;
    
    const client = await global.db.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO inspections (id, type, contract_id, car_id, car_plate, date, time, odometer_km, fuel_level, interior_cleanliness, exterior_cleanliness, condition_note, observation, global_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [id, type, contract_id, car_id, car_plate, date, time, odometer_km, fuel_level, interior_cleanliness, exterior_cleanliness, condition_note, observation, global_score]
      );

      // Insert checklist details
      if (checklistDetails && typeof checklistDetails === 'object') {
        for (const [pointKey, detail] of Object.entries(checklistDetails)) {
          const d = detail as any;
          await client.query(
            `INSERT INTO inspection_details (id, inspection_id, point_key, rating, observation, photo_name, photo_type, media_ref)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [`detail-${id}-${pointKey}`, id, pointKey, d.rating || 5, d.observation || '', d.photo?.name || '', d.photo?.type || '', d.photo?.mediaRef || '']
          );
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await global.db.query('DELETE FROM inspections WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Inspection not found' });
    res.json({ success: true, message: 'Inspection deleted', data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
