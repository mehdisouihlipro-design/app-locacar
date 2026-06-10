-- LocaCar Database Schema
-- PostgreSQL 15+

-- Settings table (global configuration)
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
  -- Personnalisation (white-label)
  company_name VARCHAR(120),
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Users table for authentication and role management
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

-- Audit logs for user actions and administration
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity VARCHAR(100),
  entity_id VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
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

-- Cars table
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

-- Reservations table
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

-- Contracts table
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

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  contract_id VARCHAR(50) REFERENCES contracts(id) ON UPDATE CASCADE,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES invoices(id) ON UPDATE CASCADE,
  contract_id VARCHAR(50) REFERENCES contracts(id) ON UPDATE CASCADE,
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

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES invoices(id) ON UPDATE CASCADE,
  customer_id VARCHAR(50) REFERENCES customers(id),
  amount_requested DECIMAL(15, 2),
  amount_received DECIMAL(15, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'en_cours',
  collection_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Costs table
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

-- Insurances table
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

-- Insurance Installments table
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

-- Leasing Contracts table
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

-- Leasing Installments table
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

-- Vignettes table
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

-- Inspections (Etat des lieux) table
CREATE TABLE IF NOT EXISTS inspections (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'sortie',
  contract_id VARCHAR(50) REFERENCES contracts(id) ON UPDATE CASCADE,
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

-- Inspection Details (checklist points) table
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

-- GPS Tracking table (for real-time GPS data)
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_cars_plate ON cars(plate);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_car ON reservations(car_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_car ON contracts(car_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_car ON maintenance_costs(car_id);
CREATE INDEX IF NOT EXISTS idx_inspections_car ON inspections(car_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_car ON gps_tracking(car_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_time ON gps_tracking(tracked_at);


