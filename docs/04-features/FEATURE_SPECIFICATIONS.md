# Feature Specifications
## LocaCar Application

**Version**: 1.0  
**Last Updated**: May 2026

---

## 1. Module Overview

The LocaCar application consists of 5 major modules, each handling specific business domains:

```
┌─────────────────────────────────────────────────────┐
│         LocaCar Feature Architecture                  │
├──────────────┬────────────────┬───────────┬──────┬──┤
│   Fleet      │   Rental       │ Financial │ Admin│RT│
│   Management │   Operations   │ Management│Panel │M│
└──────────────┴────────────────┴───────────┴──────┴──┘
```

---

## 2. Module 1: Fleet Management

### 2.1 Vehicle Inventory Management

**Feature ID**: FM-001  
**Module**: Fleet Management  
**Users**: Admin, Agency Manager, Fleet Supervisor

#### Description
Comprehensive vehicle inventory system supporting owned and subcontractor vehicles with complete master data management.

#### Requirements

**2.1.1 Vehicle Registration**
- Add new vehicles to inventory
- Specify vehicle type, brand, model
- Record VIN, registration number, license plate
- Attach supporting documents (registration certificate, insurance)
- Support vehicle photos (multiple angles)

**2.1.2 Vehicle Master Data**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Registration Number | String | Yes | Unique per agency |
| VIN | String | Yes | International standard |
| License Plate | String | Yes | Format by country |
| Vehicle Type | Enum | Yes | Sedan, SUV, Truck, Van |
| Color | String | No | For identification |
| Year Manufactured | Integer | No | For depreciation |
| Engine Capacity | String | No | For insurance |
| Fuel Type | Enum | Yes | Gasoline, Diesel, Electric, Hybrid |

**2.1.3 Vehicle Documents**
- Insurance policy management
- Inspection certificates
- Registration renewal tracking
- Document expiry alerts
- Document upload (PDF, images)

**2.1.4 Bulk Operations**
- Import vehicles from CSV
- Export vehicle list
- Bulk status updates
- Batch document upload

#### User Stories

```
Story 1: Add Single Vehicle
As an Agency Manager
I want to add a new vehicle to my fleet
So that I can track and manage it for rentals

Acceptance Criteria:
- Form with all required fields
- Validation of VIN uniqueness
- Option to upload documents and photos
- Success confirmation with vehicle ID
```

```
Story 2: View Vehicle Catalog
As a Rental Agent
I want to see all available vehicles in my agency
So that I can offer them to customers

Acceptance Criteria:
- List view with filtering and sorting
- Show vehicle type, color, current status
- Display daily rates and availability
- Quick status change option
```

#### API Endpoints

```
POST /api/v1/vehicles
  - Add new vehicle
  - Required: registration_number, vin, license_plate, vehicle_type_id, agency_id

GET /api/v1/vehicles
  - List vehicles (paginated)
  - Filters: agency_id, status, vehicle_type, is_available
  - Sort: -created_at, registration_number

GET /api/v1/vehicles/{vehicle_id}
  - Get vehicle details

PUT /api/v1/vehicles/{vehicle_id}
  - Update vehicle information

DELETE /api/v1/vehicles/{vehicle_id}
  - Soft delete (set is_active=false)

POST /api/v1/vehicles/{vehicle_id}/documents
  - Upload vehicle documents

GET /api/v1/vehicles/types
  - Get all vehicle types
```

---

### 2.2 Vehicle Status Management

**Feature ID**: FM-002  
**Module**: Fleet Management

#### Description
Real-time vehicle status tracking with automatic updates from rental contracts and manual adjustments.

#### Vehicle Status States

