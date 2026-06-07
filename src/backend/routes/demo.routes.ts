import { Router, Response } from 'express';
import { AuthRequest, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(authorizeRoles('admin'));

// Clear all demo tables in reverse FK order, then bulk insert
router.post('/reset', async (req: AuthRequest, res: Response) => {
  try {
    const { cars = [], customers = [], contracts = [], invoices = [],
            payments = [], maintenance = [], vignettes = [],
            reservations = [], insurances = [] } = req.body;

    // Delete in reverse FK order
    const tables = [
      'inspection_details', 'inspections', 'vignettes', 'insurances',
      'leasing_contracts', 'maintenance_costs', 'payments', 'invoices',
      'collections', 'contracts', 'reservations', 'cars', 'customers',
    ];
    for (const t of tables) {
      await global.db.delete(`/${t}?id=gte.`).catch(() => {});
    }

    // Insert in FK order
    const results: Record<string, { ok: number; fail: number }> = {};

    async function insertMany(table: string, items: any[]) {
      let ok = 0, fail = 0;
      for (const item of items) {
        try {
          await global.db.post(`/${table}`, item);
          ok++;
        } catch (e: any) {
          fail++;
          console.error(`${table} insert fail:`, e?.response?.data || e?.message);
        }
      }
      results[table] = { ok, fail };
    }

    await insertMany('cars', cars);
    await insertMany('customers', customers);
    await insertMany('contracts', contracts);
    await insertMany('invoices', invoices);
    await insertMany('payments', payments);
    await insertMany('maintenance_costs', maintenance);
    await insertMany('vignettes', vignettes);
    await insertMany('reservations', reservations);
    await insertMany('insurances', insurances);

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
