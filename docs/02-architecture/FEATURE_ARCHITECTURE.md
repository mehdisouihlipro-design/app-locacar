# LocaCar - Feature Architecture & Modules

**Version**: 1.0  
**Last Updated**: May 2026

---

## System Module Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   LocaCar Application                             │
├──────────────┬──────────────┬──────────┬───────────┬────────────┤
│ Fleet Mgmt   │ Rental Ops   │ Financial│ Analytics │Multi-Agency│
├──────────────┼──────────────┼──────────┼───────────┼────────────┤
│ • Vehicles   │ • Contracts  │ • Invoice│ • Reports │ • Agencies │
│ • GPS Trace  │ • Customers  │ • Payments           │ • Sharing  │
│ • Checks     │ • Reserv.    │ • Reconcil.         │ • Subcontr.│
│ • Maint.     │ • Insurance  │                      │            │
└──────────────┴──────────────┴──────────┴───────────┴────────────┘
```

---

## 1. Fleet Management Module

### 1.1 Component Structure

```
fleet-management/
├── vehicles/
│   ├── VehicleListController
│   ├── VehicleDetailController
│   ├── VehicleFormComponent
│   ├── VehicleService
│   └── Vehicle Model
├── gps/
│   ├── GPSTrackingService
│   ├── TrackingDashboard
│   ├── GPSMapper
│   └── GeofenceManager
├── checks/
│   ├── CheckFormController
│   ├── PhotoUploadService
│   ├── CheckInspectionService
│   └── DamageAssessment
└── maintenance/
    ├── MaintenanceScheduler
    ├── MaintenanceHistory
    └── ServiceAlerts
```

### 1.2 Data Flow

```
User Request
    ↓
VehicleController (Express)
    ↓
VehicleService (Business Logic)
    ↓
VehicleRepository (Data Access)
    ↓
PostgreSQL
    ↓
Cache (Redis)
    ↓
Response
```

### 1.3 Key Endpoints

```
GET    /vehicles                    # List vehicles
POST   /vehicles                    # Create vehicle
GET    /vehicles/{id}               # Get details
PUT    /vehicles/{id}               # Update vehicle
DELETE /vehicles/{id}               # Delete vehicle

GET    /vehicles/{id}/gps-location  # Real-time location
GET    /vehicles/{id}/gps-history   # Location history
POST   /vehicles/{id}/status-change # Change status

POST   /vehicle-checks              # Create check
POST   /vehicle-checks/{id}/photos  # Upload photos
GET    /vehicle-checks/{id}         # Get check details
```

### 1.4 Frontend Components

```
VehicleListPage
├── VehicleFilters
│   ├── StatusFilter
│   ├── TypeFilter
│   └── AgencyFilter
├── VehicleTable
│   ├── VehicleRow (clickable)
│   └── ActionButtons
└── Pagination

VehicleDetailPage
├── VehicleInfo
│   ├── BasicInfo
│   ├── Documents
│   └── Insurance
├── GPSTracker
│   ├── Map (Google Maps)
│   ├── Location History
│   └── Geofences
└── MaintenanceLog

CheckInOutForm
├── VehicleVerification
├── LocationCheck
├── MileageForm
├── FuelForm
├── DamageAssessment
├── PhotoCapture
└── SignaturePad
```

---

## 2. Rental Operations Module

### 2.1 Component Structure

```
rental-operations/
├── contracts/
│   ├── ContractController
│   ├── ContractService
│   ├── PricingEngine
│   ├── ContractGenerator
│   └── DigitalSignature
├── customers/
│   ├── CustomerController
│   ├── CustomerService
│   ├── RiskAssessment
│   └── DocumentVerification
├── reservations/
│   ├── ReservationController
│   ├── AvailabilityService
│   ├── HoldManager
│   └── OverBookingPrevention
└── insurance/
    ├── InsuranceManager
    └── CoverageCalculator
```

### 2.2 Contract Lifecycle

```
DRAFT
├─ Input customer/vehicle
├─ Calculate pricing
├─ Select insurance
└─ Review terms
    ↓
CONFIRMED
├─ Customer signed
├─ Payment info verified
└─ Ready for pickup
    ↓
ACTIVE
├─ Vehicle checked out
├─ GPS tracking enabled
└─ Rental running
    ↓
COMPLETED
├─ Vehicle returned
├─ Inspection done
├─ Invoice created
└─ Payment processed
    