```
┌──────────────┐
│  Available   │ ← Ready for rental
└────┬─────────┘
     │ Reservation created
     ↓
┌──────────────┐
│  Reserved    │ ← Awaiting check-out
└────┬─────────┘
     │ Check-out completed
     ↓
┌──────────────┐
│   Rented     │ ← On active rental
└────┬─────────┘
     │ Return inspection started
     ↓
┌──────────────┐
│ In Inspection│ ← Damage assessment
└────┬─────────┘
     │ Inspection completed
     ↓
┌──────────────┐
│ Maintenance  │ ← Repairs/Servicing
└────┬─────────┘
     │ Maintenance completed
     ↓
┌──────────────┐
│ Available    │ ← Ready again
└──────────────┘
```

#### Requirements

**2.2.1 Status Transitions**
- Validate allowed transitions
- Log all status changes with timestamps
- Record who changed status and why
- Update vehicle availability in real-time

**2.2.2 Maintenance Status**
- Track maintenance schedules
- Block vehicle from rentals during maintenance
- Track service history
- Manage preventive maintenance (oil change, tire rotation, etc.)

**2.2.3 Alerts**
- Insurance expiry alerts (30 days before)
- Maintenance overdue alerts
- Vehicle damage alerts
- GPS tracking disconnection alerts

#### API Endpoints

```
POST /api/v1/vehicles/{vehicle_id}/status-change
  - Change vehicle status
  - Required: new_status, reason

GET /api/v1/vehicles/{vehicle_id}/status-history
  - Get status change history (paginated)

POST /api/v1/vehicles/{vehicle_id}/maintenance
  - Schedule maintenance
  - Required: maintenance_type, scheduled_date, notes

GET /api/v1/vehicles/{vehicle_id}/maintenance-history
  - Get maintenance records
```

---

### 2.3 GPS Tracking & Real-time Monitoring

**Feature ID**: FM-003  
**Module**: Fleet Management

#### Description
Real-time GPS tracking for active rentals with historical data and analytics.

#### Requirements

**2.3.1 Real-time Tracking**
- Update GPS location every 30 seconds for active rentals
- Display current location on map
- Show route history
- Calculate distance traveled
- Track average speed

**2.3.2 Historical Tracking**
- Store GPS logs for entire rental period
- Retrieve historical routes
- Export tracking data
- Generate heat maps

**2.3.3 Geofencing**
- Define geographic zones (agencies, cities, territories)
- Alert when vehicle leaves zone
- Track zone entry/exit times
- Report out-of-zone usage

**2.3.4 Alerts & Notifications**
- Speed limit violations
- Geofence breaches
- Unusual activity (movement at unusual hours)
- GPS device offline alerts

#### User Interface

**Map Dashboard**
```
┌─────────────────────────────┐
│  Fleet Location Dashboard    │
├─────────────────────────────┤
│                              │
│  [Map showing vehicles]      │
│  - Rented: 12 vehicles (●)   │
│  - Available: 45 vehicles (○)│
│  - Maintenance: 3 (⚠)        │
│                              │
│  Zoom Level: [slider]        │
│  Time Range: [date selector] │
│                              │
├─────────────────────────────┤
│ Selected: ABC-123            │
│ Location: Downtown Area      │
│ Speed: 60 km/h              │
│ Last Update: 2 min ago       │
└─────────────────────────────┘
```

#### API Endpoints

```
GET /api/v1/vehicles/{vehicle_id}/gps-location
  - Get current vehicle location (real-time)

GET /api/v1/vehicles/{vehicle_id}/gps-history
  - Get GPS trail for date range
  - Filters: start_date, end_date, contract_id

POST /api/v1/gps-zones
  - Create geofence zone
  - Required: name, type, coordinates

GET /api/v1/gps-zones
  - List all zones by agency

WS /ws/gps-tracking
  - WebSocket for real-time updates
  - Subscribe to vehicle or agency
```

---

### 2.4 Vehicle Check-in/Check-out

**Feature ID**: FM-004  
**Module**: Fleet Management

#### Description
Comprehensive vehicle condition documentation at rental start and end with photo evidence.

