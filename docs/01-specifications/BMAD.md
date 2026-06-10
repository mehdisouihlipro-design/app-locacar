# BMAD: Business Model Analysis & Design
## LocaCar - Car Rental Management System

**Document Version**: 1.0  
**Date**: May 2026  
**Status**: In Progress  

---

## 1. Executive Summary

LocaCar is a comprehensive car rental management system designed for small-to-medium enterprises operating 20-100 vehicles across 2+ agencies. The application provides centralized management of fleet operations, financial transactions, customer relationships, and multi-agency coordination with subcontractor integration.

### Business Objectives
1. Streamline rental operations and reduce administrative overhead
2. Enable multi-agency centralized management
3. Provide real-time fleet visibility through GPS tracking
4. Automate financial operations (invoicing, payments)
5. Support subcontractor integration for flexible fleet expansion
6. Maintain comprehensive audit trails for compliance

---

## 2. Stakeholders & Users

### 2.1 Primary Stakeholders

| Stakeholder | Role | Needs |
|---|---|---|
| **Company Owner/Manager** | Business Owner | Real-time business metrics, revenue reports, fleet utilization |
| **Agency Manager** | Operations Lead | Agency-level reporting, performance metrics, staff management |
| **Rental Agent** | Customer-facing | Quick rental processing, contract generation, payment collection |
| **Field Operator** | Check-in/out | Mobile app, GPS integration, photo documentation, offline mode |
| **Accountant** | Financial Management | Invoice tracking, payment reconciliation, financial reports |
| **Maintenance Team** | Asset Management | Vehicle status, maintenance schedules, damage documentation |
| **Customer** | End User | Rental history, contract review, payment status |

### 2.2 User Roles & Permissions

```
┌─────────────────────────┐
│   System Administrator   │ (All permissions)
├─────────────────────────┤
│   Company Owner/Manager  │ (All features, company-wide)
├─────────────────────────┤
│   Agency Manager         │ (Agency-specific, reporting)
├─────────────────────────┤
│   Financial Manager      │ (Invoicing, payments, reports)
├─────────────────────────┤
│   Rental Agent           │ (Rental operations)
├─────────────────────────┤
│   Field Operator         │ (Mobile check-in/out)
├─────────────────────────┤
│   Maintenance Supervisor │ (Vehicle status, maintenance)
└─────────────────────────┘
```

---

## 3. Business Domain Analysis

### 3.1 Core Business Processes

#### Process 1: Vehicle Rental Lifecycle
```
1. Customer Inquiry
   ↓
2. Availability Check
   ↓
3. Reservation/Contract Creation
   ↓
4. Vehicle Check-out (with documentation)
   ↓
5. Rental Period (GPS tracking)
   ↓
6. Vehicle Return (with inspection)
   ↓
7. Payment Processing
   ↓
8. Invoice Generation
   ↓
9. Archive/Close
```

#### Process 2: Fleet Management
```
1. Vehicle Registration
   ↓
2. Status Assignment
   ↓
3. GPS Tracking (active rentals)
   ↓
4. Maintenance Scheduling
   ↓
5. Status Updates (manual/automatic)
```

#### Process 3: Financial Operations
```
1. Rental Contract Created
   ↓
2. Invoice Generated (base + extras)
   ↓
3. Payment Recorded
   ↓
4. Reconciliation
   ↓
5. Reporting
```

#### Process 4: Multi-Agency Operations
```
1. Primary Agency receives request
   ↓
2. Check local inventory
   ↓
3. If not available, check subcontractor inventory
   ↓
4. Create inter-agency agreement
   ↓
5. Execute rental with cost allocation
   ↓
6. Settlement between agencies
```

### 3.2 Business Entities

#### Vehicles
- Fleet vehicle or Subcontractor vehicle
- Status: Available, Reserved, Rented, Maintenance, Inactive
- Tracking: Real-time GPS, Location history
- Documentation: Photos, Inspection records, Maintenance logs

#### Customers
- Individual or Corporate
- Rental history
- Payment method
- Risk profile (insurance)

#### Agencies
- Primary agencies (company-owned)
- Subcontractor agencies (partner companies)
- Agency hierarchy and relationships

#### Contracts
- Rental agreement terms
- Insurance details
- Damage liability
- Payment terms

#### Financials
- Invoices
- Payments
- Expenses
- Revenue allocation by agency

---

## 4. Functional Requirements

### 4.1 Fleet Management Module