CANCELLED (any time before completion)
├─ Refund calculated
├─ Deposit handling
└─ Status logged
```

### 2.3 Key Endpoints

```
POST   /contracts                   # Create contract
GET    /contracts                   # List contracts
GET    /contracts/{id}              # Get contract
PUT    /contracts/{id}              # Update contract
POST   /contracts/{id}/confirm      # Confirm
POST   /contracts/{id}/complete     # Complete
POST   /contracts/{id}/cancel       # Cancel
GET    /contracts/{id}/pdf          # Download PDF

POST   /customers                   # Register customer
GET    /customers                   # List customers
GET    /customers/{id}              # Get profile
PUT    /customers/{id}              # Update profile
GET    /customers/{id}/rental-history

GET    /availability                # Check availability
POST   /reservations                # Create reservation
GET    /reservations/{id}           # Get reservation
POST   /reservations/{id}/confirm   # Confirm
POST   /reservations/{id}/cancel    # Cancel
```

### 2.4 Frontend Components

```
ContractWizard
├── Step 1: SelectCustomer
│   ├── NewCustomerForm
│   └── ExistingCustomerSearch
├── Step 2: SelectVehicle
│   ├── AvailabilityCalendar
│   ├── VehicleFilter
│   └── VehicleDetails
├── Step 3: SetDates
│   ├── StartDatePicker
│   ├── EndDatePicker
│   └── DurationDisplay
├── Step 4: SelectExtras
│   ├── InsuranceOption
│   ├── GPSRental
│   ├── AdditionalDriver
│   └── PriceBreakdown
├── Step 5: Review
│   ├── ContractSummary
│   ├── TermsAcceptance
│   └── DigitalSignature
└── Step 6: Confirmation
    ├── ContractNumber
    └── DownloadPDF

CustomerProfile
├── PersonalInfo
├── IdentityDocuments
├── RentalHistory
├── RiskScore
└── Preferences

AvailabilityCalendar
├── DateRange View
├── Vehicle Type Filter
├── Price Per Day Display
└── Booking Button
```

---

## 3. Financial Management Module

### 3.1 Component Structure

```
financial-management/
├── invoices/
│   ├── InvoiceController
│   ├── InvoiceService
│   ├── InvoiceGenerator
│   └── InvoiceTemplateManager
├── payments/
│   ├── PaymentController
│   ├── PaymentGateway (Stripe)
│   ├── ReconciliationEngine
│   └── PaymentMethods
├── accounting/
│   ├── GeneralLedger
│   ├── TaxCalculator
│   └── AuditTrail
└── reporting/
    ├── RevenueReports
    ├── OutstandingInvoices
    └── ExpenseAnalysis
```

### 3.2 Invoice State Machine

```
DRAFT
├─ Create from contract
├─ Add line items
└─ Calculate totals
    ↓
ISSUED
├─ Generate PDF
├─ Send to customer
└─ Set due date
    ↓
PARTIALLY_PAID
├─ Receive payment
├─ Update balance
└─ Continue tracking

PAID
├─ Mark complete
├─ Record all payments
└─ Archive

OVERDUE
├─ Past due date
├─ Send reminders
└─ Track aging
    
CANCELLED
└─ Record reason
```

### 3.3 Key Endpoints

```
POST   /invoices                    # Create invoice
GET    /invoices                    # List invoices
GET    /invoices/{id}               # Get invoice
PUT    /invoices/{id}               # Update (draft only)
POST   /invoices/{id}/issue         # Issue invoice
GET    /invoices/{id}/pdf           # Download PDF
POST   /invoices/{id}/email         # Email invoice

POST   /payments                    # Record payment
GET    /payments                    # List payments
GET    /payments/{id}               # Get payment
POST   /invoices/{id}/payment-reminder

GET    /reports/revenue             # Revenue report
GET    /reports/outstanding         # Outstanding report
GET    /reports/expense             # Expense report
GET    /reconciliation              # Reconciliation report
```

### 3.4 Frontend Components

```
InvoiceManager
├── InvoiceList
│   ├── StatusFilter
│   ├── DateRangeFilter
│   └── InvoiceTable
└── InvoiceDetail
    ├── InvoiceHeader
    ├── LineItems
    ├── Totals
    └── ActionButtons

PaymentRecorder
├── InvoiceSelector
├── PaymentMethodSelect
├── AmountInput
├── TransactionDetails
└── Confirmation