#### Check-in Process

```
Vehicle Check-in/Check-out Process
────────────────────────────────────

1. Initiate Check
   └─ Scan vehicle QR code / Enter registration
   
2. Verify Location
   └─ GPS geofence verification
   
3. Mileage Recording
   ├─ Start odometer reading
   └─ End odometer reading (for check-out)
   
4. Fuel Level
   ├─ Start fuel percentage
   └─ End fuel percentage
   
5. Vehicle Condition Assessment
   ├─ External (body, paint, windows)
   ├─ Interior (seats, dashboard, carpet)
   ├─ Tires (tread, damage)
   └─ Lights & Equipment
   
6. Damage Documentation
   ├─ Photos (exterior - 6 angles)
   ├─ Photos (interior - 4 angles)
   ├─ Damage description
   └─ Damage assessment (minor/major)
   
7. Electronic Signature
   └─ Customer/Agent signature
   
8. Submit & Create Records
```

#### Requirements

**2.4.1 Data Capture**
- Mileage readings with photo proof
- Fuel level percentage
- Damage assessment (photos)
- Condition checklists (lights, wipers, etc.)
- Location GPS coordinates
- Timestamp recording

**2.4.2 Photo Management**
- Multiple photos (min 10, max 50 per check)
- Auto-upload to cloud storage
- Compression for mobile
- Photo timestamp and GPS tagging
- Damage highlighting/annotation

**2.4.3 Mobile Optimization**
- Offline mode (queue requests)
- Camera integration
- Minimal data usage
- One-handed operation
- Voice commands for notes

**2.4.4 Compliance**
- Digital signature capture
- Signature verification
- Audit trail of all changes
- PDF generation of check report

#### Data Model

```json
{
  "check_id": "uuid",
  "contract_id": "uuid",
  "vehicle_id": "uuid",
  "check_type": "check_in | check_out",
  "check_timestamp": "ISO8601",
  "location": {
    "latitude": 0.0,
    "longitude": 0.0,
    "accuracy_meters": 10
  },
  "mileage": {
    "start": 15000,
    "end": 15050
  },
  "fuel": {
    "start_percent": 100,
    "end_percent": 90
  },
  "condition": {
    "exterior": "good",
    "interior": "excellent",
    "tires": "good",
    "lights": "ok",
    "wipers": "ok"
  },
  "damages": {
    "found": false,
    "description": null,
    "severity": null,
    "photos": []
  },
  "photos": [
    {
      "url": "s3://bucket/check/abc123/001.jpg",
      "type": "exterior_front",
      "timestamp": "ISO8601",
      "gps": { "lat": 0.0, "lng": 0.0 }
    }
  ],
  "checked_by_user_id": "uuid",
  "signature_url": "s3://bucket/signatures/xyz.png"
}
```

#### API Endpoints

```
POST /api/v1/vehicle-checks
  - Create new check (check_in or check_out)
  - Required: contract_id, vehicle_id, check_type

POST /api/v1/vehicle-checks/{check_id}/photos
  - Upload check photos (multipart)

GET /api/v1/vehicle-checks/{check_id}
  - Get check details with all photos

PUT /api/v1/vehicle-checks/{check_id}
  - Update check data (before submission)

POST /api/v1/vehicle-checks/{check_id}/submit
  - Submit check (mark as complete)
```

---

## 3. Module 2: Rental Operations

### 3.1 Contract Management

**Feature ID**: RO-001  
**Module**: Rental Operations

#### Description
Comprehensive rental agreement management including terms, pricing, insurance, and document generation.

#### Contract States

```
Draft
  ↓ (Save & confirm)
Confirmed
  ↓ (Vehicle picked up)
Active
  ↓ (Return inspection completed)
Completed
  ├─ (Any time before execution)
  ↓ (Cancelled)
Cancelled
```

#### Requirements

