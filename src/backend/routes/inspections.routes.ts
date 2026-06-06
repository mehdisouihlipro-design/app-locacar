// src/backend/routes/inspections.routes.ts
import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await global.db.get('/inspections?select=*&order=created_at.desc');
    res.json({ success: true, data: result.data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const inspection = await global.db.get(`/inspections?id=eq.${req.params.id}&select=*`);
    if (!inspection.data || inspection.data.length === 0) return res.status(404).json({ success: false, message: 'Inspection not found' });

    const details = await global.db.get(`/inspection_details?inspection_id=eq.${req.params.id}&select=*`);
    const data: any = { ...inspection.data[0], checklistDetails: {} };

    if (details.data) {
      details.data.forEach((detail: any) => {
        data.checklistDetails[detail.point_key] = {
          rating: detail.rating,
          observation: detail.observation,
          photo: { name: detail.photo_name, type: detail.photo_type, mediaRef: detail.media_ref }
        };
      });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { checklistDetails, ...inspectionBody } = req.body;
    const inspectionId = inspectionBody.id || uuidv4();

    const result = await global.db.post('/inspections', {
      ...inspectionBody,
      id: inspectionId
    }, { headers: { Prefer: 'return=representation' } });

    // Insert checklist details
    if (checklistDetails && typeof checklistDetails === 'object') {
      for (const [pointKey, detail] of Object.entries(checklistDetails)) {
        const d = detail as any;
        await global.db.post('/inspection_details', {
          id: `detail-${inspectionId}-${pointKey}`,
          inspection_id: inspectionId,
          point_key: pointKey,
          rating: d.rating || 5,
          observation: d.observation || '',
          photo_name: d.photo?.name || '',
          photo_type: d.photo?.type || '',
          media_ref: d.photo?.mediaRef || ''
        }, { headers: { Prefer: 'return=representation' } });
      }
    }

    res.status(201).json({ success: true, data: result.data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Delete details first (foreign key)
    await global.db.delete(`/inspection_details?inspection_id=eq.${req.params.id}`);
    await global.db.delete(`/inspections?id=eq.${req.params.id}`);
    res.json({ success: true, message: 'Inspection deleted', data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