FinancialDashboard
├── RevenueSummary
│   ├── TotalInvoiced
│   ├── TotalCollected
│   └── Outstanding
├── PaymentChart
├── OverdueAlert
└── RecentTransactions

ReportGenerator
├── ReportTypeSelect
├── DateRangeFilter
├── AgencyFilter
├── ExportOptions
└── Report Preview
```

---

## 4. Multi-Agency Module

### 4.1 Component Structure

```
multi-agency/
├── agency-management/
│   ├── AgencyController
│   ├── AgencyService
│   └── CommissionCalculator
├── inter-agency-sharing/
│   ├── VehicleSharingService
│   ├── CostAllocationEngine
│   └── SettlementProcessor
├── subcontractor/
│   ├── SubcontractorManager
│   ├── IntegrationGateway
│   └── PerformanceTracker
└── tenant-isolation/
    ├── TenantMiddleware
    ├── DataIsolation
    └── RoleMapping
```

### 4.2 Agency Hierarchy

```
Parent Company (Owner)
├── Agency 1 (Owned)
│   ├── Vehicles
│   ├── Customers
│   └── Contracts
├── Agency 2 (Owned)
│   ├── Vehicles
│   ├── Customers
│   └── Contracts
└── Subcontractor A
    ├── Vehicles (shared)
    ├── Commission Rate: 15%
    └── Settlement: Monthly
```

### 4.3 Key Endpoints

```
POST   /agencies                    # Create agency
GET    /agencies                    # List agencies
GET    /agencies/{id}               # Get agency
PUT    /agencies/{id}               # Update agency

GET    /agencies/{id}/vehicles      # Agency vehicles
GET    /agencies/{id}/revenue       # Agency revenue
GET    /agencies/{id}/performance   # Performance metrics

POST   /vehicle-sharing             # Request vehicle share
GET    /vehicle-sharing/{id}        # Get share details
POST   /vehicle-sharing/{id}/settle # Settle payment

GET    /subcontractors              # List subcontractors
POST   /subcontractors/rental       # Rent from subcontractor
GET    /settlements                 # Settlement history
```

---

## 5. Reporting & Analytics Module

### 5.1 Component Structure

```
reporting-analytics/
├── dashboards/
│   ├── ExecutiveDashboard
│   ├── OperationalDashboard
│   ├── FinancialDashboard
│   └── WidgetFactory
├── reports/
│   ├── ReportGenerator
│   ├── ReportScheduler
│   ├── ReportTemplates
│   └── ExportManager
├── analytics/
│   ├── MetricsCollector
│   ├── TrendAnalyzer
│   └── PredictiveAnalytics
└── notifications/
    ├── AlertManager
    ├── EmailNotifier
    └── DashboardAlerts
```

### 5.2 Key Metrics

```
Fleet Metrics
├─ Utilization Rate = (Rented / Total) × 100
├─ Downtime Hours
├─ Maintenance Frequency
├─ Average Fleet Age
└─ Fuel Efficiency

Financial Metrics
├─ Daily Revenue
├─ Revenue per Vehicle
├─ Average Contract Value
├─ Payment Collection Rate
├─ Profit Margin
└─ Customer Lifetime Value

Operational Metrics
├─ Booking Conversion Rate
├─ Average Rental Duration
├─ Same-Day Rental %
├─ Repeat Customer %
├─ Damage Rate
└─ Late Return Rate

Customer Metrics
├─ New Customers
├─ Repeat Customers
├─ Customer Satisfaction
├─ Churn Rate
└─ Average Rating
```

### 5.3 Key Endpoints

```
GET    /dashboards/executive        # Executive dashboard
GET    /dashboards/operational      # Operations dashboard
GET    /dashboards/financial        # Financial dashboard

GET    /reports/revenue             # Revenue analysis
GET    /reports/fleet-utilization   # Fleet metrics
GET    /reports/customer            # Customer analytics
GET    /reports/maintenance         # Maintenance schedule
GET    /reports/export              # Export data

GET    /metrics/daily               # Daily metrics
GET    /metrics/monthly             # Monthly metrics
GET    /metrics/trending            # Trend analysis
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
User Credentials
    ↓
Authentication Service
├─ Hash & Compare Password
├─ Generate JWT Token
├─ Generate Refresh Token
└─ Store Session
    ↓
Access Token (24h)
Refresh Token (7d)
    ↓
Client Stores Tokens
    ↓
All Requests Include Token
    ↓
Middleware Validates Token
├─ Check Signature
├─ Check Expiry
└─ Extract Claims
    ↓