**3.1.1 Contract Creation**
- Customer selection or new customer
- Vehicle availability check
- Rental period selection
- Insurance selection
- Add-ons/extras selection
- Rate calculation
- Terms & conditions review
- Digital signature

**3.1.2 Contract Terms**
- Rental period (days, hours)
- Daily/hourly rate
- Insurance type (basic, comprehensive, premium)
- Damage liability
- Mileage limits
- Fuel policy (full-to-full, return full)
- Late return penalties
- Cancellation policy

**3.1.3 Pricing Engine**

```
Total Amount Calculation:
─────────────────────────

Base Rental Cost = Daily Rate × Number of Days

Insurance Cost = Insurance Daily Rate × Number of Days

Extras:
  - GPS: $5/day
  - Additional Driver: $10/day
  - Extra Coverage: Variable

Subtotal = Base + Insurance + Extras

Late Fee = Daily Rate × 1.5 × Late Days (if applicable)

Tax = (Base + Insurance + Extras) × Tax Rate

Total = Subtotal + Tax + Late Fee - Discounts
```

**3.1.4 Document Generation**
- PDF contract generation
- Customer name, ID, license
- Vehicle details
- Rental terms
- Pricing breakdown
- Agency branding
- QR code for digital retrieval

#### API Endpoints

```
POST /api/v1/contracts
  - Create new contract (draft)
  - Required: customer_id, vehicle_id, rental_start_date, rental_end_date

GET /api/v1/contracts/{contract_id}
  - Get contract details

PUT /api/v1/contracts/{contract_id}
  - Update contract (until confirmed)

POST /api/v1/contracts/{contract_id}/confirm
  - Confirm contract

POST /api/v1/contracts/{contract_id}/complete
  - Mark contract as completed

POST /api/v1/contracts/{contract_id}/cancel
  - Cancel contract with reason

GET /api/v1/contracts/{contract_id}/pdf
  - Download contract as PDF

POST /api/v1/contracts/{contract_id}/signature
  - Submit digital signature
```

---

### 3.2 Customer Management

**Feature ID**: RO-002  
**Module**: Rental Operations

#### Description
Complete customer lifecycle management with identification, credit assessment, and history tracking.

#### Customer Profile

**Individual Customer**
```
- First Name, Last Name, Date of Birth
- Email, Phone, Alternate Phone
- ID Type (Passport, National ID, Driver's License)
- ID Number, Expiry Date
- Driver's License Number & Expiry
- Address (Country, State, City, Postal Code)
- Nationality
- Risk Classification
```

**Corporate Customer**
```
- Company Name
- Company Registration Number
- VAT Number
- Contact Person (First Name, Last Name)
- Email, Phone
- Billing Address
- Shipping Address
```

#### Requirements

**3.2.1 Customer Registration**
- Capture all required identification
- Validate ID numbers (format, expiry)
- Verify email and phone (OTP)
- Upload ID documents
- Photo capture option
- Duplicate detection

**3.2.2 Risk Classification**
- Risk Score Calculation:
  ```
  Score = Base (50) + 
          Previous Damage History (-10 per incident) +
          Payment Record (+/- 15 for perfect/late payments) +
          Credit Check Result (+/- 20)
  
  Classifications:
  - 80-100: VIP (Best customers)
  - 50-79: Standard (Regular customers)
  - 20-49: High Risk (Require deposit)
  - 0-19: Blocked (No rentals)
  ```

**3.2.3 Rental History**
- View all past rentals
- Filter by date range, vehicle type, agency
- Download rental history
- View invoices and payments

#### API Endpoints

```
POST /api/v1/customers
  - Register new customer
  - Required: email, phone, customer_type

GET /api/v1/customers
  - List customers (paginated)
  - Filters: risk_classification, is_active

GET /api/v1/customers/{customer_id}
  - Get customer profile

PUT /api/v1/customers/{customer_id}
  - Update customer information

GET /api/v1/customers/{customer_id}/rental-history
  - Get rental history

GET /api/v1/customers/{customer_id}/risk-score
  - Get risk assessment
```