#### F1.1: Vehicle Inventory Management
- **Description**: Manage vehicle master data
- **Actors**: Admin, Agency Manager
- **Requirements**:
  - Add/update/delete vehicle records
  - Track vehicle specifications (model, color, VIN, license plate)
  - Manage vehicle documents (insurance, inspection, registration)
  - Assign vehicles to agencies
  - Support both owned and subcontractor vehicles

#### F1.2: Vehicle Status Management
- **Description**: Track vehicle availability and status
- **Actors**: All users
- **Requirements**:
  - Real-time status display (Available, Reserved, Rented, Maintenance, Inactive)
  - Status change audit trail
  - Automatic status updates from contracts
  - Maintenance scheduling

#### F1.3: GPS Tracking & Monitoring
- **Description**: Real-time vehicle location tracking
- **Actors**: Agency Manager, Field Operator
- **Requirements**:
  - Real-time GPS coordinates
  - Historical location tracking
  - Geofencing alerts
  - Speed monitoring
  - Route history

#### F1.4: Vehicle Check-in/Check-out
- **Description**: Document vehicle condition at rental start/end
- **Actors**: Field Operator, Rental Agent
- **Requirements**:
  - Photo documentation (exterior, interior, damage)
  - Mileage recording
  - Fuel level recording
  - Damage assessment and documentation
  - Mobile-friendly interface
  - Offline capability

---

### 4.2 Rental Operations Module

#### F2.1: Contract Management
- **Description**: Create and manage rental contracts
- **Actors**: Rental Agent, Agency Manager
- **Requirements**:
  - Contract template management
  - Rental agreement generation
  - Insurance assignment
  - Damage liability terms
  - Payment terms configuration
  - Contract signing (digital or manual)
  - Contract status tracking (Draft, Active, Completed, Cancelled)

#### F2.2: Reservation System
- **Description**: Manage vehicle reservations
- **Actors**: Rental Agent, Customer
- **Requirements**:
  - Availability calendar view
  - Reservation creation
  - Automatic vehicle hold (time-based)
  - Reservation cancellation with policy
  - Overbooking prevention

#### F2.3: Customer Management
- **Description**: Manage customer relationships
- **Actors**: Rental Agent, Agency Manager
- **Requirements**:
  - Customer profile creation
  - Rental history tracking
  - Document management (ID, driving license, insurance)
  - Risk classification
  - Loyalty/VIP management

---

### 4.3 Financial Module

#### F3.1: Invoice Management
- **Description**: Generate and manage invoices
- **Actors**: Financial Manager, Rental Agent
- **Requirements**:
  - Automatic invoice generation from contracts
  - Manual invoice creation (free invoices for extras/out-of-contract services, linked or not to a contract)
  - Invoice line items (rental fee, insurance, extras, damage, late fees)
  - Multi-currency support
  - Tax calculation
  - Invoice templates
  - Invoice status tracking (Draft, Issued, Paid, Overdue, Cancelled)

#### F3.2: Payment Processing
- **Description**: Record and manage payments
- **Actors**: Financial Manager, Rental Agent, Customer
- **Requirements**:
  - Multiple payment methods (cash, card, check, bank transfer)
  - Partial payment support
  - Payment reconciliation
  - Receipt generation
  - Payment history

#### F3.3: Financial Reporting
- **Description**: Generate financial reports
- **Actors**: Financial Manager, Owner
- **Requirements**:
  - Revenue by agency/period
  - Outstanding invoices
  - Payment collection rate
  - Expense reports
  - Profit analysis
  - Per-vehicle profitability: generated revenue, expenses by category (maintenance, leasing, insurance, vignette) and resulting balance, viewable monthly and yearly ("Rentabilité" tab)

---

### 4.4 Multi-Agency Module

#### F4.1: Agency Management
- **Description**: Manage multiple agencies and subcontractors
- **Actors**: Company Owner, System Admin
- **Requirements**:
  - Agency registration (owned/subcontractor)
  - Agency hierarchy
  - Agency contact information
  - Commission/cost-sharing rules
  - Agency-specific settings

#### F4.2: Inter-Agency Vehicle Sharing
- **Description**: Enable vehicle sharing between agencies
- **Actors**: Agency Manager
- **Requirements**:
  - Check availability across agencies
  - Inter-agency rental agreement
  - Cost allocation rules
  - Revenue sharing calculation
  - Settlement tracking

