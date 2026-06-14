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

Pour une **facture multi-lignes** (voir 4.1.7), `computeLineBreakdown(amountHt, days)` applique la même logique TVA/taxe journalière **par ligne** (1 ligne = 1 contrat + 1 véhicule), sans timbre fiscal. Les totaux de la facture (`amountHt`, `vatAmount`, `dailyTaxAmount`, `amountTnd`) sont la somme des lignes, plus le timbre fiscal ajouté **une seule fois** au niveau de la facture.

**4.1.6 Édition et impression de facture**

Depuis l'onglet **Factures**, le bouton **"Facture"** ouvre une modale qui permet de :
- consulter le détail (contrat, client, véhicule, période facturée) ;
- modifier le montant **HT** ou le montant **TTC** global — l'autre valeur et la ventilation complète (TVA / taxe journalière / timbre / total TTC) se recalculent en direct, dans les deux sens ;
- visualiser le montant en toutes lettres ("Arrêtée la présente facture à la somme de … dinars") ;
- **Enregistrer** la ventilation choisie (persistée via `PUT /invoices/:id` → Supabase) ;
- **Télécharger le PDF** de la facture : `generateInvoicePdf` ouvre une nouvelle fenêtre (`window.open`) contenant un gabarit HTML autonome reproduisant le format papier de l'agence (en-tête avec logo/nom société/adresse/téléphone/RIB/matricule fiscal issus du white-label et des `Paramètres de facturation`, bloc client, tableau des lignes de prestation, bloc de totaux, montant en toutes lettres) avec un bouton "Imprimer / Enregistrer en PDF" qui déclenche `window.print()`.

**4.1.7 Création manuelle de facture multi-lignes**

En plus de la génération automatique depuis les contrats, l'onglet **Factures** propose un bouton **"Nouvelle facture"** qui ouvre un formulaire permettant de créer une facture libre (extras, prestations hors-contrat, régularisations, location de plusieurs véhicules sur une même facture, etc.) :
- **Client** (obligatoire) — liste de `state.customers` ;
- **Libellé**, **Devise**, **Date d'échéance** (communs à toute la facture) ;
- une ou plusieurs **lignes de facturation** (bouton "+ Ajouter une ligne"), chacune avec : **Contrat (véhicule)** (optionnel — liste filtrée sur les contrats du client sélectionné, ou "Aucun (ligne libre)"), **Début de période**, **Nombre de jours** et **Montant HT**.

