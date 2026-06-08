# LocaCar Database Schema Reference

**Version**: 1.0  
**Database**: PostgreSQL 15+  
**Last Updated**: June 2026

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
  company_tax_id VARCHAR(50),
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
- `company_address`, `company_phone`, `company_rib`, `company_tax_id`: Coordonnées légales de l'agence affichées dans l'en-tête des factures imprimées (PDF)

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
- `amount_ht`: Montant hors taxes (le tarif du contrat)
- `vat_amount`: Montant de la TVA (`amount_ht × vat_rate / 100`)
- `daily_tax_amount`: Taxe journalière (`rental_days × daily_tax_tnd`)
- `stamp_duty_amount`: Timbre fiscal (montant fixe `stamp_duty_tnd`)
- `rental_days`, `period_start`, `period_end`: Durée et période facturée (ligne DU/AU/Nb.j du document imprimé)
- `amount_tnd` reste le montant **TTC** total dû/encaissé : `amount_ht + vat_amount + daily_tax_amount + stamp_duty_amount`

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