#### F4.3: Subcontractor Integration
- **Description**: Manage subcontractor relationships
- **Actors**: Company Owner, Agency Manager
- **Requirements**:
  - Subcontractor vehicle catalog access
  - Rental through subcontractor
  - Cost negotiation
  - Commission calculation
  - Performance tracking

---

### 4.5 Reporting & Analytics Module

#### F5.1: Business Intelligence
- **Description**: Analyze business metrics
- **Actors**: Owner, Agency Manager
- **Requirements**:
  - Fleet utilization rate
  - Revenue trends
  - Customer acquisition cost
  - Vehicle downtime analysis
  - Agency performance comparison

#### F5.2: Audit & Compliance
- **Description**: Maintain compliance records
- **Actors**: Compliance Officer, Owner
- **Requirements**:
  - Audit trail for all transactions
  - Document archival
  - Regulatory reporting
  - Data retention policies

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- API response time: < 200ms (p95)
- Real-time GPS update: < 10 seconds
- Concurrent users: 500+
- Data throughput: 1000+ transactions/minute

### 5.2 Security Requirements
- Authentication: JWT + OAuth 2.0
- Authorization: Role-based access control (RBAC)
- Data encryption: TLS in transit, AES-256 at rest
- Audit logging: All operations logged
- PCI-DSS compliance for payment data

### 5.3 Availability Requirements
- Uptime: 99.5%
- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 15 minutes

### 5.4 Scalability Requirements
- Horizontal scaling for API servers
- Database scaling: Connection pooling, read replicas
- Caching: Redis for frequently accessed data
- CDN: Static assets and photos

### 5.5 Usability Requirements
- Mobile-first design
- Offline capability for field operations
- Accessibility: WCAG 2.1 AA compliance
- Multi-language support (initial: EN, FR)

---

## 6. Business Rules

### 6.1 Rental Rules
- BR1: Vehicle cannot be rented if status ≠ "Available"
- BR2: Minimum rental duration: 1 day, Maximum: 365 days
- BR3: Late return charges: +50% of daily rate per day
- BR4: Damage deposit: 20% of total rental cost (refundable)
- BR5: Cancellation: Free up to 48h before, 50% charge after

### 6.2 Financial Rules
- BR6: Invoice must be created within 24 hours of contract completion
- BR7: Payment due: 30 days from invoice date
- BR8: Multi-agency rental: Cost = base_cost + subcontractor_markup (10-20%)
- BR9: Commission: Agency receives 80% of rental fee, company 20%
- BR15: Calcul HT ⇄ TTC (règles tunisiennes, paramétrables dans `Paramètres → Paramètres de facturation`) :
  - Le tarif du contrat (`rate`) est le montant **HT**
  - `TVA = montant_HT × taux_TVA / 100` (taux par défaut : 19 %, paramétrable)
  - `Taxe journalière = nb_jours_location × taxe_par_jour` (montant par défaut : 2 TND/jour, paramétrable)
  - `Timbre fiscal` = montant fixe pour toute la location (par défaut : 1 TND, paramétrable)
  - `Montant_TTC = montant_HT + TVA + Taxe_journalière + Timbre` — c'est ce montant TTC qui constitue le `amount_tnd` facturé/dû au client
  - Le sens inverse (TTC → HT) est disponible pour ré-éditer une facture à partir d'un montant TTC cible
- BR15bis: Facture multi-lignes (1 ligne = 1 contrat + 1 véhicule) :
  - Une facture peut contenir plusieurs lignes, chacune liée à un contrat et un véhicule différents
  - Pour chaque ligne : `TVA_ligne = HT_ligne × taux_TVA / 100` et `Taxe_journalière_ligne = nb_jours_ligne × taxe_par_jour` (la taxe journalière est donc calculée **par véhicule/par ligne**, pas globalement)
  - Le `Timbre fiscal` reste un montant fixe appliqué **une seule fois pour toute la facture** (pas par ligne)
  - Les totaux de la facture (`amount_ht`, `vat_amount`, `daily_tax_amount`, `amount_tnd`) sont la somme des lignes + le timbre fiscal une seule fois

### 6.3 Fleet Rules
- BR10: Vehicle must pass inspection every 6 months
- BR11: Vehicle maintenance: Every 50,000 km or 6 months
- BR12: Insurance required: Third-party minimum
- BR13: GPS tracking: Mandatory for vehicles > $20,000

### 6.4 User Rules
- BR14: User must belong to exactly one agency
- BR15: User role determines module access
- BR16: Password reset required every 90 days
- BR17: Two-factor authentication for admin users

---