---

### 3.3 Reservation System

**Feature ID**: RO-003  
**Module**: Rental Operations

#### Description
Vehicle reservation management with availability checking and hold management.

#### Reservation States

```
Reserved → Active → Completed
       ↘ (Cancelled) ↙ Cancelled
```

#### Requirements

**3.3.1 Availability Calendar**
- Real-time availability view
- Filter by vehicle type, features, agency
- Show booked and available dates
- Color-coded display
- Price variation by date

**3.3.2 Reservation Creation**
- Select date range
- Select vehicle or type
- Customer selection
- Automatic hold (24 hours default)
- Confirmation email

**3.3.3 Reservation Hold**
- Prevent double-booking
- Auto-release if not confirmed
- Extend hold (up to 7 days)
- Manual release option

**3.3.4 Overbooking Prevention**
- Check inventory before allowing booking
- Real-time synchronization
- Queue management for high demand

#### API Endpoints

```
GET /api/v1/availability
  - Check vehicle availability
  - Query: vehicle_id, start_date, end_date

POST /api/v1/reservations
  - Create new reservation (creates hold)
  - Required: customer_id, vehicle_id, rental_date_start, rental_date_end

GET /api/v1/reservations/{reservation_id}
  - Get reservation details

PUT /api/v1/reservations/{reservation_id}
  - Update reservation dates/vehicle

POST /api/v1/reservations/{reservation_id}/confirm
  - Confirm reservation

POST /api/v1/reservations/{reservation_id}/cancel
  - Cancel reservation
```

---

## 4. Module 3: Financial Management

### 4.1 Invoice Management

**Feature ID**: FM-001  
**Module**: Financial Management

#### Description
Automated invoice generation, management, and payment tracking.

#### Invoice States

```
Draft → Issued → Paid
   ↘ Cancelled  ↙
          ↓
      Overdue
```

#### Requirements

**4.1.1 Automatic Invoice Generation**
- Generate when contract completed
- Populate from contract data
- Calculate totals
- Apply taxes
- Generate PDF

**4.1.2 Invoice Components**

```
┌─────────────────────────────────────┐
│         INVOICE #INV-2026-001        │
├─────────────────────────────────────┤
│ Invoice Date: 2026-05-05             │
│ Due Date: 2026-06-04                 │
│                                      │
│ BILL TO:                             │
│ John Doe                             │
│ john@example.com                     │
│ ----                                 │
│ RENTAL DETAILS:                      │
│ Vehicle: Toyota Corolla (ABC-123)    │
│ Dates: 2026-04-01 to 2026-04-05      │
│ ----                                 │
│ LINE ITEMS:                          │
│ Base Rental (4 days × $80):  $320    │
│ Insurance (4 days × $15):     $60    │
│ GPS Rental (4 days × $5):     $20    │
│                  Subtotal:    $400   │
│ Tax (15%):                    $60    │
│                  ──────────────────  │
│ TOTAL AMOUNT:                $460    │
│                                      │
│ PAYMENT TERMS: Net 30                │
│ PAYMENT METHOD: [Bank Transfer]      │
└─────────────────────────────────────┘
```

**4.1.3 Invoice Line Items**
- Rental charges
- Insurance charges
- Extra services (GPS, additional driver)
- Damage charges (post-inspection)
- Late fees
- Discounts

**4.1.4 Invoice Variants**
- Standard invoice
- Credit note (refund)
- Debit note (additional charges)
- Recurring invoices (for multi-day rentals)

**4.1.5 Regles de calcul HT ⇄ TTC (Tunisie)**

