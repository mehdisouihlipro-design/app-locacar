// src/backend/routes/data-management.routes.ts
import { Router, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { stampCreate, stampUpdate } from '../utils/audit';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType = 'string' | 'number' | 'integer' | 'date' | 'enum';

interface ColumnDef {
  field: string;       // CSV header (= export header)
  dbCol: string;       // Supabase column name
  label: string;       // human-readable for error messages
  required: boolean;
  type: FieldType;
  enumValues?: string[];
  exportOnly?: boolean; // present in export but ignored on import (computed/FK)
  importOnly?: boolean; // used only for FK resolution, not stored as-is
}

interface EntityDef {
  label: string;
  description: string;
  table: string;
  naturalKey: string[];          // dbCol names for deduplication
  naturalKeyFromCSV?: string[];  // CSV field names (if different from dbCol)
  resolveCarId?: boolean;        // if true, resolve car_plate → car_id before insert
  columns: ColumnDef[];
}

// ── Entity catalog ─────────────────────────────────────────────────────────────

const ENTITIES: Record<string, EntityDef> = {

  customers: {
    label: 'Clients',
    description: 'Référentiel des clients (particuliers et entreprises)',
    table: 'customers',
    naturalKey: ['phone'],
    columns: [
      { field: 'name',        dbCol: 'name',        label: 'Nom',              required: true,  type: 'string' },
      { field: 'phone',       dbCol: 'phone',       label: 'Téléphone',        required: false, type: 'string' },
      { field: 'email',       dbCol: 'email',       label: 'Email',            required: false, type: 'string' },
      { field: 'address',     dbCol: 'address',     label: 'Adresse',          required: false, type: 'string' },
      { field: 'city',        dbCol: 'city',        label: 'Ville',            required: false, type: 'string' },
      { field: 'postal_code', dbCol: 'postal_code', label: 'Code postal',      required: false, type: 'string' },
      { field: 'country',     dbCol: 'country',     label: 'Pays',             required: false, type: 'string' },
      { field: 'id_number',   dbCol: 'id_number',   label: 'N° pièce identité',required: false, type: 'string' },
      { field: 'notes',       dbCol: 'notes',       label: 'Notes',            required: false, type: 'string' },
    ],
  },

  cars: {
    label: 'Véhicules',
    description: 'Parc automobile — un véhicule = une immatriculation',
    table: 'cars',
    naturalKey: ['plate'],
    columns: [
      { field: 'plate',             dbCol: 'plate',             label: 'Immatriculation',  required: true,  type: 'string' },
      { field: 'brand',             dbCol: 'brand',             label: 'Marque',           required: true,  type: 'string' },
      { field: 'model',             dbCol: 'model',             label: 'Modèle',           required: true,  type: 'string' },
      { field: 'color',             dbCol: 'color',             label: 'Couleur',          required: false, type: 'string' },
      { field: 'vin',               dbCol: 'vin',               label: 'N° châssis (VIN)', required: false, type: 'string' },
      { field: 'registration_number',dbCol:'registration_number',label:'N° carte grise',   required: false, type: 'string' },
      { field: 'registration_date', dbCol: 'registration_date', label: 'Date 1ère immat.', required: false, type: 'date' },
      { field: 'fuel_type',         dbCol: 'fuel_type',         label: 'Carburant',        required: false, type: 'enum', enumValues: ['essence','diesel','hybride','electrique','gpl'] },
      { field: 'odometer_km',       dbCol: 'odometer_km',       label: 'Kilométrage',      required: false, type: 'integer' },
      { field: 'status',            dbCol: 'status',            label: 'Statut',           required: false, type: 'enum', enumValues: ['disponible','reserve','en_location','maintenance','indisponible'] },
      { field: 'purchase_price',    dbCol: 'purchase_price',    label: 'Prix d\'achat',    required: false, type: 'number' },
      { field: 'purchase_date',     dbCol: 'purchase_date',     label: 'Date d\'achat',    required: false, type: 'date' },
      { field: 'location',          dbCol: 'location',          label: 'Emplacement',      required: false, type: 'string' },
      { field: 'owner_name',        dbCol: 'owner_name',        label: 'Propriétaire',     required: false, type: 'string' },
      { field: 'notes',             dbCol: 'notes',             label: 'Notes',            required: false, type: 'string' },
    ],
  },

  insurances: {
    label: 'Assurances',
    description: 'Contrats d\'assurance par véhicule',
    table: 'insurances',
    naturalKey: ['car_plate', 'policy_number'],
    resolveCarId: true,
    columns: [
      { field: 'car_plate',          dbCol: 'car_plate',          label: 'Immatriculation',  required: true,  type: 'string' },
      { field: 'insurance_company',  dbCol: 'insurance_company',  label: 'Compagnie',        required: false, type: 'string' },
      { field: 'policy_number',      dbCol: 'policy_number',      label: 'N° police',        required: true,  type: 'string' },
      { field: 'coverage_type',      dbCol: 'coverage_type',      label: 'Type couverture',  required: false, type: 'string' },
      { field: 'start_date',         dbCol: 'start_date',         label: 'Date début',       required: false, type: 'date' },
      { field: 'end_date',           dbCol: 'end_date',           label: 'Date fin',         required: false, type: 'date' },
      { field: 'monthly_amount',     dbCol: 'monthly_amount',     label: 'Montant mensuel',  required: false, type: 'number' },
      { field: 'currency',           dbCol: 'currency',           label: 'Devise',           required: false, type: 'string' },
      { field: 'monthly_amount_tnd', dbCol: 'monthly_amount_tnd', label: 'Montant TND',      required: false, type: 'number' },
      { field: 'status',             dbCol: 'status',             label: 'Statut',           required: false, type: 'enum', enumValues: ['active','expiree','resiliee'] },
      { field: 'notes',              dbCol: 'notes',              label: 'Notes',            required: false, type: 'string' },
    ],
  },

  leasing_contracts: {
    label: 'Leasings',
    description: 'Contrats de leasing par véhicule',
    table: 'leasing_contracts',
    naturalKey: ['car_plate', 'contract_number'],
    resolveCarId: true,
    columns: [
      { field: 'car_plate',          dbCol: 'car_plate',          label: 'Immatriculation',  required: true,  type: 'string' },
      { field: 'leasing_company',    dbCol: 'leasing_company',    label: 'Société de leasing',required: false, type: 'string' },
      { field: 'contract_number',    dbCol: 'contract_number',    label: 'N° contrat',       required: true,  type: 'string' },
      { field: 'start_date',         dbCol: 'start_date',         label: 'Date début',       required: false, type: 'date' },
      { field: 'end_date',           dbCol: 'end_date',           label: 'Date fin',         required: false, type: 'date' },
      { field: 'monthly_amount',     dbCol: 'monthly_amount',     label: 'Mensualité',       required: false, type: 'number' },
      { field: 'currency',           dbCol: 'currency',           label: 'Devise',           required: false, type: 'string' },
      { field: 'monthly_amount_tnd', dbCol: 'monthly_amount_tnd', label: 'Montant TND',      required: false, type: 'number' },
      { field: 'status',             dbCol: 'status',             label: 'Statut',           required: false, type: 'enum', enumValues: ['active','termine','resilie'] },
      { field: 'notes',              dbCol: 'notes',              label: 'Notes',            required: false, type: 'string' },
    ],
  },

  vignettes: {
    label: 'Vignettes',
    description: 'Vignettes fiscales annuelles par véhicule',
    table: 'vignettes',
    naturalKey: ['car_plate', 'fiscal_year'],
    resolveCarId: true,
    columns: [
      { field: 'car_plate',       dbCol: 'car_plate',       label: 'Immatriculation', required: true,  type: 'string' },
      { field: 'fiscal_year',     dbCol: 'fiscal_year',     label: 'Année fiscale',   required: true,  type: 'integer' },
      { field: 'amount_original', dbCol: 'amount_original', label: 'Montant',         required: false, type: 'number' },
      { field: 'currency',        dbCol: 'currency',        label: 'Devise',          required: false, type: 'string' },
      { field: 'amount_tnd',      dbCol: 'amount_tnd',      label: 'Montant TND',     required: false, type: 'number' },
      { field: 'due_date',        dbCol: 'due_date',        label: 'Date échéance',   required: false, type: 'date' },
      { field: 'paid_date',       dbCol: 'paid_date',       label: 'Date paiement',   required: false, type: 'date' },
      { field: 'status',          dbCol: 'status',          label: 'Statut',          required: false, type: 'enum', enumValues: ['a_payer','paye','en_retard'] },
      { field: 'notes',           dbCol: 'notes',           label: 'Notes',           required: false, type: 'string' },
    ],
  },

  maintenance_costs: {
    label: 'Maintenance',
    description: 'Historique des coûts de maintenance par véhicule',
    table: 'maintenance_costs',
    naturalKey: ['car_plate', 'date', 'type'],
    resolveCarId: true,
    columns: [
      { field: 'car_plate',       dbCol: 'car_plate',       label: 'Immatriculation', required: true,  type: 'string' },
      { field: 'date',            dbCol: 'date',            label: 'Date',            required: true,  type: 'date' },
      { field: 'type',            dbCol: 'type',            label: 'Type',            required: false, type: 'enum', enumValues: ['routine','reparation','inspection','pieces','nettoyage','autre'] },
      { field: 'amount_original', dbCol: 'amount_original', label: 'Montant',         required: false, type: 'number' },
      { field: 'currency',        dbCol: 'currency',        label: 'Devise',          required: false, type: 'string' },
      { field: 'amount_tnd',      dbCol: 'amount_tnd',      label: 'Montant TND',     required: false, type: 'number' },
      { field: 'status',          dbCol: 'status',          label: 'Statut',          required: false, type: 'enum', enumValues: ['paye','a_payer','en_attente'] },
      { field: 'note',            dbCol: 'note',            label: 'Note',            required: false, type: 'string' },
    ],
  },

};

// ── Helpers ────────────────────────────────────────────────────────────────────

function validateCell(
  value: string | undefined,
  col: ColumnDef,
  rowIndex: number
): string | null {
  const v = (value || '').trim();
  if (col.required && !v) return `Ligne ${rowIndex} — "${col.label}" est obligatoire`;
  if (!v) return null;

  if (col.type === 'number') {
    if (isNaN(Number(v))) return `Ligne ${rowIndex} — "${col.label}" : valeur numérique attendue (reçu: "${v}")`;
  }
  if (col.type === 'integer') {
    if (!Number.isInteger(Number(v))) return `Ligne ${rowIndex} — "${col.label}" : entier attendu (reçu: "${v}")`;
  }
  if (col.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return `Ligne ${rowIndex} — "${col.label}" : format AAAA-MM-JJ attendu (reçu: "${v}")`;
  }
  if (col.type === 'enum' && col.enumValues) {
    if (!col.enumValues.includes(v)) {
      return `Ligne ${rowIndex} — "${col.label}" : valeur "${v}" non reconnue (valeurs acceptées: ${col.enumValues.join(', ')})`;
    }
  }
  return null;
}

function rowToDbObject(row: Record<string, string>, cols: ColumnDef[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const col of cols) {
    if (col.exportOnly) continue;
    const v = (row[col.field] || '').trim();
    if (!v) { obj[col.dbCol] = null; continue; }
    if (col.type === 'number')  { obj[col.dbCol] = Number(v); continue; }
    if (col.type === 'integer') { obj[col.dbCol] = parseInt(v, 10); continue; }
    obj[col.dbCol] = v;
  }
  return obj;
}

function buildCsvRow(record: Record<string, unknown>, cols: ColumnDef[]): string {
  return cols.map(col => {
    const v = record[col.dbCol];
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(';') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(';');
}

// ── GET /entities ─────────────────────────────────────────────────────────────

router.get('/entities', async (_req: AuthRequest, res: Response) => {
  try {
    const results = await Promise.all(
      Object.entries(ENTITIES).map(async ([key, def]) => {
        const r = await global.db.get(`/${def.table}?select=id`);
        return { key, label: def.label, description: def.description, count: (r.data || []).length };
      })
    );
    res.json({ success: true, data: results });
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── GET /:entity/template ─────────────────────────────────────────────────────

router.get('/:entity/template', (req: AuthRequest, res: Response) => {
  const def = ENTITIES[req.params.entity];
  if (!def) return res.status(404).json({ success: false, message: 'Entité inconnue.' });

  const importCols = def.columns.filter(c => !c.exportOnly);
  const header = importCols.map(c => c.field).join(';');

  const exampleValues: Record<FieldType, string> = {
    string: 'texte_exemple', number: '100.00', integer: '2024',
    date: '2024-01-15', enum: importCols.find(c => c.type === 'enum')?.enumValues?.[0] || 'valeur',
  };
  const example = importCols.map(c =>
    c.type === 'enum' ? (c.enumValues?.[0] || '') : exampleValues[c.type]
  ).join(';');

  const enumLegend = importCols
    .filter(c => c.type === 'enum' && c.enumValues)
    .map(c => `# ${c.field} : valeurs acceptées = ${c.enumValues!.join(' | ')}`)
    .join('\n');

  const csv = [
    `# Template import — ${def.label}`,
    `# Colonnes obligatoires : ${importCols.filter(c => c.required).map(c => c.field).join(', ')}`,
    `# Format dates : AAAA-MM-JJ`,
    enumLegend,
    header,
    example,
  ].filter(Boolean).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.entity}_template.csv"`);
  res.send('﻿' + csv); // BOM UTF-8 pour Excel
});

// ── GET /:entity/export ───────────────────────────────────────────────────────

router.get('/:entity/export', async (req: AuthRequest, res: Response) => {
  const def = ENTITIES[req.params.entity];
  if (!def) return res.status(404).json({ success: false, message: 'Entité inconnue.' });

  try {
    const r = await global.db.get(`/${def.table}?select=*&order=created_at.asc`);
    const records: Record<string, unknown>[] = r.data || [];

    const header = def.columns.filter(c => !c.importOnly).map(c => c.field).join(';');
    const rows = records.map(rec => buildCsvRow(rec, def.columns.filter(c => !c.importOnly)));

    const csv = [header, ...rows].join('\n');
    const filename = `${req.params.entity}_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv);
  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

// ── POST /:entity/import ──────────────────────────────────────────────────────

router.post('/:entity/import', upload.single('file'), async (req: AuthRequest, res: Response) => {
  const def = ENTITIES[req.params.entity];
  if (!def) return res.status(404).json({ success: false, message: 'Entité inconnue.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier reçu.' });

  const dryRun     = req.query.dry_run     === 'true';
  const skipErrors = req.query.skip_errors === 'true';

  try {
    // 1. Parse CSV (ignore comment lines starting with #)
    const raw = req.file.buffer.toString('utf-8').replace(/^﻿/, '');
    const lines = raw.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    const cleanCsv = lines.join('\n');

    let records: Record<string, string>[];
    try {
      records = parse(cleanCsv, {
        delimiter: ';', columns: true, skip_empty_lines: true, trim: true, relax_column_count: true,
      });
    } catch (parseErr: any) {
      return res.status(400).json({ success: false, message: `Erreur de parsing CSV : ${parseErr.message}` });
    }

    if (!records.length) return res.status(400).json({ success: false, message: 'Le fichier ne contient aucune ligne de données.' });

    const importCols = def.columns.filter(c => !c.exportOnly);

    // 2. Validate all rows
    const errors: { row: number; field: string; message: string }[] = [];
    const validRows: { rowIndex: number; obj: Record<string, unknown> }[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowIndex = i + 2; // +2 : line 1 = header
      let rowValid = true;

      for (const col of importCols) {
        const err = validateCell(row[col.field], col, rowIndex);
        if (err) { errors.push({ row: rowIndex, field: col.field, message: err }); rowValid = false; }
      }

      if (rowValid) validRows.push({ rowIndex, obj: rowToDbObject(row, importCols) });
    }

    // 3. If there are errors and skip_errors=false → abort
    if (errors.length && !skipErrors) {
      return res.status(422).json({
        success: false,
        message: `${errors.length} erreur(s) de validation. Corrigez le fichier ou utilisez skip_errors=true.`,
        errors, stats: { total: records.length, valid: validRows.length, invalid: errors.length },
      });
    }

    // 4. Dry run → return report without writing
    if (dryRun) {
      return res.json({
        success: true, dryRun: true,
        message: `Validation OK : ${validRows.length} ligne(s) seraient importées.`,
        errors, stats: { total: records.length, valid: validRows.length, invalid: errors.length },
      });
    }

    // 5. Resolve car_plate → car_id (for entities that need it)
    let carMap: Record<string, string> = {};
    if (def.resolveCarId) {
      const carsRes = await global.db.get('/cars?select=id,plate');
      (carsRes.data || []).forEach((c: any) => { carMap[c.plate] = c.id; });
    }

    // 6. Load existing records for natural key deduplication
    const existingRes = await global.db.get(`/${def.table}?select=*`);
    const existing: Record<string, unknown>[] = existingRes.data || [];

    function naturalKeyOf(rec: Record<string, unknown>): string {
      return def.naturalKey.map(k => String(rec[k] || '')).join('||');
    }
    const existingMap = new Map<string, Record<string, unknown>>();
    for (const rec of existing) existingMap.set(naturalKeyOf(rec), rec);

    // 7. Upsert valid rows
    let imported = 0, updated = 0, importErrors: { row: number; message: string }[] = [];

    for (const { rowIndex, obj } of validRows) {
      try {
        // Resolve car_id from car_plate
        if (def.resolveCarId) {
          const plate = String(obj['car_plate'] || '');
          const carId = carMap[plate];
          if (!carId) {
            importErrors.push({ row: rowIndex, message: `Véhicule "${plate}" introuvable en base.` });
            continue;
          }
          obj['car_id'] = carId;
        }

        const nk = def.naturalKey.map(k => String(obj[k] || '')).join('||');
        const existingRec = existingMap.get(nk);

        if (existingRec) {
          // UPDATE
          await global.db.patch(
            `/${def.table}?id=eq.${existingRec['id']}`,
            stampUpdate(obj, req),
            { headers: { Prefer: 'return=minimal' } }
          );
          updated++;
        } else {
          // INSERT
          await global.db.post(
            `/${def.table}`,
            stampCreate({ id: uuidv4(), ...obj }, req),
            { headers: { Prefer: 'return=minimal' } }
          );
          imported++;
        }
      } catch (dbErr: any) {
        importErrors.push({ row: rowIndex, message: `Erreur base de données : ${dbErr?.message || dbErr}` });
      }
    }

    const allErrors = [...errors, ...importErrors];
    res.json({
      success: true,
      message: `Import terminé : ${imported} créés, ${updated} mis à jour, ${allErrors.length} erreur(s).`,
      stats: { total: records.length, imported, updated, skipped: errors.length, dbErrors: importErrors.length },
      errors: allErrors,
    });

  } catch (err) { res.status(500).json({ success: false, error: String(err) }); }
});

export default router;
