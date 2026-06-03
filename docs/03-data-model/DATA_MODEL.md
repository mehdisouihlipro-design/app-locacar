# Database Schema & Data Model
## LocaCar Application

**Version**: 1.0  
**Last Updated**: May 2026

---

## 1. Database Overview

### 1.1 General Principles
- **Type**: PostgreSQL 14+
- **Encoding**: UTF-8
- **Timezone**: UTC for all timestamps
- **Normalization**: 3NF (Third Normal Form)
- **Multi-tenancy**: Agency-level data isolation

### 1.2 Naming Conventions
- **Tables**: snake_case, plural (e.g., `vehicles`, `contracts`)
- **Columns**: snake_case (e.g., `first_name`, `created_at`)
- **Primary Key**: `{table_singular}_id` (e.g., `vehicle_id`)
- **Foreign Key**: `{referenced_table_singular}_id` (e.g., `agency_id`)
- **Constraints**: Prefix with table name (e.g., `fk_contracts_vehicles`)

---

## 2. Core Tables

### 2.1 AGENCIES Table

```sql
CREATE TABLE agencies (
  agency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name VARCHAR(255) NOT NULL,
  agency_type ENUM('owned', 'subcontractor') NOT NULL,
  parent_agency_id UUID REFERENCES agencies(agency_id) ON DELETE SET NULL,
  
  -- Contact Information
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Location
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  city VARCHAR(100),
  address VARCHAR(255),
  postal_code VARCHAR(20),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Financial
  commission_rate DECIMAL(5,2) DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  tax_id VARCHAR(50),
  bank_account VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

CREATE INDEX idx_agencies_parent ON agencies(parent_agency_id);
CREATE INDEX idx_agencies_active ON agencies(is_active);
```

