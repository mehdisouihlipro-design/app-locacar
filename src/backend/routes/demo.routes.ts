import { Router, Response } from 'express';
import { AuthRequest, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(authorizeRoles('admin'));

// Clear all demo tables in reverse FK order, then bulk insert
router.post('/reset', async (req: AuthRequest, res: Response) => {
  try {
    const { cars = [], customers = [], contracts = [], contract_lines = [],
            invoices = [], invoice_lines = [], invoice_schedule = [], payments = [], maintenance = [], vignettes = [],
            reservations = [], insurances = [], leasing = [],
            quotes = [], quote_lines = [] } = req.body;

    // Delete in reverse FK order
    // Attention : contracts.quote_id REFERENCES quotes(id) → contracts doit être supprimé AVANT quotes
    const tables = [
      'inspection_details', 'inspections', 'vignettes', 'insurances',
      'leasing_contracts', 'maintenance_costs', 'payments', 'invoice_lines', 'invoice_schedule', 'invoices',
      'collections', 'contract_lines', 'contracts', 'reservations',
      'quote_lines', 'quotes',
      'cars', 'customers',
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

    // Ordre FK : quotes avant contracts (contracts.quote_id → quotes)
    await insertMany('cars', cars);
    await insertMany('customers', customers);
    await insertMany('quotes', quotes);
    await insertMany('quote_lines', quote_lines);
    await insertMany('contracts', contracts);
    await insertMany('contract_lines', contract_lines);
    await insertMany('invoices', invoices);
    await insertMany('invoice_lines', invoice_lines);
    await insertMany('invoice_schedule', invoice_schedule);
    await insertMany('payments', payments);
    await insertMany('maintenance_costs', maintenance);
    await insertMany('vignettes', vignettes);
    await insertMany('reservations', reservations);
    await insertMany('insurances', insurances);
    await insertMany('leasing_contracts', leasing);

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// POST /demo/clear — vide TOUTES les données sans réinsertion
// Efface toutes les tables métier + settings + remet les souches à zéro
router.post('/clear', async (req: AuthRequest, res: Response) => {
  try {
    // Ordre inverse des FK — contracts.quote_id → quotes : contracts supprimé AVANT quotes
    const tables = [
      'inspection_details', 'inspections', 'site_unavailability',
      'vignettes', 'insurances', 'leasing_contracts', 'maintenance_costs',
      'payments', 'invoice_lines', 'invoice_schedule', 'invoices',
      'collections', 'contract_lines', 'contracts', 'reservations',
      'quote_lines', 'quotes',
      'cars', 'customers',
    ];
    for (const t of tables) {
      await global.db.delete(`/${t}?id=gte.`).catch(() => {});
    }

    // Settings : suppression de la ligne id=1 (le GET /settings retourne les défauts si vide)
    await global.db.delete('/settings?id=eq.1').catch(() => {});

    // Souches : remise à zéro des compteurs (les lignes de config restent)
    await global.db.patch(
      '/number_sequences?id=not.is.null',
      { last_number: 0, last_year: null },
      { headers: { Prefer: 'return=minimal' } }
    ).catch(() => {});

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