Le tarif saisi à la création du contrat (`rate`) est considéré comme le prix **HT** (hors taxes). À chaque génération de facture (location courte = 1 facture, location longue = 1 facture par mensualité de 30 jours), le système calcule automatiquement la ventilation et le montant **TTC** facturé au client, à partir de paramètres réglables dans `Paramètres → Paramètres de facturation` :

- **TVA** : taux en % (par défaut 19 %)
- **Taxe journalière** : montant fixe en TND par jour de location (ex. "2dt/jour", paramétrable)
- **Timbre fiscal** : montant fixe en TND pour toute la location (paramétrable)

Formule (HT → TTC) :
```
TVA            = montant_HT × taux_TVA / 100
Taxe_journaliere = nb_jours × taxe_par_jour
Timbre         = timbre_fiscal
Montant_TTC    = montant_HT + TVA + Taxe_journaliere + Timbre
```

Le sens inverse (TTC → HT) est également disponible — utile pour la modale d'édition de facture quand on souhaite fixer le montant TTC final et en déduire le HT correspondant :
```
Taxe_journaliere = nb_jours × taxe_par_jour
Timbre         = timbre_fiscal
Montant_HT     = (Montant_TTC − Taxe_journaliere − Timbre) / (1 + taux_TVA / 100)
TVA            = Montant_HT × taux_TVA / 100
```

`amountTnd` (et `dueAmountTnd`/`paidAmountTnd`) continuent de représenter le montant **TTC** dû — aucune autre partie de l'application (relances, trésorerie, rapprochement de paiements, KPIs) n'a besoin d'être modifiée. La ventilation est stockée séparément sur la facture : `amountHt`, `vatAmount`, `dailyTaxAmount`, `stampDutyAmount`, ainsi que `rentalDays`, `periodStart`, `periodEnd` (période facturée, utilisés pour la ligne DU/AU/Nb.j du document imprimé).

**4.1.6 Édition et impression de facture**

Depuis l'onglet **Factures**, le bouton **"Facture"** ouvre une modale qui permet de :
- consulter le détail (contrat, client, véhicule, période facturée) ;
- modifier le montant **HT** ou le montant **TTC** — l'autre valeur et la ventilation complète (TVA / taxe journalière / timbre / total TTC) se recalculent en direct, dans les deux sens ;
- visualiser le montant en toutes lettres ("Arrêtée la présente facture à la somme de … dinars") ;
- **Enregistrer** la ventilation choisie (persistée via `PUT /invoices/:id` → Supabase) ;
- **Télécharger le PDF** de la facture, généré via `html2pdf` à partir d'un gabarit reproduisant le format papier de l'agence : en-tête (logo, nom société, adresse, téléphone, RIB, matricule fiscal — issus du white-label et des `Paramètres de facturation`), bloc client, ligne de prestation (Contrat | Désignation | Immatriculation | DU | AU | Nb.j | Prix HT | TVA | Prix TTC), bloc de totaux (Total HT / TVA / Taxe journalière / Timbre / Total TTC) et montant en toutes lettres.

#### API Endpoints

```
POST /api/v1/invoices
  - Create invoice (usually automatic from contract)
  - Required: contract_id

GET /api/v1/invoices
  - List invoices (paginated)
  - Filters: agency_id, status, date_range

GET /api/v1/invoices/{invoice_id}
  - Get invoice details

PUT /api/v1/invoices/{invoice_id}
  - Update invoice (if draft)

POST /api/v1/invoices/{invoice_id}/issue
  - Issue invoice (send to customer)

GET /api/v1/invoices/{invoice_id}/pdf
  - Download invoice as PDF

POST /api/v1/invoices/{invoice_id}/email
  - Email invoice to customer
```

---

### 4.2 Payment Processing

**Feature ID**: FM-002  
**Module**: Financial Management

#### Description
Multiple payment method support with reconciliation and fraud detection.

#### Payment Methods