## 7. System Architecture

### 7.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Client Layer                            │
├──────────────┬──────────────────┬───────────────────────┤
│  React Web   │  React Native    │  Admin Dashboard      │
│  Dashboard   │  Mobile App      │  (Desktop)            │
└──────────────┴──────────────────┴───────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer                  │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│                  Backend Services                         │
├────────────┬─────────────┬──────────┬──────────┬────────┤
│ Auth       │ Rental      │ Financial│ Fleet    │Reports │
│ Service    │ Service     │ Service  │ Service  │Service │
└────────────┴─────────────┴──────────┴──────────┴────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│                   Data Layer                              │
├──────────────┬──────────────┬──────────┬────────────────┤
│  PostgreSQL  │  Redis Cache │  S3 File │ ElasticSearch  │
│  (Primary)   │  (Session)   │ Storage  │ (Analytics)    │
└──────────────┴──────────────┴──────────┴────────────────┘
```

### 7.2 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend API | Node.js + Express/NestJS | Fast, scalable, JS ecosystem |
| Frontend | React 18 + TypeScript | Rich UI, component reusability |
| Mobile | React Native | iOS/Android from single codebase |
| Database | PostgreSQL | ACID compliance, JSON support |
| Cache | Redis | Fast session/data caching |
| Auth | JWT + OAuth 2.0 | Stateless, widely supported |
| File Storage | AWS S3 / MinIO | Scalable image/document storage |
| Real-time | Socket.io | GPS updates, notifications |
| Deployment | Docker + K8s | Container orchestration |

---

## 8. Data Model Overview

### 8.1 Core Entities

```
AGENCIES
├── agency_id (PK)
├── agency_name
├── agency_type (owned/subcontractor)
├── contact_info
└── commission_rate

VEHICLES
├── vehicle_id (PK)
├── agency_id (FK)
├── vehicle_type
├── registration_number
├── status
├── gps_location
└── last_check_in

CUSTOMERS
├── customer_id (PK)
├── customer_type (individual/corporate)
├── name/company_name
├── contact_info
└── risk_classification

CONTRACTS
├── contract_id (PK)
├── customer_id (FK)
├── vehicle_id (FK)
├── rental_start_date
├── rental_end_date
├── rental_status
└── total_amount

INVOICES
├── invoice_id (PK)
├── contract_id (FK)
├── invoice_date
├── due_date
├── total_amount
└── invoice_status

PAYMENTS
├── payment_id (PK)
├── invoice_id (FK)
├── payment_date
├── payment_method
└── amount

VEHICLE_CHECKS
├── check_id (PK)
├── vehicle_id (FK)
├── contract_id (FK)
├── check_type (check_in/check_out)
├── mileage
├── fuel_level
└── photos (S3 references)
```

---

## 9. Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)
- User authentication & authorization
- Vehicle & agency management
- Basic rental operations
- Simple invoicing

### Phase 2: Enhanced Features (Weeks 5-8)
- GPS tracking integration
- Photo documentation
- Multi-agency support
- Payment processing

### Phase 3: Advanced Features (Weeks 9-12)
- Analytics & reporting
- Subcontractor integration
- Mobile app
- Advanced financial reporting

### Phase 4: Optimization (Weeks 13+)
- Performance tuning
- Scaling implementation
- Advanced security
- Additional integrations

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| System Uptime | 99.5% | Monitoring dashboards |
| API Response Time | < 200ms (p95) | APM tools |
| User Adoption | > 80% in 3 months | Usage analytics |
| Data Accuracy | 99.9% | Audit reports |
| Customer Satisfaction | > 4.5/5 | Survey scores |

---

## 11. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| GPS integration delays | Medium | High | Early vendor evaluation, backup plan |
| Data security breach | Low | Critical | Encryption, security audits, insurance |
| User adoption resistance | Medium | Medium | Training programs, change management |
| Multi-agency coordination complexity | High | Medium | Clear SLAs, escalation procedures |

---

## 12. Appendix: Glossary

- **Agency**: Operating unit (company-owned or subcontractor)
- **Contract**: Rental agreement between customer and agency
- **Vehicle Check**: Documentation of vehicle condition (check-in/out)
- **GPS Tracking**: Real-time vehicle location monitoring
- **Multi-tenancy**: Multiple agencies on single platform
- **Subcontractor**: Third-party providing vehicles/services

---

**Document Status**: Living Document - Version 1.0
**Last Review**: May 2026
**Next Review**: June 2026
