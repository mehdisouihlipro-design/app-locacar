// Public API — aucune authentification requise
// Exposé sous /api/v1/public (enregistré avant le middleware JWT dans index.ts)
import { Router, Request, Response } from 'express';

const router = Router();

const PUBLIC_FIELDS = 'id,brand,model,fuel_type,color,location,status,odometer_km,photo_url,site_price_day';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/v1/public/cars?from=YYYY-MM-DD&to=YYYY-MM-DD
// Sans dates : retourne tous les véhicules avec site_visible = true
// Avec dates : exclut les véhicules dont une plage d'indisponibilité chevauche la période
router.get('/cars', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string };

    if (!from || !to) {
      const result = await global.db.get(
        `/cars?select=${PUBLIC_FIELDS}&site_visible=eq.true&order=brand.asc,model.asc`
      );
      return res.json({ success: true, data: result.data || [], meta: { total: (result.data || []).length } });
    }

    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
      return res.status(400).json({ success: false, message: 'Dates invalides. Format attendu : YYYY-MM-DD' });
    }
    if (from >= to) {
      return res.status(400).json({ success: false, message: 'La date de retour doit être strictement après la date de départ.' });
    }

    // Voitures bloquées : une plage d'indisponibilité chevauche la période recherchée
    // Chevauchement : from_date < to_search AND to_date > from_search
    const unavailResult = await global.db.get(
      `/site_unavailability?select=car_id&from_date=lt.${to}&to_date=gt.${from}`
    );
    const blockedIds: string[] = [...new Set<string>(
      (unavailResult.data || []).map((r: any) => r.car_id as string).filter(Boolean)
    )];

    let url = `/cars?select=${PUBLIC_FIELDS}&site_visible=eq.true&order=brand.asc,model.asc`;
    if (blockedIds.length > 0) {
      url += `&id=not.in.(${blockedIds.join(',')})`;
    }

    const carsResult = await global.db.get(url);
    const data = carsResult.data || [];

    res.json({ success: true, data, meta: { from, to, total: data.length } });
  } catch (err: any) {
    console.error('[public/cars] erreur:', err?.response?.data || err?.message || err);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