À la création, pour chaque ligne : le montant HT est converti en TND si nécessaire (`convertToTnd`), puis `computeLineBreakdown(amountHt, days)` calcule la TVA et la taxe journalière **de cette ligne** (1 ligne = 1 contrat + 1 véhicule, taxe journalière par véhicule). Les lignes sont stockées telles quelles dans le champ `lines` (JSON) de la facture. Les totaux de la facture sont la somme des `amountHt`/`vatAmount`/`dailyTaxAmount` de toutes les lignes, plus le timbre fiscal ajouté une seule fois (`amount_tnd` = somme + timbre). `rental_days`/`period_start`/`period_end` au niveau facture représentent respectivement la somme des jours et la période globale (min/max) de toutes les lignes. La facture est persistée via `POST /invoices` (champs `amount_ht`/`vat_amount`/`daily_tax_amount`/`stamp_duty_amount`/`rental_days`/`period_start`/`period_end`/`lines`) puis ajoutée à `state.invoices`. Elle apparaît ensuite dans le tableau et peut être éditée/imprimée comme toute autre facture (voir 4.1.6) ; `generateInvoicePdf` détecte la présence de `lines` et affiche une ligne du tableau de prestations par élément (sinon, retombe sur l'affichage mono-ligne historique basé sur `contractId`/`amountHt`/`rentalDays`).

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

## 8. Édition générique des enregistrements (modale double-clic)

### Description
Un double-clic sur une ligne de tableau (Contrats, Factures, Voitures, Clients, Réservations, Paiements, Maintenance, Assurances, Leasing, Vignettes, etc.) ouvre une modale générique (`openRecordEditor`/`saveRecordEditor`) qui permet d'éditer les champs de l'enregistrement. Les champs calculés (totaux, montants TND dérivés, `lines` des factures, etc.) sont affichés en lecture seule.

### Fermeture des écrans détails (croix en haut à droite)
Chaque écran détail/modal de l'application (`recordEditorModal`, `userDetailModal`, `invoiceEditModal`, `settingsModal`, `changePasswordModal`, `inspectionDetailModal`, `carFinanceModal`) affiche une croix `×` en haut à droite (`.modal-close-x`), en plus du bouton "Fermer"/"Annuler" existant. La croix délègue vers le bouton de fermeture existant de la modale (via `data-close-target`), afin de conserver son comportement (ex. `closeRecordEditor`, persistance des paramètres pour `settingsModal`).

### Persistance (conforme à la règle CLAUDE.md)
À l'enregistrement (`saveRecordEditor`), en plus de la mise à jour de `state` + `localStorage`, l'app effectue un `PUT` vers l'API backend pour les entités qui disposent d'une route `PUT /:id` :

| Entité | Route API | Statut |
|---|---|---|
| `contracts` | `PUT /contracts/:id` | ✅ Persisté |
| `invoices` | `PUT /invoices/:id` | ✅ Persisté (inclut `lines`) |
| `cars` | `PUT /cars/:id` | ✅ Persisté |
| `customers` | `PUT /customers/:id` | ✅ Persisté |
| `reservations` | `PUT /reservations/:id` | ✅ Persisté |
| `payments`, `maintenanceCosts`, `vignettes`, `leasingContracts`, `insurances`, `insuranceInstallments`, `leasingInstallments` | aucune route `PUT` | ⚠️ Édition non persistée en base (seulement locale) |

**Limitation connue** : pour les entités sans route `PUT`, une édition via la modale générique ne survit pas à un rechargement (les données reviennent à l'état de la base). Pour rendre ces écrans éditables, il faut ajouter les routes `PUT /:id` correspondantes côté backend (`src/backend/routes/`) puis enregistrer ces entités dans la table `ENTITY_API_PUT` (`worksheet-mini-app/index.html`).

### 8.1 Modification exceptionnelle de l'Id (numéro de contrat / numéro de facture)

Le champ `id` est en lecture seule pour toutes les entités, **sauf** `contracts` et `invoices` où il représente le numéro de contrat / numéro de facture et peut être modifié exceptionnellement.

Lorsque l'utilisateur modifie cet Id et confirme :
1. Validation : nouvel Id non vide et non utilisé par un autre enregistrement.
2. Confirmation explicite (`confirm()`) car l'opération est irréversible et impacte plusieurs tables.
3. Appel `PUT /contracts/:ancienId` ou `PUT /invoices/:ancienId` avec `id: nouvelId` dans le corps — la base met à jour la clé primaire.
4. Grâce aux contraintes `ON UPDATE CASCADE` (cf. `migrations/2026-06-10_cascade_id_rename.sql`), les colonnes `contract_id`/`invoice_id` des tables `invoices`, `payments`, `inspections`, `collections` sont mises à jour automatiquement en base.
5. Côté front, `cascadeIdChange()` répercute ce changement sur `state.invoices[].contractId`/`lines[].contractId`, `state.payments`, `state.inspections` (et persiste à nouveau les factures dont les `lines` référencent l'ancien Id).

**Pré-requis** : exécuter `migrations/2026-06-10_cascade_id_rename.sql` dans l'éditeur SQL Supabase avant d'utiliser cette fonctionnalité (sinon la modification de l'Id échoue avec une violation de clé étrangère si des factures/paiements/états des lieux y font référence).

---

## 9. Évolutions V2 — Vers une version professionnelle

> Spécification du prochain lot de fonctionnalités, à développer après validation. Référentiel métier : `docs/01-specifications/BMAD.md` section 6.5 (BR18-BR27). Référentiel schéma : `docs/03-data-model/SCHEMA_REFERENCE.md` section "Évolutions V2".

### 9.0 Checklists transversales (règles absolues CLAUDE.md) — à appliquer à chaque entité/écran V2

Les deux règles absolues du projet (`CLAUDE.md`) s'appliquent à **toute** nouvelle entité et **tout** nouvel écran/KPI/graphique introduits par les sections 9.1-9.11. Avant de considérer une feature V2 comme terminée, vérifier systématiquement les deux checklists suivantes.

**Checklist persistance (par entité : `contract_lines`, `invoice_lines`, `quotes`, `quote_lines`, et toute nouvelle entité future)**
1. **Chargement** : l'entité est chargée par `loadDataFromAPI` (pas de dépendance au seed démo local uniquement).
2. **Écriture** : les formulaires de création/édition écrivent via `apiPost`/`apiPut`/`upsertMany` vers l'endpoint correspondant (`docs/05-api/API_REFERENCE.md`), puis mettent à jour `state` localement.
3. **Démo** : l'entité est incluse dans `syncStateToAPI` et dans la route `/demo/reset` (bouton "Charger données démo").

| Entité | Chargement (`loadDataFromAPI`) | Écriture (formulaires) | `syncStateToAPI` / `/demo/reset` |
|---|---|---|---|
| `contract_lines` | À ajouter (avec `contracts`) | Formulaire "+ Ajouter une ligne" (9.3) | À ajouter |
| `invoice_lines` | À ajouter (avec `invoices`) | Auto-remplissage + édition (9.4) | À ajouter |
| `quotes` | À ajouter | Écran Devis (9.10) | À ajouter |
| `quote_lines` | À ajouter (avec `quotes`) | Écran Devis (9.10) | À ajouter |

**Checklist navigation cliquable (par nouvel écran/KPI/graphique)**
Chaque pile/carte statistique (KPI), liste et graphique doit être cliquable et renvoyer vers l'écran détaillé **avec le même filtre déjà appliqué** (pattern `onClick` + `switchToTab`/`openTab` + filtre pré-rempli, déjà en place sur les graphiques du dashboard). Exemples pour les écrans V2 :

| Widget source | Cible cliquable |
|---|---|
| KPI "Contrats actifs" (dashboard) | `#contracts` filtré `status=active` |
| Cellule "Nombre de véhicules" sur une ligne de la grille Contrats (9.3) | Détail du contrat → pavé `contract_lines` |
| Graphique de rentabilité par véhicule (existant) | Détail du véhicule, filtré sur la période du graphique |
| Future KPI "Devis en attente" (dashboard) | `#quotes` filtré `status=envoye` |
| Future KPI "Devis expirant bientôt" | `#quotes` filtré `status=envoye` + tri par `validity_date` croissant |
| Ligne `contract_lines` au statut `resilie` (9.9) | Détail de la réservation associée (`reservations.contract_line_id`) |

### 9.1 Contrat : montant HT ⇄ TTC (BR18)

Sur le formulaire d'une ligne de contrat (`contract_lines`), deux champs liés **Montant HT** et **Montant TTC** :
- Modifier l'un recalcule l'autre via `computeContractTtcFromHt(amountHt)` / `computeContractHtFromTtc(amountTtc)`, avec `TTC = HT × (1 + vatRate / 100)`.
- À la différence du calcul de facture (BR15bis), **aucune taxe journalière ni timbre fiscal** n'entre dans ce calcul — ces composantes restent propres à la facturation.
- `rate` (tarif HT par jour ou par mois) reste le champ pivot : `amount_ht = rate × jours` (ou `× mois`). Saisir directement `amount_ttc` recalcule `rate` en conséquence.
- Les totaux de l'entête contrat (`total_amount_ht`, `total_vat_amount`, `total_amount_ttc`) sont recalculés à chaque ajout/modification/suppression de ligne = somme des lignes.
- **TVA non négative** : le champ "TVA (%)" du formulaire Paramètres → Paramètres de facturation refuse toute valeur négative (validation côté formulaire), en complément de la contrainte `CHECK (vat_rate >= 0)` côté base (`settings`, cf. SCHEMA_REFERENCE.md).

### 9.2 Contrôle de chevauchement véhicule (BR19)

À la création ou modification d'une ligne de contrat (véhicule + période), le contrôle est appliqué à **trois niveaux** :

1. **UI (frontend)** : recherche d'un chevauchement de période pour le même `car_id` parmi (a) les autres `contract_lines` au statut `active` (les lignes `brouillon`, `termine`, `annule`, `resilie` sont **exclues** du contrôle), et (b) les `reservations` actives liées (BR25). En cas de conflit, message d'erreur **affiché en rouge, inline dans le formulaire** (pas une `alert()`), par exemple :
   > ⚠ Le véhicule {plaque} est déjà engagé du {date_début} au {date_fin} sur le contrat {id_contrat} (ligne {n}). Choisissez une autre période ou un autre véhicule.
   L'enregistrement de la ligne est bloqué jusqu'à résolution du conflit. Généralise la fonction existante `findReservationConflict` pour couvrir aussi `contract_lines`.
2. **Backend** : `POST`/`PUT /contract-lines` exécutent la même recherche de chevauchement côté serveur avant d'écrire en base, et renvoient une erreur 409 avec un message exploitable par le frontend si un conflit est détecté (le contrôle UI seul ne suffit pas — un client malveillant ou un appel API direct pourrait le contourner).
3. **Base de données** : la contrainte `EXCLUDE` `excl_contract_lines_car_period` (extension `btree_gist`, cf. SCHEMA_REFERENCE.md), limitée aux lignes `status = 'active'`, rejette l'écriture en cas de conflit même en présence d'accès concurrents (deux requêtes simultanées passant les niveaux 1 et 2). Le backend traduit l'erreur PostgreSQL `23P01` (exclusion violation) en la même réponse 409 que le niveau 2.

Les lignes de contrat au statut `brouillon` (contrat non confirmé, 9.3) ne sont soumises à **aucun** de ces trois niveaux ; le contrôle s'applique dès le passage `brouillon → active`.

### 9.3 Contrat entête + lignes (BR20)

**Écran liste "Contrats" (`#contracts`)**
- Une ligne de tableau = un contrat (entête) : Id, Client, Date, Type, Statut, **Total HT**, **Total TTC**, Nombre de véhicules (= nb de `contract_lines`).
- Double-clic sur une ligne → ouvre l'écran de détail (modale ou panneau plein écran, sur le modèle de `#carFinanceModal`) :
  - **Pavé haut (entête)** : client, date du contrat, type (court/long), statut, mode/plan de paiement, notes, totaux HT/TVA/TTC (lecture seule, calculés).
  - **Pavé bas (lignes)** : grille `contract_lines` avec colonnes Véhicule (plaque + modèle), Période (début/fin), Jours/Mois, Tarif HT, Montant HT, TVA, Montant TTC, Statut, Actions (Résilier — 9.9, Supprimer la ligne).
  - Bouton "+ Ajouter une ligne" : sélection véhicule + période + tarif HT, avec contrôle de chevauchement en direct (9.2) et calcul HT⇄TTC (9.1).
- **Migration** : les contrats existants (mono-véhicule) sont convertis en 1 entête (sans champs véhicule) + 1 ligne `contract_lines` reprenant les champs véhicule/période/tarif actuels.

**Statut `brouillon` et transition automatique `active → termine`**
- Un contrat créé au statut `contracts.status = 'brouillon'` a toutes ses `contract_lines` créées avec `status = 'brouillon'` : ces lignes ne sont pas soumises au contrôle de chevauchement (9.2/BR19) ni à la réservation automatique (9.8/BR25), et n'apparaissent pas comme "engagées" dans le planning de disponibilité des véhicules.
- Bouton "Confirmer le contrat" : passe `contracts.status` de `brouillon` à `active`, et bascule toutes ses `contract_lines` de `brouillon` à `active`. Ce passage déclenche alors, pour chaque ligne, le contrôle 9.2/BR19 (si conflit, la confirmation est bloquée ligne par ligne avec le message d'erreur rouge inline habituel) puis la recherche/création de réservation (9.8/BR25).
- **Transition automatique `active → termine`** : à l'affichage de la grille `contract_lines` (liste Contrats ou détail), toute ligne `status = 'active'` dont `period_end < aujourd'hui` est affichée avec le statut `termine` (badge), sans écriture immédiate en base. Le statut est persisté (`UPDATE contract_lines SET status = 'termine'`) à la prochaine action effectuée sur la ligne (résiliation, modification, génération de facture) — même mécanisme que l'expiration automatique des devis (9.10/BR27).

### 9.4 Facture entête + lignes, auto-remplissage depuis un contrat (BR21)

- `invoices.lines` (JSONB, BR15bis) est remplacé par la table relationnelle `invoice_lines` (mêmes champs + `contract_line_id`).
- Sur le formulaire de création/édition de facture, le sélecteur "Contrat" référence un **contrat entête**. Dès qu'un contrat est sélectionné :
  - Le système crée automatiquement **une ligne de facture par ligne de ce contrat** (`contract_lines`), pré-remplie avec véhicule, immatriculation, période, montant HT (`contract_lines.amount_ht`).
  - L'utilisateur peut ensuite modifier ou supprimer ces lignes générées avant validation (ex. facturation d'une période partielle, ou montant ajusté après résiliation anticipée, cf. 9.9).
- Le calcul par ligne reste celui de BR15bis : TVA et taxe journalière (2dt/jour) par ligne ; timbre fiscal une seule fois pour la facture entière (entête).
- `generateInvoicePdf` est mis à jour pour lire `invoice_lines` (avec repli sur `invoices.lines` pour les factures existantes non migrées).
- **Facture sans ligne interdite (BR21)** : le bouton "Enregistrer" du formulaire facture est désactivé (ou affiche une erreur rouge inline) si `invoice_lines` est vide — message : « Une facture doit contenir au moins une ligne. ». Le backend (`POST`/`PUT /invoices` et `/rpc/create_invoice_with_lines`, 9.11) applique le même contrôle et renvoie une erreur 400 si la liste de lignes est vide, pour empêcher la création via appel API direct.

### 9.5 Sélection du RIB à la facturation (BR22) — ✅ Implémenté (Phase 1A)

- **Paramètres → Paramètres de facturation** : le RIB existant devient "RIB n°1" (`company_rib` + libellé optionnel `company_rib_label`) ; ajout d'un "RIB n°2" optionnel (`company_rib_2` + libellé optionnel `company_rib_2_label`). Champs `companyRibLabel`, `companyRib2`, `companyRib2Label` dans la modale Paramètres, persistés via `PUT /settings`.
- **Formulaire de création de facture** (`#invoiceLegacyForm`) : sélecteur "RIB" (`#invoiceRib`, RIB n°1 / RIB n°2, affichant le libellé s'il est renseigné), pré-sélectionné sur le RIB n°1. L'option "RIB n°2" n'apparaît que si `companyRib2` est configuré (peuplée par `renderInvoiceFormOptions()`).
- La valeur choisie est figée sur la facture (`invoices.rib` / `invoices.rib_label`) au moment de la création (`addInvoiceBtn`) et imprimée dans le PDF (`generateInvoicePdf`), indépendamment d'une modification ultérieure des paramètres.
- **Éditeur générique** (`openRecordEditor`, détail facture) : `invoices.rib` utilise le même sélecteur RIB n°1/RIB n°2 qu'à la création (`lookupMap["invoices.rib"]` dans `getEditorFieldConfig`, options construites depuis `state.settings.companyRib(2)`/`companyRib(2)Label`) — fini la saisie libre. `invoices.ribLabel` est calculé (lecture seule) et resynchronisé sur le RIB sélectionné par `applyDerivedFields` ; si la valeur de `rib` ne correspond plus aux RIB actuels (facture ancienne, paramètres modifiés depuis), elle est conservée comme option supplémentaire et son libellé figé est préservé. Cf. règle "Cohérence des contrôles de saisie" dans `CLAUDE.md`.

### 9.6 Traçabilité création/modification (BR23) — ✅ Implémenté (Phase 1A)

- Toutes les tables métier reçoivent `created_by`/`updated_by` (FK `users.id`), renseignés par le backend depuis l'utilisateur authentifié (`req.user.id`, middleware JWT existant) sur chaque `POST`/`PUT`, via le helper `src/backend/utils/audit.ts` (`stampCreate`/`stampUpdate`).
- `loadDataFromAPI()` charge `state.users` (annuaire `id`/nom/email, réservé aux admins via `GET /users`) et mappe `createdAt`/`createdBy`/`updatedAt`/`updatedBy` sur chaque entité (`cars`, `customers`, `contracts`, `invoices`, `payments`, `maintenanceCosts`, `vignettes`, `leasingContracts`, `insurances`, `reservations`).
- Dans l'éditeur générique (`openRecordEditor`), `created_by`/`updated_by`/`created_at`/`updated_at` sont affichés en lecture seule (`getEditorFieldConfig`) ; `created_by`/`updated_by` sont résolus en nom d'utilisateur via `resolveUserName()` (repli sur l'id brut si `state.users` est vide ou si l'utilisateur n'est pas trouvé) plutôt que d'afficher l'id brut.

### 9.7 Tri et filtre génériques sur toutes les grilles (BR24) — ✅ Implémenté (Phase 1B)

Comportement appliqué aux ~19 grilles principales de l'application (Voitures, Clients, Contrats, Factures, Recouvrement, Paiements, Maintenance, Réservations, États des lieux, Alertes, Assurances + échéances, Leasing + échéances, Vignettes, GPS, Utilisateurs, Rentabilité, Prévision de trésorerie) :

- **Tri** : clic sur l'en-tête de colonne (`th.sortable`, surligné au survol) → tri ascendant ; second clic sur la même colonne → tri descendant ; un indicateur visuel (▲/▼, `span.sort-indicator`) signale la colonne et le sens actifs. Tri effectué côté client sur les données déjà chargées dans `state`.
- **Filtre** : une ligne `tr.filter-row` insérée sous les en-têtes, avec un champ texte par colonne (recherche partielle insensible à la casse) ou une liste déroulante (`<select>`, option "Tous") pour les colonnes à valeurs énumérées (ex. `status`, `mode`, `role`, colonne "Etat" calculée). Les filtres sont cumulatifs (ET logique entre colonnes) et s'appliquent en plus des filtres existants (recherche globale / filtre statut du haut de page).
- **Tri par défaut** : si aucune colonne n'est triée, l'ordre par défaut existant est conservé (généralement `created_at` décroissant côté API, conformément à BR23, ou l'ordre métier propre à l'écran — ex. échéances classées par date d'échéance).
- **État** : l'état de tri/filtre par grille est conservé en mémoire pendant la session uniquement, dans `dashboardFilters[entityKey].sort = { key, dir }` et `dashboardFilters[entityKey].columnFilters = {}` — sans persistance en base.
- **Implémentation** (`worksheet-mini-app/index.html`) :
  - `getColumnValue(row, col)`, `compareValues(a, b, type)` (types `"number"`, `"date"`, `"string"` avec tri local `fr` numérique), `getTableState(entityKey)` (initialisation paresseuse de `sort`/`columnFilters`).
  - `applySortAndColumnFilters(rows, entityKey, columns)` : applique les filtres par colonne puis le tri ; appelée dans chaque `render<Entity>()` juste avant la pagination/itération.
  - `setupSortableTable(table, entityKey, columns, renderFn)` : initialise une fois par table (`headRow.dataset.sortableInit`) les en-têtes cliquables + indicateurs et injecte la ligne de filtres ; appelée pour les 19 grilles depuis `setupAllSortableTables()`.
  - Chaque grille définit un tableau `const <ENTITY>_COLUMNS = [...]` (ordre = ordre des `<th>`), avec `sortType`, `filterType: "select"` + `options` pour les colonnes énumérées, `accessor` pour les colonnes calculées (ex. `contracts.totalTnd`/`dueTnd`, `invoices.status`, `rentabilite.revenue`/`expenses`/`balance`), et `sortable: false`/`filterable: false` pour les colonnes d'actions.

### 9.8 Réservation liée à une ligne de contrat — recherche ou création (BR25)

À la création d'une ligne de contrat `active` (ou à la confirmation `brouillon → active`, 9.3), le système exécute la séquence suivante :

1. **Création de la ligne** : `contract_lines` est insérée avec `reservation_id = NULL`.
2. **Recherche** d'une réservation existante pour le même `car_id` couvrant exactement la même période (`period_start`/`period_end`) :
   - **Trouvée** (ex. le client avait déjà une réservation pour ce véhicule/cette période) → elle est liée à la ligne : `reservations.contract_line_id = contract_lines.id` et `contract_lines.reservation_id = reservations.id`. Aucune nouvelle réservation n'est créée.
   - **Non trouvée** → une nouvelle réservation est créée : `reservations.status = 'confirmee'`, `start_date`/`end_date` = `period_start`/`period_end` de la ligne, `start_time`/`end_time` par défaut (`09:00`/`18:00`), liée via `reservations.contract_line_id`. **Cas particulier** : si une réservation existe pour ce véhicule mais à des dates différentes (chevauchant partiellement), ses dates sont corrigées (`start_date`/`end_date`) pour correspondre exactement à la période de la ligne de contrat, plutôt que de créer un doublon.
3. **Mise à jour** : `contract_lines.reservation_id` est renseigné avec l'id de la réservation retenue (existante liée, ou nouvellement créée/corrigée).

Cette réservation alimente le contrôle de chevauchement (9.2/BR19) ainsi que les écrans existants de planning/disponibilité des véhicules. Si la ligne de contrat est supprimée avant validation définitive du contrat, la réservation associée — uniquement si elle a été créée par cette règle (pas une réservation préexistante simplement liée) — est supprimée également. Toute la séquence ci-dessus est exécutée dans la transaction `create_contract_with_lines` (9.11) pour rester atomique avec la création de la ligne.

### 9.9 Résiliation anticipée d'une ligne de contrat (BR26)

Sur la grille des lignes de contrat (9.3), bouton **"Résilier"** disponible pour toute ligne active (`status = 'active'`) :

1. Demande la date de fin effective (`actual_end_date`), avec validation `period_start ≤ actual_end_date ≤ period_end` ; si `actual_end_date < aujourd'hui`, demande confirmation explicite (résiliation rétroactive).
2. Met à jour `contract_lines.status = 'resilie'` et `contract_lines.actual_end_date`.
3. Met à jour `contracts.status = 'resilie'` si c'est la dernière ligne active du contrat à être résiliée (sinon le contrat reste `active`, seule la ligne change de statut).
4. Met à jour la réservation liée (`reservations.contract_line_id`) :
   - si `actual_end_date < period_end` (en avance) : `reservations.end_date = actual_end_date` (raccourcie) ;
   - si `actual_end_date < aujourd'hui` (rétroactif) : `reservations.status = 'annulee'`.
5. Le véhicule redevient disponible/réservable à partir du lendemain de `actual_end_date`.
6. Recalcule `amount_ht`/`vat_amount`/`amount_ttc` de la ligne au prorata de la durée réelle (`actual_end_date - period_start + 1` jours) ; ce montant ajusté est repris par la prochaine ligne de facture générée pour ce contrat (9.4).

### 9.10 Devis entête + lignes, PDF, validation et conversion en contrat (BR27)

**Écran liste "Devis" (`#quotes`)**
- Nouvel onglet, sur le modèle de l'écran Contrats (9.3) : une ligne de tableau = un devis (entête) : Id, Client, Date du devis, Date de validité, Statut, Total HT, Total TTC, Nombre de véhicules. Tri/filtre génériques (9.7), tri par défaut sur `created_at` décroissant (BR23).
- Double-clic → écran de détail identique au contrat (9.3) : pavé haut = entête (client, date, date de validité, statut, notes, totaux HT/TVA/TTC en lecture seule), pavé bas = grille `quote_lines` (Véhicule, Période, Jours/Mois, Tarif HT, Montant HT, TVA, Montant TTC, Actions : Supprimer la ligne).
- Bouton "+ Ajouter une ligne" : sélection véhicule + période + tarif HT, avec calcul HT⇄TTC (9.1). **Pas de contrôle de chevauchement (9.2/BR19)** à ce stade : un devis ne réserve pas le véhicule (BR27).
- **Date de validité obligatoire** : le champ "Date de validité" (`validity_date`, `NOT NULL`) est pré-rempli à la création avec `quote_date + 30 jours`, modifiable par l'utilisateur ; le formulaire bloque l'enregistrement si le champ est vidé. Un devis `envoye` dont `validity_date < aujourd'hui` est affiché avec le statut `expire` (calculé à l'affichage, persisté à la prochaine action — même mécanisme que la transition `active → termine` des lignes de contrat, 9.3).

**Export PDF**
- Bouton "Télécharger PDF" (sur le modèle de `generateInvoicePdf`/9.4) : génère un document "Devis" reprenant le même gabarit que le contrat (en-tête agence : logo, nom, adresse, RIB, matricule fiscal ; informations client ; tableau des lignes avec véhicule/immatriculation/période/jours/montants HT-TVA-TTC ; totaux), avec en plus la **date de validité** affichée en évidence. Destiné à être envoyé au client par email/impression.

**Validation et conversion en contrat**
- Bouton "Valider" sur un devis au statut `brouillon` ou `envoye` :
  1. Confirmation explicite (`confirm()`) — opération irréversible.
  2. Appel à `/rpc/validate_quote` (9.11) : création d'un nouveau contrat (entête `contracts` + une `contract_lines` par `quote_lines`), avec les mêmes valeurs (client, périodes, tarifs, ventilation HT/TVA/TTC), dans une transaction unique.
  3. Application normale du contrôle de chevauchement (9.2/BR19) sur ces nouvelles lignes — si conflit (à n'importe quel des 3 niveaux), la transaction est annulée (rollback complet), la validation échoue avec le même message d'erreur rouge inline, le devis reste non validé.
  4. Si OK : création automatique des réservations (9.8/BR25) pour chaque ligne de contrat créée, dans la même transaction.
  5. `quotes.status = 'valide'`, `quotes.converted_contract_id = <id du nouveau contrat>` ; le devis devient lecture seule (toute action d'édition/suppression de lignes est désactivée).
  6. L'écran bascule sur le contrat nouvellement créé (ou affiche un lien "Voir le contrat {id}").
- Boutons "Marquer comme envoyé" (`envoye`) et "Refuser" (`refuse`) disponibles pour le suivi commercial ; un devis dont `validity_date < aujourd'hui` et non encore validé passe automatiquement à `expire` à l'affichage de la liste (calcul côté client, sans tâche planifiée, persisté à la prochaine action — cf. ci-dessus).

### 9.11 Atomicité des opérations entête + lignes (BR20bis)

Trois opérations métier sont multi-tables et doivent être **atomiques** (tout ou rien) : la création d'un contrat avec ses lignes (9.3/BR20), la création d'une facture avec ses lignes (9.4/BR21), et la validation d'un devis avec conversion en contrat (9.10/BR27). Elles sont implémentées via des **fonctions PostgreSQL exposées en RPC par PostgREST** (`docs/03-data-model/SCHEMA_REFERENCE.md`, section "Fonctions RPC") :

| Fonction RPC | Appelée par | Rôle |
|---|---|---|
| `create_contract_with_lines` | Bouton "Enregistrer" du formulaire Contrat (9.3), et par `validate_quote` | Crée l'entête `contracts` + toutes les `contract_lines` ; pour chaque ligne `active`, exécute la séquence réservation (9.8/BR25) ; applique le contrôle BR19 (9.2). Rollback complet en cas d'échec sur une ligne. |
| `create_invoice_with_lines` | Bouton "Enregistrer" du formulaire Facture (9.4) | Crée l'entête `invoices` + toutes les `invoice_lines` ; refuse (erreur 400) si aucune ligne (9.4/BR21). |
| `validate_quote` | Bouton "Valider" d'un devis (9.10) | Marque le devis `valide`, appelle `create_contract_with_lines` avec les `quote_lines` converties, renseigne `quotes.converted_contract_id`. Rollback complet (devis reste non validé) si la création du contrat échoue (ex. conflit BR19). |

Le backend (`src/backend/routes/`) appelle ces fonctions via `POST /rpc/<nom_fonction>` au lieu d'enchaîner plusieurs `INSERT`/`UPDATE` séparés, ce qui évite les états intermédiaires incohérents (ex. entête créée sans ses lignes, ou ligne de contrat sans réservation) en cas d'erreur ou d'accès concurrent. Voir `docs/05-api/API_REFERENCE.md` section 13 pour les endpoints correspondants.

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Next Review**: June 2026