Request Proceeds
```

### 6.2 RBAC Matrix

```
               Admin | Owner | Manager | Agent | Operator | Accountant
─────────────────────────────────────────────────────────────────────
View Vehicles    ✓      ✓        ✓        ✓       ✓           ✓
Add Vehicle      ✓      ✓        ✓        -       -           -
Edit Vehicle     ✓      ✓        ✓        -       -           -
Delete Vehicle   ✓      -        -        -       -           -

View Contracts   ✓      ✓        ✓        ✓       -           ✓
Create Contract  ✓      ✓        ✓        ✓       -           -
Edit Contract    ✓      ✓        ✓        ✓       -           -

View Invoices    ✓      ✓        ✓        ✓       -           ✓
Create Invoice   ✓      ✓        ✓        -       -           ✓
Record Payment   ✓      ✓        ✓        ✓       -           ✓

View Reports     ✓      ✓        ✓        -       -           ✓
Export Data      ✓      ✓        ✓        -       -           ✓

Check-in/out     ✓      ✓        ✓        ✓       ✓           -
Upload Photos    ✓      ✓        ✓        ✓       ✓           -

Manage Users     ✓      ✓        -        -       -           -
Manage Agencies  ✓      ✓        -        -       -           -
```

---

## 7. Cross-Cutting Concerns

### 7.1 Middleware Stack

```
Request
    ↓
RequestLogger (log all requests)
    ↓
CORS Handler (origin validation)
    ↓
BodyParser (JSON parsing)
    ↓
Authentication (JWT validation)
    ↓
Authorization (RBAC check)
    ↓
Validation (input validation)
    ↓
RateLimiting (throttle requests)
    ↓
Business Logic (handler)
    ↓
ErrorHandler (catch exceptions)
    ↓
ResponseFormatter (standardize output)
    ↓
Logger (log response)
    ↓
Response
```

### 7.2 Error Handling

```
Application Exception
    ↓
Error Handler Middleware
├─ Log error
├─ Sanitize message
├─ Set HTTP status
└─ Format response
    ↓
Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message"
  }
}
```

---

## 8. Development Patterns

### 8.1 Service Pattern

```typescript
// Service handles business logic
class ContractService {
  constructor(
    private contractRepo: ContractRepository,
    private vehicleService: VehicleService,
    private pricingEngine: PricingEngine,
    private invoiceService: InvoiceService
  ) {}

  async createContract(data: CreateContractDTO): Promise<Contract> {
    // Validation
    // Business logic
    // Database operations
    // Trigger events
    // Return result
  }
}
```

### 8.2 Controller Pattern

```typescript
// Controller handles HTTP
class ContractController {
  constructor(private contractService: ContractService) {}

  async create(req: Request, res: Response): Promise<void> {
    // Parse request
    // Validate input
    // Call service
    // Format response
    // Send response
  }
}
```

### 8.3 Repository Pattern

```typescript
// Repository handles data access
class ContractRepository {
  async findById(id: UUID): Promise<Contract | null>
  async save(contract: Contract): Promise<Contract>
  async findByCustomer(customerId: UUID): Promise<Contract[]>
  async delete(id: UUID): Promise<void>
}
```

---

## 9. Testing Strategy

### 9.1 Test Pyramid

```
         E2E Tests (10%)
        ┌────────────┐
       │ Integration │ (20%)
      │   Tests      │
    ┌──────────────┐
   │  Unit Tests   │ (70%)
  └────────────────┘
```

### 9.2 Test Organization

```
tests/
├── unit/
│   ├── services/
│   ├── models/
│   └── utils/
├── integration/
│   ├── contracts/
│   ├── invoices/
│   └── payments/
└── e2e/
    ├── rental-flow.test.ts
    ├── payment-flow.test.ts
    └── reporting-flow.test.ts
```

---

## 10. Performance Optimization

### 10.1 Caching Strategy

```
Request
    ↓
Check Cache (Redis)
├─ Hit → Return
└─ Miss → Database
         ↓
         Store in Cache
         ↓
         Return
```

### 10.2 Database Query Optimization

- Indexes on foreign keys
- Composite indexes for common queries
- Query pagination (20-100 items)
- Lazy loading of relationships
- Connection pooling

### 10.3 Frontend Optimization

- Code splitting
- Lazy loading routes
- Image optimization
- Bundle analysis
- State normalization

---

**Document Version**: 1.0  
**Last Updated**: May 2026
