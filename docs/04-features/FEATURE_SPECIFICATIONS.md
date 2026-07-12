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

**4.1.6 Édition et impression de facture** — ✅ Redesign UX entête+lignes (2026-06)

Depuis l'onglet **Factures**, le bouton **"Facture"** ouvre la modale `#invoiceEditModal` redessinée selon le même pattern entête+lignes inline que `#contractDetailModal` (section 9.3) :

**Pavé entête (lecture/édition inline)** — `renderInvoiceDetailHeader(invoiceId, editMode)` :
- Lecture : grille 5 colonnes (Client, Contrat, Libellé, Échéance, Statut, Total HT, Total TTC, Réglé, Solde dû, RIB).
- Bouton "✏ Modifier entête" → bascule en édition inline dans le même pavé : inputs/selects pour Libellé, Échéance, Statut (en_attente/non_payee/payee/partiel), RIB (sélecteur RIB1/RIB2 conforme BR22). "✓ Enregistrer" → `PUT /invoices/:id`. "✗ Annuler" → retour lecture sans sauvegarde.

**Grille de lignes** — `renderInvoiceDetailLines(invoiceId)` :
- Colonnes : Libellé/Contrat/Véhicule, Début période, Jours, HT, TVA, Taxe journalière, TTC, ✕ Supprimer.
- Pied de tableau : totaux + timbre fiscal. Suppression : `deleteInvoiceDetailLine` → `saveInvoiceLines` → re-render.
- `saveInvoiceLines` : recalcule tous les totaux depuis `invoice.lines` → `PUT /invoices/:id` (JSONB + agrégats).

**Ajout inline** — `appendInlineInvoiceLineRow` / `submitInlineInvoiceLine` :
- Bouton "+ Ajouter une ligne" → `<tr class="inline-new-line">` dans le tableau.
- HT↔TTC bidirectionnel via `computeLineBreakdown`. Annulation = suppression de la `<tr>`.

Le bouton **"Télécharger le PDF"** (`iePdfBtn`) reste disponible depuis la modale pour générer le document papier via `generateInvoicePdf` (cf. ci-dessous).

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
| `invoice_lines` | ✅ Chargé via `GET /invoice-lines` | ✅ POST/PUT/DELETE `/invoice-lines` + modal édition | ✅ `syncStateToAPI` + `/demo/reset` |
| `quotes` | À ajouter | Écran Devis (9.10) | À ajouter |
| `quote_lines` | À ajouter (avec `quotes`) | Écran Devis (9.10) | À ajouter |

**Checklist navigation cliquable (par nouvel écran/KPI/graphique)**
Chaque pile/carte statistique (KPI), liste et graphique doit être cliquable et renvoyer vers l'écran détaillé **avec le même filtre déjà appliqué** (pattern `onClick` + `switchToTab`/`openTab` + filtre pré-rempli, déjà en place sur les graphiques du dashboard). Exemples pour les écrans V2 :

| Widget source | Cible cliquable |
|---|---|
| KPI "Contrats actifs" (dashboard) | `#contracts` filtré `status=active` |
| Cellule "Nombre de véhicules" sur une ligne de la grille Contrats (9.3) | Détail du contrat → pavé `contract_lines` |
| Graphique de rentabilité par véhicule (existant) | Détail du véhicule, filtré sur la période du graphique |
| ✅ KPI "Devis en attente" (dashboard, 2026-06) | `#quotes` filtré `status=envoye` |
| ✅ KPI "Devis expirant bientôt ≤7 j" (dashboard, 2026-06) | `#quotes` sans filtre (tous statuts actifs) |
| ✅ KPI "Devis validés" (dashboard, 2026-06) | `#quotes` filtré `status=valide` |
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

### 9.3 ✅ Contrat entête + lignes (BR20) — Phase 2A + 2B + 5 implémentées

**Phase 2A (socle DB + backend)** ✅ Commit `a5b6b6c` :
- Table `contract_lines` avec contrainte EXCLUDE `excl_contract_lines_car_period` (chevauchement véhicule-période pour lignes `active`)
- CRUD backend : `GET/POST /contract-lines`, `GET/PUT /contract-lines/:id`, `GET /contracts/:id/lines`
- RPC `create_contract_with_lines` (Supabase)
- Migration `002_phase2a_contract_lines.sql`

