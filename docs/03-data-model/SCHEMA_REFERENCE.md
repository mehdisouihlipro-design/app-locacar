# LocaCar Database Schema Reference

**Version**: 1.0  
**Database**: PostgreSQL 15+  
**Last Updated**: June 2026

> **✅ Phase 1A (BR23, implémenté)** : en plus des colonnes documentées table par table ci-dessous, les 16 tables métier (`customers`, `cars`, `reservations`, `contracts`, `invoices`, `payments`, `collections`, `maintenance_costs`, `insurances`, `insurance_installments`, `leasing_contracts`, `leasing_installments`, `vignettes`, `inspections`, `inspection_details`, `settings`) possèdent désormais des colonnes `created_by VARCHAR(50)` et `updated_by VARCHAR(50)` (piste d'audit, renseignées automatiquement par le backend). Voir section "Évolutions V2 → Colonnes d'audit" pour le détail.

---

## Table of Contents
1. [Overview](#overview)
2. [Global Configuration](#global-configuration)
3. [User Management](#user-management)
4. [Core Entities](#core-entities)
5. [Rental Operations](#rental-operations)
6. [Financial Management](#financial-management)
7. [Vehicle Maintenance](#vehicle-maintenance)
8. [Inspection & State Documentation](#inspection--state-documentation)
9. [GPS Tracking](#gps-tracking)
10. [Indexes](#indexes)
11. [Évolutions V2 (schéma cible)](#évolutions-v2-schéma-cible)

---

## Overview

### Database Principles
- **Type**: PostgreSQL 15+
- **Encoding**: UTF-8
- **Timezone**: UTC for timestamps
- **Normalization**: Third Normal Form (3NF)
- **Data Isolation**: Agency-ready (settings-based multi-agency support)

### Naming Conventions
- **Tables**: snake_case, plural (e.g., `customers`, `contracts`)
- **Columns**: snake_case (e.g., `customer_id`, `created_at`)
- **Primary Keys**: VARCHAR(50) for ID columns
- **Currency Fields**: Store both original currency and TND (Tunisian Dinar) converted amount

---

## Global Configuration

### SETTINGS
Stores global configuration parameters for the entire application.

```sql
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  eur_to_tnd DECIMAL(10, 4) NOT NULL DEFAULT 3.4,
  opening_cash_tnd DECIMAL(15, 2) NOT NULL DEFAULT 0,
  reservation_buffer_hours INTEGER NOT NULL DEFAULT 2,
  -- Regles de facturation (calcul HT <-> TTC)
  vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 19,
  daily_tax_tnd DECIMAL(10, 3) NOT NULL DEFAULT 2,
  stamp_duty_tnd DECIMAL(10, 3) NOT NULL DEFAULT 1,
  -- Coordonnees legales (en-tete des factures)
  company_address TEXT,
  company_phone VARCHAR(50),
  company_rib VARCHAR(50),
  company_rib_label VARCHAR(100),
  company_rib_2 VARCHAR(50),
  company_rib_2_label VARCHAR(100),
  company_tax_id VARCHAR(50),
  -- Piste d'audit (pas de FK : la table users est creee apres settings)
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: 
- `base_currency`: Default currency for financial calculations
- `eur_to_tnd`: EUR to TND exchange rate for conversion
- `opening_cash_tnd`: Initial cash balance
- `reservation_buffer_hours`: Hours between reservations to prevent overlap
- `vat_rate`: Taux de TVA (%) appliqué au calcul HT → TTC des factures (défaut 19)
- `daily_tax_tnd`: Taxe journalière de location en TND ("2dt/jour", paramétrable, défaut 2)
- `stamp_duty_tnd`: Timbre fiscal en TND pour toute la location (paramétrable, défaut 1)
- `company_address`, `company_phone`, `company_tax_id`: Coordonnées légales de l'agence affichées dans l'en-tête des factures imprimées (PDF)
- `company_rib`/`company_rib_label` (RIB n°1) et `company_rib_2`/`company_rib_2_label` (RIB n°2, optionnel) : RIB proposés au choix à la création d'une facture (BR22, implémenté Phase 1A)
- `created_by`/`updated_by` : piste d'audit (BR23, implémenté Phase 1A) — voir section "Colonnes d'audit" ci-dessous

**Note**: Only one record exists in this table (id = 1)

---

## User Management

### USERS
Manages authentication and role-based access control.

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'agent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Roles**:
- `admin`: System administrator
- `manager`: Agency manager
- `agent`: Rental agent
- `accountant`: Financial operations

### AUDIT_LOGS
Tracks all user actions for compliance and debugging.

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity VARCHAR(100),
  entity_id VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
- `action`: CREATE, UPDATE, DELETE, VIEW
- `entity`: Table name (e.g., 'contracts', 'invoices')
- `details`: JSON object with change details

---

## Core Entities

### CUSTOMERS
Stores customer information and contact details.

```sql
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  postal_code VARCHAR(10),
  country VARCHAR(100),
  id_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
- `id_number`: National ID, Passport, or Business Registration Number
- All contact fields are optional for flexibility

### CARS
Represents the vehicle fleet with complete vehicle information.

```sql
CREATE TABLE IF NOT EXISTS cars (
  id VARCHAR(50) PRIMARY KEY,
  plate VARCHAR(20) NOT NULL UNIQUE,
  model VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  vin VARCHAR(50),
  registration_number VARCHAR(50),
  registration_date DATE,
  fuel_type VARCHAR(20),
  color VARCHAR(50),
  purchase_price DECIMAL(15, 2),
  purchase_date DATE,
  odometer_km INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'disponible',
  location VARCHAR(255),
  owner_name VARCHAR(255),
  leasing_status VARCHAR(20),
  notes TEXT,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  gps_speed INTEGER DEFAULT 0,
  gps_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status Values**:
- `disponible`: Available for rental
- `reserve`: Reserved but not yet rented
- `en_location`: Currently rented out
- `maintenance`: Under maintenance
- `indisponible`: Not available

**GPS Fields**: Updated real-time from tracking devices

---

## Rental Operations

### RESERVATIONS
Manages booking requests and holds on vehicles.

```sql
CREATE TABLE IF NOT EXISTS reservations (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  customer_name VARCHAR(255),
  car_plate VARCHAR(20),
  start_date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL DEFAULT '09:00',
  end_date DATE NOT NULL,
  end_time VARCHAR(5) NOT NULL DEFAULT '18:00',
  status VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status Values**:
- `en_attente`: Pending confirmation
- `confirmee`: Confirmed
- `active`: In progress
- `completee`: Finished
- `annulee`: Cancelled

### CONTRACTS
Formal rental agreements with financial terms.

```sql
CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  customer_name VARCHAR(255),
  car_plate VARCHAR(20),
  contract_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'court',
  days INTEGER,
  months INTEGER,
  rate DECIMAL(15, 2),
  rate_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  quotient DECIMAL(15, 2),
  quotient_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  quotient_tnd DECIMAL(15, 2),
  total_amount_original DECIMAL(15, 2),
  total_amount_tnd DECIMAL(15, 2),
  payment_moment VARCHAR(20),
  payment_plan VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Type Values**:
- `court`: Short-term rental (days)
- `long`: Long-term rental (months)

**Payment Moment**:
- `advance`: Full payment upfront
- `departure`: Payment at pickup
- `return`: Payment at return
- `deferred`: Payment after rental

---

## Financial Management

### INVOICES
Billing documents for rental agreements.

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  contract_id VARCHAR(50) REFERENCES contracts(id),
  customer_name VARCHAR(255),
  amount_original DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  amount_tnd DECIMAL(15, 2),
  paid_amount_tnd DECIMAL(15, 2) DEFAULT 0,
  due_amount_tnd DECIMAL(15, 2),
  label VARCHAR(255),
  due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  last_reminder_at TIMESTAMP,
  reminder_count INTEGER DEFAULT 0,
  notes TEXT,
  -- Ventilation HT/TVA/taxe journaliere/timbre (amount_tnd reste le total TTC)
  amount_ht DECIMAL(15, 2) DEFAULT 0,
  vat_amount DECIMAL(15, 2) DEFAULT 0,
  daily_tax_amount DECIMAL(15, 2) DEFAULT 0,
  stamp_duty_amount DECIMAL(15, 2) DEFAULT 0,
  rental_days INTEGER DEFAULT 0,
  period_start DATE,
  period_end DATE,
  -- Lignes de facture multi-contrat/multi-vehicule (1 ligne = 1 contrat + 1 voiture, taxe journaliere par ligne)
  lines JSONB DEFAULT '[]'::jsonb,
  -- RIB choisi a la creation, figé independamment des parametres ulterieurs (BR22)
  rib VARCHAR(50),
  rib_label VARCHAR(100),
  created_by VARCHAR(50) REFERENCES users(id),
  updated_by VARCHAR(50) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status Values**:
- `en_attente`: Awaiting payment
- `partielle`: Partially paid
- `payee`: Fully paid
- `en_retard`: Overdue
- `annulee`: Cancelled

**Ventilation HT/TTC** (calculée automatiquement à la génération de la facture, voir `Paramètres → Paramètres de facturation` pour les taux) :
- `amount_ht`: Montant hors taxes (le tarif du contrat, somme des lignes pour une facture multi-lignes)
- `vat_amount`: Montant de la TVA (somme des `vat_amount` de chaque ligne, `ligne.amount_ht × vat_rate / 100`)
- `daily_tax_amount`: Taxe journalière (somme des `daily_tax_amount` de chaque ligne, `ligne.days × daily_tax_tnd` — donc calculée **par véhicule/par ligne**)
- `stamp_duty_amount`: Timbre fiscal (montant fixe `stamp_duty_tnd`, appliqué **une seule fois pour toute la facture**, jamais par ligne)
- `rental_days`, `period_start`, `period_end`: Durée totale (somme des jours de toutes les lignes) et période globale (min/max des périodes des lignes)
- `amount_tnd` reste le montant **TTC** total dû/encaissé : `amount_ht + vat_amount + daily_tax_amount + stamp_duty_amount`
- `lines`: tableau JSON des lignes de facture, chaque élément = `{ contractId, carPlate, designation, amountOriginal, currency, amountHt, vatAmount, dailyTaxAmount, days, periodStart, periodEnd, lineTtc }`. Une facture créée avant cette fonctionnalité (ou facture mono-ligne classique) a `lines = []` ; le PDF retombe alors sur les champs `contract_id`/`amount_ht`/`rental_days`/`period_start`/`period_end` au niveau facture.
- `rib`/`rib_label` (BR22, implémenté Phase 1A) : copie figée du RIB choisi (`settings.company_rib`/`company_rib_label` ou `company_rib_2`/`company_rib_2_label`) au moment de la création de la facture, imprimée dans le PDF ; non affectée par une modification ultérieure des paramètres.
- `created_by`/`updated_by` (BR23, implémenté Phase 1A) : piste d'audit, voir section "Colonnes d'audit" ci-dessous.

### PAYMENTS
Records individual payment transactions.

```sql
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES invoices(id),
  contract_id VARCHAR(50) REFERENCES contracts(id),
  customer_name VARCHAR(255),
  contract_type VARCHAR(20),
  payment_date DATE NOT NULL,
  amount_original DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  amount_tnd DECIMAL(15, 2),
  method VARCHAR(50),
  reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Payment Methods**:
- `cash`: Physical currency
- `cheque`: Check
- `transfer`: Bank transfer
- `card`: Credit/Debit card
- `online`: Online payment

### COLLECTIONS
Tracks collection efforts for outstanding payments.

```sql
CREATE TABLE IF NOT EXISTS collections (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES invoices(id),
  customer_id VARCHAR(50) REFERENCES customers(id),
  amount_requested DECIMAL(15, 2),
  amount_received DECIMAL(15, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'en_cours',
  collection_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Vehicle Maintenance

### MAINTENANCE_COSTS
Records maintenance and repair expenses.

```sql
CREATE TABLE IF NOT EXISTS maintenance_costs (
  id VARCHAR(50) PRIMARY KEY,
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  car_plate VARCHAR(20),
  type VARCHAR(50),
  date DATE NOT NULL,
  amount_original DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  amount_tnd DECIMAL(15, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'paye',
  note TEXT,
  source_key VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Maintenance Types**:
- `routine`: Regular maintenance
- `repair`: Repairs
- `inspection`: Inspections
- `spare_parts`: Parts replacement
- `cleaning`: Cleaning service

### INSURANCES
Manages vehicle insurance policies.

```sql
CREATE TABLE IF NOT EXISTS insurances (
  id VARCHAR(50) PRIMARY KEY,
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  car_plate VARCHAR(20),
  insurance_company VARCHAR(255),
  policy_number VARCHAR(100),
  start_date DATE,
  end_date DATE,
  monthly_amount DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  monthly_amount_tnd DECIMAL(15, 2),
  coverage_type VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  attachment_name VARCHAR(255),
  attachment_type VARCHAR(50),
  attachment_data BYTEA,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### INSURANCE_INSTALLMENTS
Tracks insurance payment schedules.

```sql
CREATE TABLE IF NOT EXISTS insurance_installments (
  id VARCHAR(50) PRIMARY KEY,
  insurance_id VARCHAR(50) REFERENCES insurances(id),
  due_date DATE NOT NULL,
  amount_original DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  amount_tnd DECIMAL(15, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'a_payer',
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### LEASING_CONTRACTS
Manages vehicle leasing agreements.

```sql
CREATE TABLE IF NOT EXISTS leasing_contracts (
  id VARCHAR(50) PRIMARY KEY,
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  car_plate VARCHAR(20),
  leasing_company VARCHAR(255),
  contract_number VARCHAR(100),
  start_date DATE,
  end_date DATE,
  monthly_amount DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  monthly_amount_tnd DECIMAL(15, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  attachment_name VARCHAR(255),
  attachment_type VARCHAR(50),
  attachment_data BYTEA,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### LEASING_INSTALLMENTS
Payment schedule for leasing contracts.

```sql
CREATE TABLE IF NOT EXISTS leasing_installments (
  id VARCHAR(50) PRIMARY KEY,
  leasing_id VARCHAR(50) REFERENCES leasing_contracts(id),
  due_date DATE NOT NULL,
  amount_original DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  amount_tnd DECIMAL(15, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'a_payer',
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### VIGNETTES
Annual vehicle tax documentation.

```sql
CREATE TABLE IF NOT EXISTS vignettes (
  id VARCHAR(50) PRIMARY KEY,
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  car_plate VARCHAR(20),
  fiscal_year INTEGER NOT NULL,
  amount_original DECIMAL(15, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  amount_tnd DECIMAL(15, 2),
  due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'a_payer',
  paid_date DATE,
  attachment_name VARCHAR(255),
  attachment_type VARCHAR(50),
  attachment_data BYTEA,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Inspection & State Documentation

### INSPECTIONS
Vehicle condition assessments at rental start and end (Etat des lieux).

```sql
CREATE TABLE IF NOT EXISTS inspections (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'sortie',
  contract_id VARCHAR(50) REFERENCES contracts(id),
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  car_plate VARCHAR(20),
  date DATE NOT NULL,
  time VARCHAR(5) NOT NULL DEFAULT '00:00',
  odometer_km INTEGER,
  fuel_level VARCHAR(20),
  interior_cleanliness VARCHAR(20),
  exterior_cleanliness VARCHAR(20),
  condition_note VARCHAR(20),
  observation TEXT,
  global_score DECIMAL(3, 2),
  signature_agent_data BYTEA,
  signature_client_data BYTEA,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Inspection Types**:
- `entree`: Check-in inspection
- `sortie`: Check-out inspection
- `maintenance`: Pre-rental inspection

**Cleanliness Levels**:
- `excellent`: Pristine condition
- `good`: Good condition
- `acceptable`: Acceptable
- `poor`: Needs cleaning

### INSPECTION_DETAILS
Detailed checklist items for each inspection.

```sql
CREATE TABLE IF NOT EXISTS inspection_details (
  id VARCHAR(50) PRIMARY KEY,
  inspection_id VARCHAR(50) NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  point_key VARCHAR(50) NOT NULL,
  rating INTEGER DEFAULT 5,
  observation TEXT,
  photo_name VARCHAR(255),
  photo_type VARCHAR(50),
  photo_data BYTEA,
  media_ref VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Inspection Points** (point_key examples):
- `windshield`: Windshield condition
- `mirrors`: Side/rear mirrors
- `lights`: Headlights/tail lights
- `tires`: Tire condition
- `interior`: Interior cleanliness
- `exterior`: Exterior cleanliness
- `engine`: Engine condition
- `battery`: Battery status

**Rating Scale**: 1-5 (5 = excellent, 1 = poor)

---

## GPS Tracking

### GPS_TRACKING
Real-time GPS location and movement data.

```sql
CREATE TABLE IF NOT EXISTS gps_tracking (
  id VARCHAR(50) PRIMARY KEY,
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed INTEGER,
  accuracy DECIMAL(10, 2),
  altitude DECIMAL(10, 2),
  tracked_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Data Source**: IoT GPS devices in vehicles  
**Frequency**: Updates every 5-10 minutes (configurable)  
**Retention**: Consider archiving old records for performance

---

## Indexes

Performance optimization indexes for common queries:

```sql
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_cars_plate ON cars(plate);
CREATE INDEX idx_cars_status ON cars(status);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_car ON reservations(car_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_car ON contracts(car_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_invoices_contract ON invoices(contract_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_maintenance_car ON maintenance_costs(car_id);
CREATE INDEX idx_inspections_car ON inspections(car_id);
CREATE INDEX idx_inspections_date ON inspections(date);
CREATE INDEX idx_gps_tracking_car ON gps_tracking(car_id);
CREATE INDEX idx_gps_tracking_time ON gps_tracking(tracked_at);
```

---

## Data Flow & Relationships

### Typical Rental Workflow
1. **Customer Created** → Stored in `customers`
2. **Reservation Made** → Entry in `reservations`
3. **Contract Signed** → Entry in `contracts`
4. **Check-Out Inspection** → `inspections` (type: 'sortie')
5. **Invoice Generated** → Entry in `invoices`
6. **Payments Recorded** → Entries in `payments`
7. **Check-In Inspection** → `inspections` (type: 'entree')
8. **Contract Completed** → Status updated to 'completed'

### Currency Management
- All amounts stored in original currency + TND equivalent
- Exchange rates updated in `settings` table
- Conversion ensures consistent reporting

### GPS Tracking Integration
- Real-time updates from IoT devices
- Linked to vehicle via `car_id`
- Enables geofencing and theft prevention

---

## Best Practices

### Queries
- Always use indexed columns in WHERE clauses
- Archive old GPS tracking records periodically
- Use JSONB efficiently for `audit_logs.details`

### Data Integrity
- Foreign key constraints prevent orphaned records
- Cascading deletes configured for inspection details
- All timestamps in UTC for consistency

### Security
- `password_hash` never stored in plaintext
- BYTEA for sensitive attachments (encrypt at application level)
- Audit logs track all modifications

### Performance
- Paginate large result sets
- Archive GPS data older than 6 months
- Use `EXPLAIN ANALYZE` for slow queries

---

## Évolutions V2 (schéma cible)

> Cette section décrit le schéma **cible** pour le lot d'évolutions "V2 — version professionnelle" (cf. `docs/01-specifications/BMAD.md` section 6.5, BR18-BR27, et `docs/04-features/FEATURE_SPECIFICATIONS.md` section 9). Il s'agit d'une spécification : sauf mention contraire (✅ Implémenté), aucune migration n'a encore été créée ni exécutée. Les tables/colonnes ci-dessous complètent ou remplacent celles décrites plus haut.
>
> **✅ Phase 1A (implémentée)** : les colonnes d'audit `created_by`/`updated_by` (BR23) et le second RIB `settings.company_rib_label`/`company_rib_2`/`company_rib_2_label` + `invoices.rib`/`rib_label` (BR22) ont été ajoutées via migration et sont disponibles en production. Le reste de cette section (BR18-21, BR24-27) reste à l'état de spécification cible.

### Colonnes d'audit (toutes les tables métier) — ✅ Implémenté (Phase 1A, BR23)

Toutes les tables métier (`customers`, `cars`, `reservations`, `contracts`, `contract_lines`, `invoices`, `invoice_lines`, `payments`, `collections`, `maintenance_costs`, `insurances`, `insurance_installments`, `leasing_contracts`, `leasing_installments`, `vignettes`, `inspections`, `inspection_details`, `settings`) reçoivent deux colonnes supplémentaires :

```sql
ALTER TABLE <table> ADD COLUMN IF NOT EXISTS created_by VARCHAR(50);
ALTER TABLE <table> ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50);
```

Migration appliquée : `src/backend/migrations/001_phase1a_audit_and_rib2.sql`. **Sans contrainte `FOREIGN KEY` vers `users(id)`** sur les tables existantes (migration sans risque sur des données déjà en place) ; `src/backend/schema.sql` (création de base vierge) ajoute la FK `REFERENCES users(id)` sur les 15 tables créées après `users`, sauf `settings` (créée avant `users`, cf. commentaire dans `schema.sql`).

Renseignées automatiquement par le backend à partir de l'utilisateur authentifié (`req.user.id`, déjà disponible via `AuthRequest`) sur chaque `POST`/`PUT`. Les colonnes `created_at`/`updated_at` existent déjà sur ces tables.

**Tri par défaut** : tous les écrans listent désormais les enregistrements par `created_at DESC` (le plus récent en premier) — voir tri/filtre générique en section 9.7 des Feature Specs (BR24).

### CONTRACTS (entête) — révisé

```sql
CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255),
  contract_date DATE NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'court',
  payment_moment VARCHAR(20),
  payment_plan VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  total_amount_ht DECIMAL(15, 2) DEFAULT 0,
  total_vat_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount_ttc DECIMAL(15, 2) DEFAULT 0,
  total_amount_tnd DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_by VARCHAR(50) REFERENCES users(id),
  updated_by VARCHAR(50) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- `car_id` / `car_plate` / `days` / `months` / `rate` / `quotient*` (actuellement sur `contracts`) migrent vers `contract_lines` ci-dessous (une ligne = un véhicule).
- `total_amount_ht` / `total_vat_amount` / `total_amount_ttc` / `total_amount_tnd` = sommes agrégées des `contract_lines` du contrat (recalculées à chaque ajout/modification/suppression de ligne).
- `status` : `active`, `termine`, `annule`, `brouillon`, `resilie` (au moins une ligne résiliée, BR26).
- Migration de données : chaque contrat existant (mono-véhicule) est converti en 1 entête (`contracts`, champs véhicule retirés) + 1 ligne (`contract_lines`, reprenant `car_id`/`car_plate`/`days`/`months`/`rate`/`quotient*`/dates).

### CONTRACT_LINES (nouvelle table)

```sql
CREATE TABLE IF NOT EXISTS contract_lines (
  id VARCHAR(50) PRIMARY KEY,
  contract_id VARCHAR(50) NOT NULL REFERENCES contracts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  car_plate VARCHAR(20),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days INTEGER,
  months INTEGER,
  rate DECIMAL(15, 2),
  rate_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  quotient DECIMAL(15, 2),
  quotient_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  quotient_tnd DECIMAL(15, 2),
  amount_ht DECIMAL(15, 2) DEFAULT 0,
  vat_amount DECIMAL(15, 2) DEFAULT 0,
  amount_ttc DECIMAL(15, 2) DEFAULT 0,
  amount_tnd DECIMAL(15, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  actual_end_date DATE,
  reservation_id VARCHAR(50) REFERENCES reservations(id),
  created_by VARCHAR(50) REFERENCES users(id),
  updated_by VARCHAR(50) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_contract_line_dates CHECK (period_end >= period_start),
  CONSTRAINT chk_contract_line_actual_end CHECK (actual_end_date IS NULL OR (actual_end_date >= period_start AND actual_end_date <= period_end))
);

CREATE INDEX idx_contract_lines_contract ON contract_lines(contract_id);
CREATE INDEX idx_contract_lines_car ON contract_lines(car_id);
CREATE INDEX idx_contract_lines_period ON contract_lines(car_id, period_start, period_end);

-- Contrôle de chevauchement véhicule/période au niveau base de données (BR19, niveau 3)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE contract_lines ADD CONSTRAINT excl_contract_lines_car_period
  EXCLUDE USING gist (car_id WITH =, daterange(period_start, period_end, '[]') WITH &&)
  WHERE (status = 'active');
```

- `amount_ht` / `vat_amount` / `amount_ttc` : ventilation HT/TVA/TTC de la ligne. `amount_ttc = amount_ht * (1 + vat_rate/100)` (BR18) — **ne comprend pas** la taxe journalière ni le timbre fiscal, qui restent calculés uniquement au niveau des lignes de facture (`invoice_lines`, BR15bis).
- `status` : `brouillon` (ligne créée avec un contrat `brouillon`, non engageante, hors contrôle BR19/BR25), `active`, `termine`, `annule`, `resilie`. La valeur par défaut `'active'` s'applique aux lignes créées avec un contrat déjà `active` ; les lignes créées avec un contrat `brouillon` sont insérées avec `status = 'brouillon'`.
- `actual_end_date` : renseigné uniquement en cas de résiliation anticipée (BR26) ; doit être compris entre `period_start` et `period_end`.
- `reservation_id` : lien vers la réservation recherchée/créée/corrigée selon BR25, couvrant `[period_start, period_end]` ; raccourcie ou annulée lors d'une résiliation. Renseigné **après** la création de la ligne (cf. note d'ordre des opérations ci-dessous).
- L'index `idx_contract_lines_period` (couplé aux `reservations` actives) sert au contrôle de chevauchement véhicule/période (BR19, niveaux 1 et 2 — UI et backend).
- La contrainte `excl_contract_lines_car_period` (BR19, niveau 3) interdit en base deux lignes `status = 'active'` du même `car_id` avec des périodes qui se recouvrent (bornes incluses, `'[]'`). Les lignes `brouillon`, `termine`, `annule`, `resilie` ne sont pas concernées. Nécessite l'extension PostgreSQL `btree_gist`.

> **Ordre des opérations (BR25)** : `contract_lines` est insérée d'abord avec `reservation_id = NULL`. Le backend recherche ensuite une `reservations` existante pour le même `car_id` et la même période : si trouvée, elle est liée (`reservations.contract_line_id = contract_lines.id`) ; sinon une nouvelle réservation est créée (ou une réservation existante à des dates différentes est corrigée) aux dates de la ligne. Enfin `contract_lines.reservation_id` est mis à jour avec l'id de la réservation retenue. Cette séquence est exécutée dans la même transaction que la création de la ligne (cf. fonctions RPC ci-dessous).

### RESERVATIONS — colonne ajoutée

```sql
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS contract_line_id VARCHAR(50) REFERENCES contract_lines(id) ON DELETE CASCADE;
```

- Renseignée par la réservation automatique créée à la création d'une ligne de contrat (BR25). `NULL` pour les réservations manuelles (non liées à un contrat).

### INVOICES (entête) — colonnes ajoutées — ✅ Implémenté (Phase 1A, BR22)

```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rib VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rib_label VARCHAR(100);
```

- `rib` / `rib_label` : copie figée du RIB choisi (BR22) parmi `settings.company_rib`/`settings.company_rib_2` au moment de la création de la facture — volontairement dénormalisé (pas de FK) pour qu'une modification ultérieure des paramètres n'affecte pas les factures déjà émises.
- La colonne `lines JSONB` (introduite par BR15bis) est progressivement remplacée par la table relationnelle `invoice_lines` ci-dessous. Elle est conservée en lecture pour les factures existantes non encore migrées ; une migration de données copiera `lines[]` vers `invoice_lines` avant suppression de la colonne dans une version ultérieure.

### INVOICE_LINES (nouvelle table — remplace `invoices.lines` JSONB)

```sql
CREATE TABLE IF NOT EXISTS invoice_lines (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  contract_id VARCHAR(50) REFERENCES contracts(id) ON UPDATE CASCADE,
  contract_line_id VARCHAR(50) REFERENCES contract_lines(id),
  car_id VARCHAR(50) REFERENCES cars(id),
  car_plate VARCHAR(20),
  designation VARCHAR(255),
  period_start DATE,
  period_end DATE,
  days INTEGER DEFAULT 0,
  amount_original DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  amount_ht DECIMAL(15, 2) DEFAULT 0,
  vat_amount DECIMAL(15, 2) DEFAULT 0,
  daily_tax_amount DECIMAL(15, 2) DEFAULT 0,
  line_ttc DECIMAL(15, 2) DEFAULT 0,
  created_by VARCHAR(50) REFERENCES users(id),
  updated_by VARCHAR(50) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX idx_invoice_lines_contract ON invoice_lines(contract_id);
```

- Reprend la structure des éléments de l'ancien tableau JSON `invoices.lines[]` (BR15bis), en ajoutant `contract_line_id` (BR21) pour tracer la ligne de contrat d'origine et permettre l'auto-remplissage.
- `daily_tax_amount` reste calculé par ligne (BR15bis) ; le timbre fiscal (`invoices.stamp_duty_amount`, au niveau entête) reste compté une seule fois par facture.
- `line_ttc` = `amount_ht + vat_amount + daily_tax_amount` (somme des `line_ttc` + `stamp_duty_amount` = `invoices.amount_tnd`).

### SETTINGS — colonnes ajoutées (second RIB) — ✅ Implémenté (Phase 1A, BR22)

```sql
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_rib_label VARCHAR(100);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_rib_2 VARCHAR(50);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_rib_2_label VARCHAR(100);
```

- `company_rib` (existant) = RIB n°1 ; `company_rib_label` = libellé optionnel (ex. nom de la banque) du RIB n°1.
- `company_rib_2` / `company_rib_2_label` = second RIB optionnel, proposé au choix à la facturation (BR22).

### SETTINGS — contrainte ajoutée (TVA non négative)

```sql
ALTER TABLE settings ADD CONSTRAINT chk_vat_rate_non_negative CHECK (vat_rate >= 0);
```

- La TVA ne peut pas être négative (BR18) : cette contrainte est le filet de sécurité base de données, en complément de la validation du formulaire Paramètres → Paramètres de facturation.

### QUOTES (entête) — nouvelle table

```sql
CREATE TABLE IF NOT EXISTS quotes (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL REFERENCES customers(id),
  customer_name VARCHAR(255),
  quote_date DATE NOT NULL,
  validity_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'brouillon',
  total_amount_ht DECIMAL(15, 2) DEFAULT 0,
  total_vat_amount DECIMAL(15, 2) DEFAULT 0,
  total_amount_ttc DECIMAL(15, 2) DEFAULT 0,
  total_amount_tnd DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  converted_contract_id VARCHAR(50) REFERENCES contracts(id) ON UPDATE CASCADE,
  created_by VARCHAR(50) REFERENCES users(id),
  updated_by VARCHAR(50) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
```

- Reprend la structure entête de `contracts` (BR20), avec en plus `validity_date` (date de validité du devis affichée sur le PDF) et `converted_contract_id`.
- `validity_date` est **obligatoire** (`NOT NULL`, BR27) : aucune valeur par défaut en base — l'application calcule et propose `quote_date + 30 jours` à la création, modifiable par l'utilisateur avant enregistrement.
- `status` : `brouillon`, `envoye`, `valide`, `refuse`, `expire`. Un devis `valide` est lecture seule (`converted_contract_id` renseigné). Transition `envoye → expire` lorsque `validity_date < date du jour` (calculée à l'affichage, persistée à la prochaine action, même mécanisme que `contract_lines.status` `active → termine`).
- `total_amount_ht` / `total_vat_amount` / `total_amount_ttc` / `total_amount_tnd` = sommes agrégées des `quote_lines` (mêmes règles de calcul que `contract_lines`, BR18).

### QUOTE_LINES (nouvelle table)

```sql
CREATE TABLE IF NOT EXISTS quote_lines (
  id VARCHAR(50) PRIMARY KEY,
  quote_id VARCHAR(50) NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  car_id VARCHAR(50) NOT NULL REFERENCES cars(id),
  car_plate VARCHAR(20),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  days INTEGER,
  months INTEGER,
  rate DECIMAL(15, 2),
  rate_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  quotient DECIMAL(15, 2),
  quotient_currency VARCHAR(3) NOT NULL DEFAULT 'TND',
  quotient_tnd DECIMAL(15, 2),
  amount_ht DECIMAL(15, 2) DEFAULT 0,
  vat_amount DECIMAL(15, 2) DEFAULT 0,
  amount_ttc DECIMAL(15, 2) DEFAULT 0,
  amount_tnd DECIMAL(15, 2) DEFAULT 0,
  created_by VARCHAR(50) REFERENCES users(id),
  updated_by VARCHAR(50) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_quote_line_dates CHECK (period_end >= period_start)
);

CREATE INDEX idx_quote_lines_quote ON quote_lines(quote_id);
CREATE INDEX idx_quote_lines_car ON quote_lines(car_id);
```

- Mêmes colonnes que `contract_lines` (BR18), à l'exception de `status`, `actual_end_date` et `reservation_id` : un devis non validé ne bloque pas de véhicule (BR27 — pas de contrôle de chevauchement BR19, pas de réservation auto BR25) et n'a pas de notion de résiliation.
- À la **validation** du devis (BR27), chaque `quote_lines` est copiée vers une nouvelle `contract_lines` (du contrat créé), qui passe alors par les contrôles normaux (BR19/BR25).

### Fonctions RPC — atomicité entête + lignes (BR20bis)

Les opérations multi-tables (entête + lignes) sont implémentées sous forme de fonctions PostgreSQL (`SECURITY INVOKER`, `LANGUAGE plpgsql`), exécutées dans une transaction unique et exposées au backend via PostgREST (`POST /rpc/<nom_fonction>`).

```sql
-- Crée un contrat (entête) + ses lignes en une transaction.
-- Pour chaque ligne : recherche/création/correction de réservation (BR25),
-- puis mise à jour de contract_lines.reservation_id.
-- En cas de conflit BR19 (contrainte EXCLUDE) sur une ligne, rollback complet.
CREATE OR REPLACE FUNCTION create_contract_with_lines(
  p_contract JSONB,       -- champs de l'entête `contracts`
  p_lines JSONB           -- tableau de lignes `contract_lines` (sans id/reservation_id)
) RETURNS JSONB           -- contrat créé avec ses lignes et reservation_id résolus
LANGUAGE plpgsql AS $$ ... $$;

-- Crée une facture (entête) + ses lignes en une transaction.
-- Si p_lines est vide -> exception (BR21 : "Une facture doit contenir au moins une ligne.")
CREATE OR REPLACE FUNCTION create_invoice_with_lines(
  p_invoice JSONB,         -- champs de l'entête `invoices` (incl. rib/rib_label, BR22)
  p_lines JSONB            -- tableau de lignes `invoice_lines`
) RETURNS JSONB            -- facture créée avec ses lignes
LANGUAGE plpgsql AS $$ ... $$;

-- Valide un devis : passe quotes.status -> 'valide', crée un contrat (entête + lignes)
-- à partir de quote_lines via create_contract_with_lines, renseigne
-- quotes.converted_contract_id, et rend le devis lecture seule. Rollback complet en
-- cas d'échec (ex. conflit BR19 sur une des lignes converties).
CREATE OR REPLACE FUNCTION validate_quote(
  p_quote_id VARCHAR(50)
) RETURNS JSONB             -- contrat créé (entête + lignes)
LANGUAGE plpgsql AS $$ ... $$;
```

- Le backend appelle ces fonctions via `POST /rpc/create_contract_with_lines`, `POST /rpc/create_invoice_with_lines`, `POST /rpc/validate_quote` (PostgREST) au lieu d'enchaîner plusieurs `INSERT`/`UPDATE` non transactionnels.
- Le corps `$$ ... $$` (logique métier détaillée) sera écrit lors de la phase de développement ; cette spécification fixe la signature, le périmètre transactionnel et les règles métier (BR19, BR21, BR25, BR27) que chaque fonction doit respecter.
