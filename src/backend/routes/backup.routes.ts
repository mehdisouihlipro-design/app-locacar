// src/backend/routes/backup.routes.ts
// Export JSON complet de la base + restauration depuis un fichier de sauvegarde
import { Router, Response } from 'express';
import { AuthRequest, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(authorizeRoles('admin'));

const BACKUP_VERSION = 1;

// ── GET /backup/full ──────────────────────────────────────────────────────────
// Télécharge un fichier JSON contenant toutes les données et la configuration.
router.get('/full', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      cars, customers, contracts, contract_lines,
      invoices, invoice_lines, invoice_schedule, payments,
      maintenance_costs, vignettes, reservations,
      insurances, leasing_contracts, quotes, quote_lines,
      inspections, inspection_details,
      number_sequences, settings,
    ] = await Promise.all([
      global.db.get('/cars?select=*&order=created_at.asc'),
      global.db.get('/customers?select=*&order=created_at.asc'),
      global.db.get('/contracts?select=*&order=created_at.asc'),
      global.db.get('/contract_lines?select=*&order=created_at.asc'),
      global.db.get('/invoices?select=*&order=created_at.asc'),
      global.db.get('/invoice_lines?select=*&order=created_at.asc'),
      global.db.get('/invoice_schedule?select=*&order=created_at.asc'),
      global.db.get('/payments?select=*&order=created_at.asc'),
      global.db.get('/maintenance_costs?select=*&order=created_at.asc'),
      global.db.get('/vignettes?select=*&order=created_at.asc'),
      global.db.get('/reservations?select=*&order=created_at.asc'),
      global.db.get('/insurances?select=*&order=created_at.asc'),
      global.db.get('/leasing_contracts?select=*&order=created_at.asc'),
      global.db.get('/quotes?select=*&order=created_at.asc'),
      global.db.get('/quote_lines?select=*&order=created_at.asc'),
      global.db.get('/inspections?select=*&order=created_at.asc'),
      global.db.get('/inspection_details?select=*&order=created_at.asc'),
      global.db.get('/number_sequences?select=*&order=id.asc'),
      global.db.get('/settings?select=*'),
    ]);

    const backup = {
      version: BACKUP_VERSION,
      created_at: new Date().toISOString(),
      data: {
        cars:               cars.data              || [],
        customers:          customers.data         || [],
        contracts:          contracts.data         || [],
        contract_lines:     contract_lines.data    || [],
        invoices:           invoices.data          || [],
        invoice_lines:      invoice_lines.data     || [],
        invoice_schedule:   invoice_schedule.data  || [],
        payments:           payments.data          || [],
        maintenance_costs:  maintenance_costs.data || [],
        vignettes:          vignettes.data         || [],
        reservations:       reservations.data      || [],
        insurances:         insurances.data        || [],
        leasing_contracts:  leasing_contracts.data || [],
        quotes:             quotes.data            || [],
        quote_lines:        quote_lines.data       || [],
        inspections:        inspections.data       || [],
        inspection_details: inspection_details.data || [],
      },
      config: {
        number_sequences: number_sequences.data || [],
        settings:         (settings.data || [])[0] || null,
      },
    };

    const filename = `locarcar_backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ── POST /backup/restore ──────────────────────────────────────────────────────
// Restaure toutes les données depuis un fichier de sauvegarde JSON.
// ATTENTION : efface toutes les données existantes avant la restauration.
router.post('/restore', async (req: AuthRequest, res: Response) => {
  try {
    const { version, data, config } = req.body;

    if (!version || !data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'Fichier de sauvegarde invalide ou corrompu (champs version et data requis).' });
    }

    // 1. Vider toutes les données existantes (même ordre que /demo/clear)
    const tables = [
      'inspection_details', 'inspections', 'site_unavailability',
      'vignettes', 'insurances', 'leasing_contracts', 'maintenance_costs',
      'payments', 'invoice_lines', 'invoice_schedule', 'invoices',
      'collections', 'quote_lines', 'quotes', 'contract_lines', 'contracts',
      'reservations', 'cars', 'customers',
    ];
    for (const t of tables) {
      await global.db.delete(`/${t}?id=gte.`).catch(() => {});
    }
    await global.db.delete('/settings?id=eq.1').catch(() => {});

    // 2. Réinsérer dans l'ordre FK
    const results: Record<string, { ok: number; fail: number }> = {};

    async function insertMany(table: string, items: any[]) {
      let ok = 0, fail = 0;
      for (const item of items) {
        try {
          await global.db.post(`/${table}`, item);
          ok++;
        } catch (e: any) {
          fail++;
          console.error(`[restore] ${table} insert fail:`, e?.response?.data || e?.message);
        }
      }
      results[table] = { ok, fail };
    }

    await insertMany('cars',               data.cars               || []);
    await insertMany('customers',          data.customers          || []);
    await insertMany('contracts',          data.contracts          || []);
    await insertMany('contract_lines',     data.contract_lines     || []);
    await insertMany('invoices',           data.invoices           || []);
    await insertMany('invoice_lines',      data.invoice_lines      || []);
    await insertMany('invoice_schedule',   data.invoice_schedule   || []);
    await insertMany('payments',           data.payments           || []);
    await insertMany('maintenance_costs',  data.maintenance_costs  || []);
    await insertMany('vignettes',          data.vignettes          || []);
    await insertMany('reservations',       data.reservations       || []);
    await insertMany('insurances',         data.insurances         || []);
    await insertMany('leasing_contracts',  data.leasing_contracts  || []);
    await insertMany('quotes',             data.quotes             || []);
    await insertMany('quote_lines',        data.quote_lines        || []);
    await insertMany('inspections',        data.inspections        || []);
    await insertMany('inspection_details', data.inspection_details || []);

    // 3. Restaurer la configuration des souches
    if (config?.number_sequences?.length) {
      for (const seq of config.number_sequences) {
        await global.db.patch(
          `/number_sequences?id=eq.${encodeURIComponent(seq.id)}`,
          { last_number: seq.last_number || 0, last_year: seq.last_year || null },
          { headers: { Prefer: 'return=minimal' } }
        ).catch(() => {});
      }
    }

    // 4. Restaurer les paramètres
    if (config?.settings) {
      await global.db.post(
        '/settings?on_conflict=id',
        config.settings,
        { headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } }
      ).catch(() => {});
    }

    const totalOk   = Object.values(results).reduce((s, r) => s + r.ok,   0);
    const totalFail = Object.values(results).reduce((s, r) => s + r.fail,  0);

    res.json({ success: true, results, summary: { ok: totalOk, fail: totalFail } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