**Phase 2B (frontend)** ✅ :
- `contracts.car_id` rendu nullable (migration `003_phase2b_contracts_nullable_car.sql`) → création d'entête sans véhicule
- Formulaire "Nouveau contrat" simplifié (client, type, date, paiement) → POST `/contracts` → ouvre immédiatement le modal de détail
- `#contractDetailModal` : pavé entête (client, type, date, paiement, statut, totaux HT/TTC) + grille `contract_lines` + formulaire "+ Ajouter une ligne"
- HT ⇄ TTC bidirectionnel en temps réel (BR18, TVA uniquement sur lignes)
- Message d'erreur inline BR19 en cas de chevauchement (statut HTTP 409 depuis le backend)
- Sélecteur véhicule affiche TOUS les véhicules, avec marquage "⚠ conflit" selon les dates saisies
- Colonne "Lignes" dans la liste des contrats (badge cliquable → ouvre le modal)
- `state.contractLines` chargé au login via `loadDataFromAPI` + inclus dans `syncStateToAPI`

**Écran liste "Contrats" (`#contracts`)**
- Une ligne de tableau = un contrat (entête) : Id, Type, Client, **Lignes** (badge cliquable), Total HT, Restant, Statut.
- Clic sur badge "N ligne(s)" ou double-clic sur la ligne → ouvre `#contractDetailModal` :
  - **Pavé haut (entête)** : client, date du contrat, type (court/long), statut, mode/plan de paiement, notes, totaux HT/TVA/TTC (lecture seule, calculés).
  - **Pavé bas (lignes)** : grille `contract_lines` avec colonnes Véhicule (plaque + modèle), Période (début/fin), Jours/Mois, Tarif HT, Montant HT, TVA, Montant TTC, Statut, Actions (Résilier — 9.9, Supprimer la ligne).
  - Bouton "+ Ajouter une ligne" : sélection véhicule + période + tarif HT, avec contrôle de chevauchement en direct (9.2) et calcul HT⇄TTC (9.1).
- **Migration** : les contrats existants (mono-véhicule) sont convertis en 1 entête (sans champs véhicule) + 1 ligne `contract_lines` reprenant les champs véhicule/période/tarif actuels.