### 2.2 USERS Table

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Agency Association
  agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- admin, owner, manager, agent, operator, accountant
  
  -- Authentication
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  
  -- Profile
  avatar_url VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT valid_role CHECK (role IN ('admin', 'owner', 'manager', 'agent', 'operator', 'accountant'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_agency ON users(agency_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_deleted ON users(deleted_at);
```

### 2.3 VEHICLE_TYPES Table

```sql
CREATE TABLE vehicle_types (
  vehicle_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- sedan, suv, truck, van, etc.
  
  -- Specifications
  seats INT NOT NULL,
  door_count INT NOT NULL,
  transmission VARCHAR(20), -- manual, automatic
  fuel_type VARCHAR(20), -- gasoline, diesel, electric, hybrid
  
  -- Daily Rates
  base_daily_rate DECIMAL(10,2) NOT NULL,
  insurance_rate_daily DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Capacity
  trunk_volume_liters INT,
  max_luggage INT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_types_category ON vehicle_types(category);
```

### 2.4 VEHICLES Table

```sql
CREATE TABLE vehicles (
  vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types(vehicle_type_id),
  
  -- Identification
  registration_number VARCHAR(50) NOT NULL UNIQUE,
  vin VARCHAR(17) NOT NULL UNIQUE,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  
  -- Physical Attributes
  color VARCHAR(50),
  year_manufactured INT,
  mileage_at_purchase INT DEFAULT 0,
  
  -- Current Status
  status VARCHAR(50) NOT NULL DEFAULT 'available', -- available, reserved, rented, maintenance, inactive
  current_mileage INT NOT NULL DEFAULT 0,
  fuel_level_percent INT DEFAULT 100 CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
  
  -- Location & Tracking
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  gps_last_update TIMESTAMP,
  current_location VARCHAR(255),
  
  -- Documents & Compliance
  insurance_provider VARCHAR(100),
  insurance_policy_number VARCHAR(100),
  insurance_expiry DATE NOT NULL,
  last_inspection_date DATE,
  next_inspection_due DATE,
  inspection_certificate_url VARCHAR(255),
  
  -- Purchase Information
  purchase_price DECIMAL(12,2),
  purchase_date DATE,
  
  -- Maintenance
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  maintenance_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_fuel_level CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
  CONSTRAINT valid_status CHECK (status IN ('available', 'reserved', 'rented', 'maintenance', 'inactive'))
);

CREATE INDEX idx_vehicles_agency ON vehicles(agency_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX idx_vehicles_gps ON vehicles(gps_latitude, gps_longitude);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);
```

### 2.5 CUSTOMERS Table

```sql
CREATE TABLE customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
  
  -- Customer Type
  customer_type VARCHAR(20) NOT NULL, -- individual, corporate
  
  -- Individual Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  date_of_birth DATE,
  
  -- Corporate Information
  company_name VARCHAR(255),
  company_registration_number VARCHAR(50),
  vat_number VARCHAR(50),
  
  -- Contact Information
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  
  -- Address
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  city VARCHAR(100),
  address VARCHAR(255) NOT NULL,
  postal_code VARCHAR(20),
  
  -- Identification
  id_number VARCHAR(50) UNIQUE, -- SSN, Passport, etc.
  id_type VARCHAR(50), -- passport, national_id, drivers_license
  id_expiry DATE,
  
  -- Driving License (if individual)
  driving_license_number VARCHAR(50),
  driving_license_expiry DATE,
  driving_license_country VARCHAR(100),
  
  -- Risk & Classification
  risk_classification VARCHAR(50) DEFAULT 'standard', -- standard, vip, high_risk
  credit_rating INT DEFAULT 50 CHECK (credit_rating >= 0 AND credit_rating <= 100),
  previous_damage_count INT DEFAULT 0,
  
  -- Financial
  preferred_payment_method VARCHAR(50), -- cash, card, check, bank_transfer
  credit_card_token VARCHAR(255), -- Tokenized, not storing actual card
  
  -- Preferences
  preferred_communication VARCHAR(20) DEFAULT 'email', -- email, sms, phone
  language_preference VARCHAR(10) DEFAULT 'en',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  blacklist_reason TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_credit_rating CHECK (credit_rating >= 0 AND credit_rating <= 100)
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_agency ON customers(agency_id);
CREATE INDEX idx_customers_risk ON customers(risk_classification);
CREATE INDEX idx_customers_active ON customers(is_active);
```

### 2.6 CONTRACTS Table

```sql
CREATE TABLE contracts (
  contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(50) NOT NULL UNIQUE,
  
  -- Parties
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id),
  rental_agency_id UUID NOT NULL REFERENCES agencies(agency_id),
  renting_agency_id UUID REFERENCES agencies(agency_id), -- If vehicle from subcontractor
  
  -- Rental Period
  rental_start_date TIMESTAMP NOT NULL,
  rental_end_date TIMESTAMP NOT NULL,
  estimated_mileage INT,
  
  -- Pricing
  daily_rate DECIMAL(10,2) NOT NULL,
  number_of_days INT GENERATED ALWAYS AS (
    EXTRACT(DAY FROM rental_end_date - rental_start_date) + 1
  ) STORED,
  base_rental_cost DECIMAL(12,2) NOT NULL,
  
  -- Insurance
  insurance_type VARCHAR(50), -- basic, comprehensive, premium
  insurance_daily_rate DECIMAL(10,2) DEFAULT 0,
  insurance_total DECIMAL(12,2) DEFAULT 0,
  
  -- Extras
  gps_rental BOOLEAN DEFAULT FALSE,
  gps_cost DECIMAL(10,2) DEFAULT 0,
  additional_driver_count INT DEFAULT 0,
  additional_driver_cost DECIMAL(10,2) DEFAULT 0,
  fuel_option VARCHAR(50) DEFAULT 'full_to_full', -- full_to_full, return_full
  
  -- Damage & Liability
  damage_deposit DECIMAL(12,2) NOT NULL,
  damage_waiver_insurance BOOLEAN DEFAULT FALSE,
  damage_waiver_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Totals
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Status
  contract_status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, confirmed, active, completed, cancelled
  
  -- Signatures & Terms
  signed_date TIMESTAMP,
  signed_by_customer UUID REFERENCES users(user_id),
  signed_by_agent UUID REFERENCES users(user_id) NOT NULL,
  notes TEXT,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_dates CHECK (rental_start_date < rental_end_date)
);

CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_vehicle ON contracts(vehicle_id);
CREATE INDEX idx_contracts_agency ON contracts(rental_agency_id);
CREATE INDEX idx_contracts_status ON contracts(contract_status);
CREATE INDEX idx_contracts_dates ON contracts(rental_start_date, rental_end_date);
```

### 2.7 VEHICLE_CHECKS Table

```sql
CREATE TABLE vehicle_checks (
  check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(contract_id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id),
  
  -- Check Type
  check_type VARCHAR(20) NOT NULL, -- check_in, check_out
  
  -- Location & Time
  check_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  location_name VARCHAR(255),
  
  -- Vehicle Condition
  mileage_start INT,
  mileage_end INT,
  fuel_level_start INT,
  fuel_level_end INT,
  
  -- External Condition
  exterior_condition VARCHAR(20), -- excellent, good, acceptable, damaged
  interior_condition VARCHAR(20),
  windshield_condition VARCHAR(20),
  tires_condition VARCHAR(20),
  
  -- Damage Documentation
  damages_found BOOLEAN DEFAULT FALSE,
  damage_description TEXT,
  
  -- Photos (S3 URLs)
  photo_urls JSONB, -- Array of S3 URLs
  
  -- Checklist Items
  checklist_items JSONB, -- {lights: ok, wipers: ok, ...}
  
  -- Inspector Information
  checked_by UUID NOT NULL REFERENCES users(user_id),
  signature_url VARCHAR(255),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_check_type CHECK (check_type IN ('check_in', 'check_out'))
);

CREATE INDEX idx_vehicle_checks_contract ON vehicle_checks(contract_id);
CREATE INDEX idx_vehicle_checks_vehicle ON vehicle_checks(vehicle_id);
CREATE INDEX idx_vehicle_checks_type ON vehicle_checks(check_type);
CREATE INDEX idx_vehicle_checks_timestamp ON vehicle_checks(check_timestamp);
```

### 2.8 INVOICES Table

```sql
CREATE TABLE invoices (
  invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(contract_id),
  agency_id UUID NOT NULL REFERENCES agencies(agency_id),
  customer_id UUID NOT NULL REFERENCES customers(customer_id),
  
  -- Invoice Information
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Payment Status
  invoice_status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, issued, paid, partially_paid, overdue, cancelled
  paid_amount DECIMAL(12,2) DEFAULT 0,
  payment_due_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - COALESCE(paid_amount, 0)) STORED,
  
  -- Late Payment
  is_overdue BOOLEAN DEFAULT FALSE,
  late_payment_fee DECIMAL(12,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  payment_terms TEXT,
  
  -- Document
  document_url VARCHAR(255), -- PDF file path
  
  -- Audit
  issued_at TIMESTAMP,
  issued_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_contract ON invoices(contract_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_agency ON invoices(agency_id);
CREATE INDEX idx_invoices_status ON invoices(invoice_status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

### 2.9 INVOICE_ITEMS Table

```sql
CREATE TABLE invoice_items (
  invoice_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  
  -- Item Information
  item_description VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- rental, insurance, extra, damage, late_fee
  
  -- Amount
  unit_price DECIMAL(10,2) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  amount DECIMAL(12,2) NOT NULL,
  
  -- Related Data
  reference_id VARCHAR(100), -- contract_id, damage_id, etc.
  
  -- Order
  item_order INT,
  
  CONSTRAINT valid_item_type CHECK (item_type IN ('rental', 'insurance', 'extra', 'damage', 'late_fee'))
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
```

### 2.10 PAYMENTS Table

```sql
CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(customer_id),
  agency_id UUID NOT NULL REFERENCES agencies(agency_id),
  
  -- Payment Information
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(12,2) NOT NULL,
  
  -- Method
  payment_method VARCHAR(50) NOT NULL, -- cash, credit_card, debit_card, bank_transfer, check, other
  
  -- Payment Details
  transaction_id VARCHAR(100), -- External transaction ID
  card_last_four VARCHAR(4),
  bank_reference VARCHAR(100),
  check_number VARCHAR(50),
  
  -- Status
  payment_status VARCHAR(50) NOT NULL DEFAULT 'completed', -- pending, completed, failed, reversed
  
  -- Notes
  notes TEXT,
  
  -- Audit
  recorded_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'))
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

### 2.11 GPS_LOGS Table

```sql
CREATE TABLE gps_logs (
  gps_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(contract_id) ON DELETE SET NULL,
  
  -- Location
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy_meters INT,
  
  -- Telemetry
  speed_kmh INT,
  heading INT,
  altitude INT,
  
  -- Timestamp
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Source
  gps_device_id VARCHAR(100),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gps_logs_vehicle ON gps_logs(vehicle_id);
CREATE INDEX idx_gps_logs_contract ON gps_logs(contract_id);
CREATE INDEX idx_gps_logs_timestamp ON gps_logs(timestamp);
CREATE INDEX idx_gps_logs_location ON gps_logs(latitude, longitude);
```

### 2.12 AUDIT_LOGS Table

```sql
CREATE TABLE audit_logs (
  audit_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  agency_id UUID REFERENCES agencies(agency_id),
  
  -- Action
  entity_type VARCHAR(100), -- users, vehicles, contracts, invoices, etc.
  entity_id VARCHAR(100),
  action VARCHAR(50), -- create, update, delete, view, export
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- IP & User Agent
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at);
```

---

## 3. Enums

```sql
-- Vehicle Status
CREATE TYPE vehicle_status AS ENUM ('available', 'reserved', 'rented', 'maintenance', 'inactive');

-- Contract Status
CREATE TYPE contract_status AS ENUM ('draft', 'confirmed', 'active', 'completed', 'cancelled');

-- Invoice Status
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled');

-- User Role
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'manager', 'agent', 'operator', 'accountant');

-- Payment Method
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other');

-- Customer Type
CREATE TYPE customer_type AS ENUM ('individual', 'corporate');

-- Agency Type
CREATE TYPE agency_type AS ENUM ('owned', 'subcontractor');
```

---

## 4. Views

### 4.1 Contract Summary View

```sql
CREATE VIEW contract_summary AS
SELECT
  c.contract_id,
  c.contract_number,
  cust.email AS customer_email,
  cust.phone AS customer_phone,
  v.registration_number,
  ag.agency_name,
  c.rental_start_date,
  c.rental_end_date,
  c.total_amount,
  c.contract_status,
  COUNT(DISTINCT i.invoice_id) AS invoice_count,
  COALESCE(SUM(p.amount), 0) AS total_paid
FROM
  contracts c
  JOIN customers cust ON c.customer_id = cust.customer_id
  JOIN vehicles v ON c.vehicle_id = v.vehicle_id
  JOIN agencies ag ON c.rental_agency_id = ag.agency_id
  LEFT JOIN invoices i ON c.contract_id = i.contract_id
  LEFT JOIN payments p ON i.invoice_id = p.invoice_id
GROUP BY
  c.contract_id, c.contract_number, cust.email, cust.phone,
  v.registration_number, ag.agency_name, c.rental_start_date,
  c.rental_end_date, c.total_amount, c.contract_status;
```

### 4.2 Financial Summary View

```sql
CREATE VIEW financial_summary AS
SELECT
  DATE(inv.invoice_date) AS invoice_date,
  ag.agency_id,
  ag.agency_name,
  COUNT(DISTINCT inv.invoice_id) AS invoice_count,
  SUM(inv.total_amount) AS total_invoiced,
  SUM(COALESCE(p.paid_amount, 0)) AS total_collected,
  SUM(inv.total_amount - COALESCE(p.paid_amount, 0)) AS total_outstanding,
  COUNT(CASE WHEN inv.invoice_status = 'overdue' THEN 1 END) AS overdue_count,
  SUM(CASE WHEN inv.invoice_status = 'overdue' THEN inv.total_amount - COALESCE(p.paid_amount, 0) ELSE 0 END) AS overdue_amount
FROM
  invoices inv
  JOIN agencies ag ON inv.agency_id = ag.agency_id
  LEFT JOIN (
    SELECT invoice_id, SUM(amount) AS paid_amount
    FROM payments
    WHERE payment_status = 'completed'
    GROUP BY invoice_id
  ) p ON inv.invoice_id = p.invoice_id
GROUP BY
  DATE(inv.invoice_date), ag.agency_id, ag.agency_name;
```

---

## 5. Indexes & Performance

### 5.1 Key Indexes
- **Foreign Keys**: All FK columns indexed
- **Status Fields**: All status/state columns indexed
- **Timestamps**: Common filter columns (created_at, due_date)
- **Search**: Email, phone, registration_number

### 5.2 Composite Indexes
```sql
CREATE INDEX idx_contracts_customer_status ON contracts(customer_id, contract_status);
CREATE INDEX idx_invoices_agency_date ON invoices(agency_id, invoice_date DESC);
CREATE INDEX idx_payments_invoice_status ON payments(invoice_id, payment_status);
```

---

## 6. Constraints & Rules

### 6.1 Business Rules (Constraints)
- Rental dates: start < end
- Insurance expiry: cannot rent if expired
- Commission rate: 0-100%
- Credit rating: 0-100%
- Fuel level: 0-100%

### 6.2 Referential Integrity
- Cascade delete for agencies (deletes users, vehicles, contracts)
- Cascade delete for contracts (deletes checks, invoices)
- Set null for optional foreign keys (parent_agency, renting_agency)

---

## 7. Data Retention Policies

| Entity | Retention | Notes |
|--------|-----------|-------|
| Audit Logs | 3 years | For compliance |
| Completed Contracts | 7 years | For tax purposes |
| GPS Logs | 1 year | For tracking history |
| Deleted Users | 6 months | Soft delete before hard delete |
| Payment Records | 7 years | For financial audit |

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Next Review**: June 2026