| Method | Type | Details |
|--------|------|---------|
| Cash | In-person | Recorded at agency |
| Credit Card | Online/In-person | Tokenized, PCI-DSS |
| Debit Card | Online/In-person | Tokenized, PCI-DSS |
| Bank Transfer | Online | Reference number tracked |
| Check | In-person | Check number recorded |

#### Requirements

**4.2.1 Payment Recording**
- Record payment method
- Record amount
- Store transaction ID
- Apply to invoice
- Update invoice status

**4.2.2 Partial Payments**
- Support multiple payments per invoice
- Track remaining balance
- Calculate interest on late payments
- Generate payment reminders

**4.2.3 Payment Reconciliation**
- Match transactions to invoices
- Detect unmatched payments
- Generate reconciliation reports
- Variance analysis

**4.2.4 Payment Reminders**
- Automatic email on due date -3 days
- Overdue reminders
- Phone/SMS reminders (optional)
- Legal action tracking

#### API Endpoints

```
POST /api/v1/payments
  - Record payment
  - Required: invoice_id, amount, payment_method

GET /api/v1/payments
  - List payments (paginated)
  - Filters: invoice_id, date_range, status

GET /api/v1/payments/{payment_id}
  - Get payment details

POST /api/v1/invoices/{invoice_id}/payment-reminder
  - Send payment reminder

GET /api/v1/reconciliation
  - Get reconciliation report
  - Query: date_range, agency_id
```

---

### 4.3 Financial Reporting

**Feature ID**: FM-003  
**Module**: Financial Management

#### Description
Comprehensive financial reports and analytics.

#### Report Types

**4.3.1 Revenue Reports**
```
Revenue Summary
───────────────
Period: May 2026
Total Invoiced: $45,000
Total Collected: $42,500
Outstanding: $2,500
Collection Rate: 94.4%

By Agency:
- Downtown Agency: $30,000 (83.8%)
- Airport Agency: $15,000 (16.2%)

By Vehicle Type:
- Sedan: $20,000 (44.4%)
- SUV: $18,000 (40%)
- Van: $7,000 (15.6%)
```

**4.3.2 Outstanding Invoices**
```
Overdue Invoices
────────────────
Total Overdue: $5,200
Invoices: 3

Details:
- INV-001 (30 days): $1,500 (John Doe)
- INV-002 (45 days): $2,000 (ABC Corp)
- INV-003 (15 days): $1,700 (Jane Smith)

Overdue > 60 days: $3,500 (2 invoices)
```

**4.3.3 Expense Reports**
```
Expenses Summary
────────────────
Period: May 2026

Categories:
- Maintenance: $5,000
- Insurance: $3,500
- Fuel: $2,800
- Staff: $8,000
- Other: $1,200
Total: $20,500

ROI = (Revenue - Expenses) / Revenue
    = ($42,500 - $20,500) / $42,500 = 51.8%
```

---

### 4.4 Per-Vehicle Profitability ("Rentabilité")

**Feature ID**: FM-004  
**Module**: Financial Management  
**Users**: Admin, Agency Manager, Fleet Supervisor

#### Description
Dedicated "Rentabilité" tab giving, for each vehicle, the generated revenue, the expenses broken down by category, and the resulting balance — both as an all-time summary table and as a detailed monthly/yearly drill-down.

#### Overview Table (`#rentabilite` tab)
Paginated list of all vehicles with, for each one, the all-time totals:
- Plate, Model
- CA généré (revenue collected on contracts linked to the vehicle)
- Dépenses (sum of maintenance + leasing + insurance + vignette costs)
- Solde (revenue − expenses), shown in green/red depending on sign
- "Détails" action opening the per-vehicle financial detail modal

#### Per-Vehicle Detail Modal (`#carFinanceModal`)
- Year selector to switch the displayed period
- Bar chart (Chart.js) comparing CA généré, total expenses and balance month by month for the selected year
- Monthly breakdown table: Mois | CA généré | Maintenance | Leasing | Assurance | Vignette | Total dépenses | Solde
- Yearly summary table aggregating the same columns across all years with activity