**Statut `brouillon` et transition automatique `active → termine`**
- Un contrat créé au statut `contracts.status = 'brouillon'` a toutes ses `contract_lines` créées avec `status = 'brouillon'` : ces lignes ne sont pas soumises au contrôle de chevauchement (9.2/BR19) ni à la réservation automatique (9.8/BR25), et n'apparaissent pas comme "engagées" dans le planning de disponibilité des véhicules.
- Bouton "Confirmer le contrat" : passe `contracts.status` de `brouillon` à `active`, et bascule toutes ses `contract_lines` de `brouillon` à `active`. Ce passage déclenche alors, pour chaque ligne, le contrôle 9.2/BR19 (si conflit, la confirmation est bloquée ligne par ligne avec le message d'erreur rouge inline habituel) puis la recherche/création de réservation (9.8/BR25).
- **Transition automatique `active → termine`** : à l'affichage de la grille `contract_lines` (liste Contrats ou détail), toute ligne `status = 'active'` dont `period_end < aujourd'hui` est affichée avec le statut `termine` (badge), sans écriture immédiate en base. Le statut est persisté (`UPDATE contract_lines SET status = 'termine'`) à la prochaine action effectuée sur la ligne (résiliation, modification, génération de facture) — même mécanisme que l'expiration automatique des devis (9.10/BR27).

### 9.4 ✅ Facture entête + lignes, auto-remplissage depuis un contrat (BR21) — Implémenté (2026-06)

- `invoices.lines` (JSONB) est remplacé par la table relationnelle `invoice_lines`. Migration `006_br21_invoice_lines.sql` à exécuter dans Supabase.
- **Table `invoice_lines`** : colonnes `id`, `invoice_id` (FK → invoices CASCADE), `contract_line_id` (FK optionnel), `contract_id`, `car_plate`, `designation`, `amount_ht`, `vat_amount`, `daily_tax_amount`, `days`, `period_start`, `period_end`, `line_ttc`, `currency`, `amount_original` + audit fields.
- **Backend** : nouveau fichier `invoice-lines.routes.ts` — `GET /invoice-lines`, `POST /invoice-lines`, `PUT /invoice-lines/:id`, `DELETE /invoice-lines/:id`. Chaque PUT/POST/DELETE recalcule automatiquement les totaux de la facture parente. `POST /invoices` crée les `invoice_lines` à partir du tableau `lines` transmis dans le body (les nouvelles factures n'utilisent plus le JSONB).
- **Frontend** : `state.invoiceLines` chargé dans `loadDataFromAPI`. `renderInvoiceDetailLines` préfère `state.invoiceLines`, repli sur JSONB pour les anciennes factures. L'ouverture du modal de détail d'une facture ancienne (JSONB) migre automatiquement ses lignes en `invoice_lines` (migration lazy on first open).
- **Facture sans ligne interdite** : `POST /invoices` retourne 400 si aucune ligne transmise. `DELETE /invoice-lines/:id` retourne 422 si suppression de la dernière ligne.
- **PDF** : `generateInvoicePdf` lit `state.invoiceLines` (repli JSONB pour les anciennes factures non encore migrées).
- **`demo/reset`** : `invoice_lines` inclus dans le body envoyé à `/demo/reset` et inséré après les `invoices` dans `demo.routes.ts`.

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

### 9.8 Réservation liée à une ligne de contrat — recherche ou création (BR25) — ✅ Implémenté (2026-06)

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

### 9.10 ✅ Implémenté (2026-06) — Devis entête + lignes, PDF, validation et conversion en contrat (BR27)

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

### 9.12 ✅ Implémenté (2026-06) — Échéancier de facturation pour contrats long terme (BR32)

**Problème résolu** : la génération immédiate de 12 factures à la création d'un contrat long terme était rigide (modification du contrat → factures incohérentes, numérotation non chronologique).

**Principe** : l'échéancier (`invoice_schedule`) est la *planification*, la facture est le *document officiel*. Le numéro de facture est attribué uniquement à la confirmation.

**Flux complet** :
1. Contrat long terme créé avec ses lignes actives
2. "Générer l'échéancier" → `POST /contracts/:id/generate-schedule` → N entrées `planifie` (une par mois)
3. Au moment de facturer → "Générer facture" sur une entrée → `POST /invoice-schedule/:id/generate` → facture `brouillon` créée (sans numéro)
4. Vérifier/modifier le brouillon (lignes, montants)
5. "✓ Confirmer" → `POST /invoices/:id/confirm` → `invoice_number = AAAA-NNNN` attribué, statut `en_attente`

**Règles métier** :
- La suppression d'une facture (`DELETE`) n'est autorisée que si `status = brouillon`
- `POST /contracts/:id/generate-schedule?override=true` régénère uniquement les entrées `planifie` ; les brouillons/confirmés ne sont pas touchés
- Le montant mensuel = somme des `rate` des `contract_lines` actives au moment de la génération
- Statuts d'une entrée d'échéancier : `planifie` → `brouillon` → `confirme` (ou `annule`)

**Fichiers** : `src/backend/routes/invoice-schedule.routes.ts`, `src/backend/migrations/007_invoice_schedule.sql`, `state.invoiceSchedule` dans le frontend, section "Échéancier" dans `openContractDetail`.

### 9.11 Atomicité des opérations entête + lignes (BR20bis)

Trois opérations métier sont multi-tables et doivent être **atomiques** (tout ou rien) : la création d'un contrat avec ses lignes (9.3/BR20), la création d'une facture avec ses lignes (9.4/BR21), et la validation d'un devis avec conversion en contrat (9.10/BR27). Elles sont implémentées via des **fonctions PostgreSQL exposées en RPC par PostgREST** (`docs/03-data-model/SCHEMA_REFERENCE.md`, section "Fonctions RPC") :

| Fonction RPC | Appelée par | Rôle |
|---|---|---|
| `create_contract_with_lines` | Bouton "Enregistrer" du formulaire Contrat (9.3), et par `validate_quote` | Crée l'entête `contracts` + toutes les `contract_lines` ; pour chaque ligne `active`, exécute la séquence réservation (9.8/BR25) ; applique le contrôle BR19 (9.2). Rollback complet en cas d'échec sur une ligne. |
| `create_invoice_with_lines` | Bouton "Enregistrer" du formulaire Facture (9.4) | Crée l'entête `invoices` + toutes les `invoice_lines` ; refuse (erreur 400) si aucune ligne (9.4/BR21). |
| `validate_quote` | Bouton "Valider" d'un devis (9.10) | Marque le devis `valide`, appelle `create_contract_with_lines` avec les `quote_lines` converties, renseigne `quotes.converted_contract_id`. Rollback complet (devis reste non validé) si la création du contrat échoue (ex. conflit BR19). |

Le backend (`src/backend/routes/`) appelle ces fonctions via `POST /rpc/<nom_fonction>` au lieu d'enchaîner plusieurs `INSERT`/`UPDATE` séparés, ce qui évite les états intermédiaires incohérents (ex. entête créée sans ses lignes, ou ligne de contrat sans réservation) en cas d'erreur ou d'accès concurrent. Voir `docs/05-api/API_REFERENCE.md` section 13 pour les endpoints correspondants.

### 9.13 ✅ Implémenté (2026-06) — Module Gestion des données (DMF) — Import / Export par entité

Inspiré du Data Management Framework (DMF) de Dynamics 365 F&O. Accessible via l'onglet **"Gestion des données"**.

**Entités couvertes (master data + paramétrage uniquement — hors transactionnel) :**

| Entité | Table | Clé de déduplication |
|--------|-------|----------------------|
| Clients | `customers` | `phone` |
| Véhicules | `cars` | `plate` |
| Assurances | `insurances` | `car_plate + policy_number` |
| Leasings | `leasing_contracts` | `car_plate + contract_number` |
| Vignettes | `vignettes` | `car_plate + fiscal_year` |
| Maintenance | `maintenance_costs` | `car_plate + date + type` |

**Flux export :** `GET /api/v1/data-management/:entity/export` → CSV UTF-8 avec BOM (compatible Excel) contenant l'intégralité des enregistrements, triés par `created_at`. Colonnes = mêmes en-têtes que le template import → roundtrip parfait (export → modifier → réimporter).

**Flux import :**
1. Télécharger le template : `GET /api/v1/data-management/:entity/template` → CSV avec commentaires `#`, en-têtes obligatoires et 1 ligne exemple
2. Upload du fichier rempli : `POST /api/v1/data-management/:entity/import` (multipart/form-data, champ `file`)
3. Validation complète de toutes les lignes avant toute écriture (champs requis, types, formats date `AAAA-MM-JJ`, valeurs d'enum)
4. Résolution FK : `car_plate → car_id` pour les entités liées à un véhicule
5. Déduplication : si la clé naturelle existe déjà en base → `UPDATE`, sinon → `INSERT` (idempotent)
6. Paramètres : `?dry_run=true` (validation sans écriture), `?skip_errors=true` (importer les lignes valides, ignorer les invalides)
7. Réponse : `{ imported, updated, skipped, dbErrors, errors: [{row, field, message}] }`

**UI :**
- Grille de cartes par entité avec compteur d'enregistrements en base
- Bouton "↓ Exporter CSV" → téléchargement direct
- Bouton "↑ Importer CSV" → modal en 2 étapes (1. télécharger template, 2. uploader fichier) + option "Valider sans importer"
- Panneau de résultat avec badges (créés / mis à jour / ignorés / erreurs), tableau d'erreurs par ligne/champ, bouton "Télécharger rapport d'erreurs CSV", option "Importer les lignes valides quand même"

**Fichiers :** `src/backend/routes/data-management.routes.ts` (nouveau) — librairies : `multer` + `csv-parse`.

### 9.14 ✅ Implémenté (2026-06) — Graphique taux d'occupation flotte (macro dashboard)

**Problème résolu** : le diagramme de Gantt existant (vue par véhicule/jours) ne donnait pas de vision agrégée sur l'occupation globale de la flotte.

**Vue ajoutée** : carte pleine largeur dans le dashboard sous les autres KPIs — graphique en barres des **6 prochains mois** indiquant le pourcentage de véhicules occupés (réservations non-annulées/terminées + lignes de contrat actives).

**Calcul** : pour chaque mois `[monthStart, monthEnd]`, on collecte l'ensemble des `carId` uniques dont la période de réservation ou de ligne de contrat chevauche ce mois. Le taux = `occupiedCount / totalCars` (véhicules en statut `!= indisponible`).

**Couleurs dynamiques** : vert < 50 %, orange 50–80 %, rouge ≥ 80 %.

**KPI inline** : le taux du mois courant est affiché à droite du titre (coloré selon les mêmes seuils).

**Interactivité** : clic sur n'importe quelle barre → navigation vers l'onglet Réservations (règle widgets cliquables).

**Fichier :** `worksheet-mini-app/index.html` — fonctions `getOccupancySeries()` + bloc Chart.js dans `renderHomeDashboard()`.

### 9.15 ✅ Implémenté (2026-06) — Dashboard entièrement personnalisable par utilisateur

**Problème résolu** : l'ordre des KPIs et graphiques était figé, la taille fixe et rien ne pouvait être masqué.

**Grille unifiée** : KPIs (6) et graphiques (8 incl. occupation + prévision) sont dans une seule grille `#dashboardGrid` (`repeat(3, 1fr)`). Les KPIs peuvent être déplacés sous les graphiques et vice-versa.

**Trois actions disponibles** (toolbar au survol de chaque carte) :
| Action | Contrôle | Comportement |
|--------|----------|--------------|
| Déplacer | `⠿` (drag handle) | SortableJS déplace le nœud DOM dans la grille |
| Redimensionner | `◂` rétrécir / `▸` élargir | Cycle span 1 → 2 → 3 colonnes (1/3 · 2/3 · pleine largeur) ; `window.resize` déclenché pour que Chart.js se recalibres |
| Masquer | `✕` | Carte cachée (`dash-hidden`) ; une barre de restauration apparaît au-dessus du dashboard avec des chips cliquables `👁 Nom` |

**Persistance** : après chaque action, `saveDashboardLayout()` envoie `PUT /api/v1/preferences/dashboard-layout` avec `{ order: [...ids], spans: { id: n }, hidden: [...ids] }` lié au `user_id` JWT → personnalisation identique sur tous les appareils.

**Restauration** : `loadDashboardLayout()` (appelé une seule fois au premier accès à l'onglet, résultat mis en cache) → `applyDashboardLayout()` réordonne le DOM, applique les spans et masque les cartes avant le rendu Chart.js.

**Table DB :** `user_preferences(user_id TEXT, key TEXT, value JSONB, updated_at TIMESTAMPTZ)` — PK `(user_id, key)`.

**Bouton "↺ Réinitialiser"** : dans l'en-tête du dashboard, remet l'ordre par défaut, tous les spans à leur valeur `data-default-span`, dé-masque toutes les cartes, et enregistre via `saveDashboardLayout()`.

**Fichiers :**
- `src/backend/migrations/010_user_preferences.sql`
- `src/backend/routes/preferences.routes.ts` (GET + PUT `/:key`)
- `worksheet-mini-app/index.html` — fonctions `initDashboardSortable()`, `initCardControls()`, `saveDashboardLayout()`, `applyDashboardLayout()`, `loadDashboardLayout()`, `renderHiddenBar()`, `resetDashboardLayout()`, constante `DASH_DEFAULT_ORDER`

### 9.16 ✅ Implémenté (2026-06) — PDF contrat + bouton "Créer une facture" depuis le contrat

**PDF contrat** : bouton "🖨 PDF" dans le modal de détail du contrat (`#contractDetailModal`) — ouvre une fenêtre d'impression avec gabarit complet : en-tête agence (logo, nom, adresse, matricule fiscal), informations client, tableau des lignes de contrat (immatriculation, modèle, période, jours, tarif/j HT, montant HT, TVA, TTC), totaux (HT / TVA / TTC), montant en lettres, blocs de signatures (loueur / locataire), pied de page.
- Fonction : `generateContractPdf(contractId)` — même pattern que `generateInvoicePdf` (window.open + self-contained HTML + window.print).
- Les lignes sont lues depuis `state.contractLines` filtré sur `contractId`.

**Créer une facture depuis un contrat** : bouton "📄 Créer une facture" dans les actions du modal de détail.
- Ferme le modal contrat, navigue vers l'onglet Factures, ouvre le formulaire de création, pré-sélectionne le contrat dans `#invoiceContract` et déclenche le `change` event pour auto-remplir les lignes.
- Fonction : `createInvoiceFromContract(contractId)`.

**Fichier :** `worksheet-mini-app/index.html`

### 9.17 ✅ Implémenté (2026-07) — Formulaire création véhicule complet + libellés français

**Problème résolu** : le formulaire de création de véhicule n'exposait que 4 champs (immatriculation, modèle, agence, statut), et l'éditeur générique affichait les noms de propriétés camelCase au lieu de libellés lisibles.

**Formulaire de création étendu** : `#carLegacyForm` comprend désormais tous les champs de la table `cars` :
| Champ HTML | Propriété JS | Colonne DB |
|---|---|---|
| `carPlate` | `plate` | `plate` |
| `carModel` | `model` | `model` |
| `carBrand` | `brand` | `brand` |
| `carColor` | `color` | `color` |
| `carVin` | `vin` | `vin` |
| `carRegistrationNumber` | `registrationNumber` | `registration_number` |
| `carRegistrationDate` | `registrationDate` | `registration_date` |
| `carFuelType` (select) | `fuelType` | `fuel_type` |
| `carOdometerKm` | `odometerKm` | `odometer_km` |
| `carStatus` (select) | `status` | `status` |
| `carAgency` | `agency` | `location` |
| `carOwnerName` | `ownerName` | `owner_name` |
| `carPurchasePrice` | `purchasePrice` | `purchase_price` |
| `carPurchaseDate` | `purchaseDate` | `purchase_date` |
| `carOpeningCash` | `openingCashTnd` | `opening_cash_tnd` |
| `carNotes` | `notes` | `notes` |

Champs obligatoires : Immatriculation + Modèle. Un bouton "Annuler" ferme le formulaire sans création.

**Libellés en français dans l'éditeur générique** : `fieldLabelMap` (constante globale JS, juste avant `getEditorFieldConfig`) mappe chaque clé camelCase → libellé français pour tous les modules : véhicules, clients, contrats, factures, paiements, maintenance, réservations, assurances, leasing, vignettes, devis. Dans `openRecordEditor`, `label.textContent = config.label || key` utilise ce libellé.

**Sélecteur carburant** : dans le formulaire et l'éditeur, `fuelType` est un `<select>` avec options Diesel / Essence / Hybride / Électrique / GPL (via `enumMap2` dans `getEditorFieldConfig`).

**`loadDataFromAPI`** : tous les nouveaux champs (`color`, `vin`, `registrationNumber`, `registrationDate`, `fuelType`, `odometerKm`, `ownerName`, `purchasePrice`, `purchaseDate`, `notes`, `photoUrl`, `siteVisible`, `sitePriceDay`) sont désormais mappés du snake_case DB vers le camelCase JS.

**`mapCarToApi`** : tous les champs sont inclus dans le `PUT /cars/:id` lors d'une édition via l'éditeur générique.

**Backend** : `POST /cars` accepte désormais tous les champs (`registration_number`, `registration_date`, `fuel_type`, `purchase_price`, `purchase_date`, `owner_name`, `opening_cash_tnd`, `photo_url`, `site_visible`, `site_price_day`).

**Fichiers modifiés** :
- `worksheet-mini-app/index.html` — `#carLegacyForm`, `addCarBtn` handler, `newCarBtn` handler, `loadDataFromAPI` (cars mapping), `mapCarToApi`, `fieldLabelMap`, `getEditorFieldConfig` (inputTypeMap + enumMap2 + label dans retours), `openRecordEditor` (label display)
- `src/backend/routes/cars.routes.ts` — `POST /` accepte tous les champs

### 9.18 ✅ Implémenté (2026-07) — Sélecteur de colonnes dynamique (column picker) pour tous les grids

**Problème résolu** : les grids affichaient des colonnes fixes ; l'utilisateur ne pouvait pas masquer/afficher les colonnes selon ses besoins.

**Fonctionnement** :
- Bouton `⚙ Colonnes` présent sur chaque panel (véhicules, clients, paiements, réservations, maintenance, assurances, leasing, vignettes).
- Un popover liste toutes les colonnes disponibles avec des cases à cocher ; décocher masque la colonne, cocher la réaffiche — en temps réel, sans rechargement.
- Préférences persistées dans `localStorage` (`locacar-col-prefs`, clé par entité).
- Boutons **Défaut** (rétablir les colonnes par défaut) et **Tout** (tout afficher) dans le popover.

**Architecture** :
- `COL_DEFS[entity]` — tableau de définitions `{ key, label, render }` pour toutes les colonnes disponibles par entité.
- `DEFAULT_COLS[entity]` — sous-ensemble de clés affiché par défaut.
- `getColPrefs(entity)` / `saveColPrefs(entity, keys)` — lecture/écriture dans localStorage.
- `applyColPrefs(entity)` — injecte un `<style id="colStyle_entity">` avec des règles CSS `[data-entity="X"] [data-col="Y"] { display: none !important }` pour les colonnes désactivées.
- `openColumnPicker(entity, btn)` — ouvre le popover positionné sous le bouton.
- `getActiveDefs(entity)` — filtre `COL_DEFS[entity]` par les prefs actives.

**Grids couverts** :
| Entité | Colonnes par défaut | Colonnes supplémentaires disponibles |
|---|---|---|
| cars | plate, model, status, agency | brand, color, vin, registrationNumber, registrationDate, fuelType, odometerKm, ownerName, purchasePrice, openingCashTnd, notes |
| customers | name, phone, email, type | — |
| maintenance | carPlate, type, date, amountTnd, status | id, amountOriginal, note |
| payments | customerName, contractId, date, amountTnd, method | id, invoiceId, amount |
| reservations | customerName, carPlate, startDate, endDate, status | id, startTime, endTime |
| insurances | carPlate, insuranceCompany, monthlyAmount, startDate, endDate | id, policyNumber, status |
| leasingContracts | carPlate, leasingCompany, monthlyAmount, startDate, endDate | id, contractNumber, status |
| vignettes | carPlate, fiscalYear, amountOriginal, dueDate, status | id, amountTnd |

**Véhicules** — `renderCars` entièrement dynamique : reconstruit `<thead>` à chaque rendu en fonction des colonnes actives (tri, filtre inline, data-col sur th et td). Pour les autres entités, les `<th>` du thead statique portent `data-col` et les `<td>` du tbody aussi ; la CSS masque/révèle les deux simultanément.

**Nouvelles colonnes DB (migration 015)** : `registration_number`, `registration_date`, `fuel_type`, `owner_name`, `purchase_price`, `purchase_date` ajoutées à la table `cars`.

**Fichiers modifiés** :
- `worksheet-mini-app/index.html` — `COL_DEFS`, `DEFAULT_COLS`, `getColPrefs/saveColPrefs/getActiveDefs/applyColPrefs/openColumnPicker`, `renderCars` (refonte complète), `renderCustomers/renderMaintenance/renderPayments/renderReservationsTable/renderInsurances/renderLeasingContracts/renderVignettes` (ajout data-col + data-entity), HTML theads mis à jour, modal `#colPickerModal`, boutons `⚙ Colonnes`, `saveAndRender` (appel `applyColPrefs`), `setupSortableTable` (data-col sur filter-row th), COLUMNS arrays mis à jour (PAYMENTS, RESERVATIONS, INSURANCES, LEASING, VIGNETTES)
- `src/backend/migrations/015_car_extra_columns.sql` — migration à exécuter dans Supabase SQL Editor

---

### 9.19 ✅ Implémenté (2026-07) — Capital (ex-Trésorerie initiale globale)

**Problème résolu** : La trésorerie initiale globale était calculée automatiquement comme la somme des trésoreries initiales par véhicule ; ce champ était en lecture seule. L'utilisateur souhaitait un capital global indépendant des véhicules, saisissable directement.

**Nouveau comportement** :
- Le champ `opening_cash_tnd` de la table `settings` est désormais le **Capital global** de l'entreprise, saisissable librement dans les paramètres.
- Le champ `opening_cash_tnd` de chaque voiture reste présent à titre informatif (non impacté sur la trésorerie globale).
- Le calcul de la trésorerie actuelle dans le dashboard utilise `state.settings.openingCashTnd` (Capital) et non plus la somme des véhicules.

**Règle annulée** : l'ancienne règle "tréso globale = Σ tréso initiale par voiture" est supprimée.

**Fichiers modifiés** :
- `worksheet-mini-app/index.html` :
  - Paramètres : label renommé en "Capital (TND)", `readonly` supprimé, style grisé supprimé
  - `populateSettingsFields` : lit `state.settings.openingCashTnd` au lieu de calculer la somme des voitures
  - `persistSettingsFromModal` : lit l'input, met à jour `state.settings.openingCashTnd`, envoie `opening_cash_tnd` dans `PUT /settings`
  - Dashboard (fonction `computeTreasury`) : `openingCash = Number(state.settings.openingCashTnd || 0)` au lieu du reduce sur les voitures

---

### 9.20 ✅ Implémenté (2026-07) — Lignes de contrat modifiables + champs entête complets

**Problèmes résolus** :
1. Les lignes de contrat étaient verrouillées dès qu'une facture brouillon existait (`isContractFactured` retournait `true` pour tout statut de facture), empêchant toute édition de dates → le changement des dates pour régénérer l'échéancier était impossible.
2. Les lignes ayant une date de fin passée affichaient `displayStatus = "terminee"` et le bouton ✎ était masqué, même si le contrat n'était pas facturé.
3. L'éditeur d'entête de contrat n'affichait que 5 champs (client, type, date signature, paiement, statut) ; les champs tarif et caution étaient absents.

**Corrections** :
- `isContractFactured(contractId)` : retourne `true` uniquement si une facture **non-brouillon** existe pour ce contrat. Les factures en statut "brouillon" ne verrouillent plus les lignes.
- `canEdit` (lignes de contrat) : autorise désormais l'édition des lignes de statut "terminee" (expiré par date) — seules les lignes "annule" et "resilie" ne sont pas éditables.
- Éditeur d'entête (mode édition) : ajout des champs `Tarif` + `Devise tarif` + `Caution` + `Devise caution`.
- Vue lecture de l'entête : affiche désormais `Tarif` et `Caution`.
- Sauvegarde de l'entête : envoie `rate`, `rate_currency`, `quotient`, `quotient_currency`, `quotient_tnd` dans `PUT /contracts/:id` et met à jour `state.contracts`.
- Backend `PUT /contract-lines/:id` : synchronise automatiquement les dates de la réservation liée (`reservation_id`) quand `period_start`/`period_end` changent.
- Frontend `saveContractLineEdit` : met à jour `state.reservations` pour la réservation liée si les dates ont changé.

**Flux schedule → nouvelles dates** : L'utilisateur peut maintenant éditer les dates des lignes → sauvegarder → cliquer "↺ Régénérer" → le backend relit les lignes en DB (avec les nouvelles dates) et génère le bon échéancier.

**Fichiers modifiés** :
- `worksheet-mini-app/index.html` — `isContractFactured`, `canEdit` (lignes), `renderContractDetailHeader` (vue lecture + vue édition + handler save)
- `src/backend/routes/contract-lines.routes.ts` — `PUT /:id` : sync réservation liée si dates changent

---

### 9.21 ✅ Implémenté (2026-07) — Diagramme de Gantt des réservations sur le dashboard

**Problème résolu** : le planning véhicules (Gantt) n'était visible que dans l'onglet Réservations, obligeant l'utilisateur à naviguer pour avoir une vue rapide de l'occupation de la flotte.

**Implémentation** :
- Nouvelle carte `cardGantt` (`dash-span-3`, pleine largeur) ajoutée sur la page d'accueil après les graphiques existants.
- Contrôles autonomes : boutons zoom (Jour/Semaine/Mois), navigation ◀/▶ (mois), filtre véhicule — état séparé du Gantt de l'onglet Réservations (`dashboardFilters.homeTimeline`, `homeTimelineCursor`).
- `renderReservationTimeline()` refactorisé pour accepter un paramètre `opts` (`containerId`, `vehicleSelectId`, `filters`, `calCursor`) — une seule fonction gère les deux instances.
- `renderHomeGantt()` appelée depuis `renderHomeDashboard()` à chaque mise à jour.
- La carte répond aux boutons toolbar (masquer/rétrécir/élargir/déplacer) comme les autres cartes du dashboard.

**Fichiers modifiés** :
- `worksheet-mini-app/index.html` — HTML de la carte, `dashboardFilters.homeTimeline`, `homeTimelineCursor`, `renderReservationTimeline(opts)`, `renderHomeGantt()`, appel dans `renderHomeDashboard()`

---

### 9.22 ✅ Implémenté (2026-07) — Suppression d'un contrat

**Problème résolu** : il n'était pas possible de supprimer un contrat créé par erreur depuis l'interface.

**Implémentation** :
- Bouton "🗑 Supprimer le contrat" ajouté dans le pied du modal de détail contrat.
- Confirmation obligatoire via `window.confirm` avant suppression.
- Backend `DELETE /contracts/:id` : vérifie l'absence de factures non-brouillon et de paiements avant de supprimer. Retourne 422 avec message explicite si des dépendances bloquantes existent.
- Les `contract_lines` sont supprimées en cascade en base (FK `ON DELETE CASCADE`).
- Les réservations liées voient leur `contract_line_id` mis à `null` (FK `ON DELETE SET NULL`).
- L'état local (`state.contracts`, `state.contractLines`, `state.invoiceSchedule`, `state.invoices`) est nettoyé immédiatement sans rechargement complet.
- Le modal se ferme et `saveAndRender()` met à jour la liste des contrats.

**Fichiers modifiés** :
- `src/backend/routes/contracts.routes.ts` — `DELETE /:id` : ajout des vérifications de sécurité
- `worksheet-mini-app/index.html` — bouton `cdlDeleteBtn`, zone d'erreur `cdlDeleteError`, handler `openContractDetail`

---

**Document Version**: 1.0  
**Last Updated**: July 2026  
**Next Review**: September 2026