#### Data Sources & Computation (`getCarFinancialLedger(carId)`)
- **Revenue**: `payments` joined to their `contract` (`contract.carId`), bucketed by payment month
- **Maintenance**: `maintenance_costs` filtered by `car_id`, bucketed by date
- **Vignette**: `vignettes` filtered by `car_id`, bucketed by due date
- **Leasing / Insurance**: derived month by month from the active `leasing_contracts` / `insurances` records for the vehicle (`monthly_amount_tnd` × each month between `start_date` and `end_date`) — computed on the fly rather than relying on persisted installment rows, since `leasing_installments`/`insurance_installments` are generated client-side only and not synced to the backend
- Monthly buckets are aggregated into yearly totals; balance = revenue − total expenses at both granularities

#### Related Fix
`loadDataFromAPI` now also fetches `GET /leasing` and `GET /insurances` so leasing and insurance contracts (and therefore their monthly cost) are reloaded from the backend on every login instead of depending on local browser storage.

---

## 5. Module 4: Reporting & Analytics

### 5.1 Business Intelligence Dashboards

**Feature ID**: RP-001  
**Module**: Reporting & Analytics

#### Dashboard Widgets

```
┌─────────────────────────────────────────────────────┐
│         Fleet Management Dashboard                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Total Vehicles: 87]  [Available: 45]              │
│  [Rented: 32]  [Maintenance: 10]                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ Utilization  │  │ Revenue Trend│                 │
│  │ Rate: 73%    │  │ ▲ $45K      │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ Top Vehicle  │  │ Fleet Health  │                 │
│  │ Type: Sedan  │  │ ◐ 89% Good   │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │ Upcoming Maintenance                      │       │
│  │ • Vehicle ABC-123: Oil change (3 days)   │       │
│  │ • Vehicle XYZ-789: Tires (1 week)        │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

#### Key Metrics

**Fleet Metrics**
- Fleet Utilization Rate: (Rented Vehicles / Total Vehicles) × 100
- Average Fleet Age
- Vehicle Downtime
- Maintenance Frequency
- Fuel Consumption

**Financial Metrics**
- Daily Revenue
- Average Rental Value
- Revenue per Vehicle
- Customer Lifetime Value
- Profit Margin

**Operational Metrics**
- Booking Conversion Rate
- Average Rental Duration
- Same-Day Rentals %
- Repeat Customer %
- Damage Rate

---

## 6. Module 5: Multi-Agency Management

### 6.1 Agency Management

**Feature ID**: MA-001  
**Module**: Multi-Agency Management

#### Description
Manage multiple agencies (owned and subcontractor) with commission and cost-sharing rules.

#### Agency Types

**Owned Agency**
- Full inventory control
- Revenue retention
- Direct employee management
- Full access to platform

**Subcontractor Agency**
- Vehicle provided to other agencies
- Commission-based revenue
- Limited platform access
- Vehicle availability control

---

## 7. Feature Roadmap

### Phase 1: MVP (Weeks 1-4)
- [ ] User authentication & authorization
- [ ] Vehicle management
- [ ] Customer management
- [ ] Contract creation
- [ ] Basic invoicing

### Phase 2: Enhanced (Weeks 5-8)
- [ ] GPS tracking
- [ ] Photo documentation (check-in/out)
- [ ] Payment processing
- [ ] Multi-agency support
- [ ] Mobile app (basic)

### Phase 3: Advanced (Weeks 9-12)
- [ ] Reporting & analytics
- [ ] Subcontractor integration
- [ ] Advanced reporting
- [ ] Mobile app (full)
- [ ] Performance optimization

### Phase 4: Optimization (Weeks 13+)
- [ ] Scaling implementation
- [ ] Advanced security
- [ ] International expansion
- [ ] Third-party integrations

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Next Review**: June 2026
