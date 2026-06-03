# LocaCar Database Documentation Index

**Last Updated**: June 2026  
**Status**: ✅ Complete and Cross-Referenced

---

## 📚 Documentation Map

### Core Database Documentation

| Document | Location | Purpose | Key Content |
|----------|----------|---------|------------|
| **Schema Reference** | `docs/03-data-model/SCHEMA_REFERENCE.md` | Complete database schema | 15+ tables, fields, relationships, indexes |
| **Database Setup** | `docs/03-data-model/DATABASE_SETUP.md` | Connection & deployment | Local/cloud setup, migrations, seeding |
| **Update Summary** | `docs/03-data-model/DOCUMENTATION_UPDATE.md` | Change documentation | What was created/updated and why |

### Related Documentation

| Document | Location | References |
|----------|----------|------------|
| README | `README.md` | Links to schema guides |
| Setup Guide | `SETUP.md` | References new schema docs |
| API Reference | `docs/05-api/API_REFERENCE.md` | Links to schema for field mappings |

---

## 🚀 Quick Navigation

### For Database Administrators
1. Start: [Database Setup Guide](docs/03-data-model/DATABASE_SETUP.md)
   - Choose Supabase or Local PostgreSQL
   - Configure connection
   - Deploy schema
   - Seed data

### For Backend Developers
1. Start: [Schema Reference](docs/03-data-model/SCHEMA_REFERENCE.md)
   - Understand table structures
   - Review field types and constraints
   - Check relationships
   - See indexes for optimization

### For API Developers
1. Start: [API Reference](docs/05-api/API_REFERENCE.md)
   - See available endpoints
   - Reference: [Schema Reference](docs/03-data-model/SCHEMA_REFERENCE.md) for field types
   - Reference: [Database Setup](docs/03-data-model/DATABASE_SETUP.md) for connection details

### For Frontend Developers
1. Use: [API Reference](docs/05-api/API_REFERENCE.md)
   - API endpoints and payloads
   - Reference: [Schema Reference](docs/03-data-model/SCHEMA_REFERENCE.md) for field mappings

---

## 📖 What Each Document Covers

### SCHEMA_REFERENCE.md
**18,400+ words** | **Complete Technical Reference**

```
├── Database Overview
├── Global Configuration (Settings)
├── User Management (Users, Audit Logs)
├── Core Entities (Customers, Cars)
├── Rental Operations (Reservations, Contracts)
├── Financial Management (Invoices, Payments, Collections)
├── Vehicle Maintenance (Maintenance Costs, Insurances, Leasing)
├── Inspections & Documentation
├── GPS Tracking
├── All Indexes
└── Best Practices
```

**Use when**: You need to understand:
- Table structure and fields
- Data types and constraints
- Relationships and foreign keys
- Status values and enumerations
- How data flows through the system

### DATABASE_SETUP.md
**10,200+ words** | **Practical Setup Guide**

```
├── Quick Setup
├── Supabase Configuration (Cloud)
├── Local PostgreSQL Setup
├── Connection Testing
├── Schema Deployment (3 methods)
├── Seeding Data
├── Troubleshooting
└── Next Steps
```

**Use when**: You need to:
- Set up a new database
- Connect to Supabase or local PostgreSQL
- Deploy the schema
- Seed sample data
- Debug connection issues
- Verify everything works

### DOCUMENTATION_UPDATE.md
**6,600+ words** | **Change Summary**

```
├── Overview of Changes
├── Files Created/Updated
├── Documentation Structure
├── Key Information Documented
├── Deployment Instructions
├── Compliance Verification
└── Future Recommendations
```

**Use when**: You need to:
- Understand what was documented
- See the compliance status
- Find where to make future updates
- Reference what's still needed

---

## 🔗 Cross-References

### From README.md
```markdown
[Schema Reference](docs/03-data-model/SCHEMA_REFERENCE.md)
[Database Setup Guide](docs/03-data-model/DATABASE_SETUP.md)
```

### From SETUP.md
```markdown
├── 03-data-model/
│   ├── DATA_MODEL.md (legacy)
│   └── SCHEMA_REFERENCE.md (current)
```

### From API_REFERENCE.md
```markdown
[Database Schema Reference](../03-data-model/SCHEMA_REFERENCE.md)
[Database Setup Guide](../03-data-model/DATABASE_SETUP.md)
```

---

## 📊 Schema Summary

### Tables (15 total)

**Configuration**
- `settings` - Global app configuration

**User Management**
- `users` - User accounts and authentication
- `audit_logs` - User action tracking

**Core Data**
- `customers` - Customer/client information
- `cars` - Vehicle fleet inventory

**Rental Operations**
- `reservations` - Booking/reservation holds
- `contracts` - Formal rental agreements

**Financial**
- `invoices` - Billing documents
- `payments` - Payment transactions
- `collections` - Collection tracking

**Vehicle Management**
- `maintenance_costs` - Repair/maintenance records
- `insurances` - Insurance policies
- `insurance_installments` - Insurance payment schedule
- `leasing_contracts` - Vehicle leasing agreements
- `leasing_installments` - Leasing payment schedule
- `vignettes` - Annual vehicle taxes

**Operations**
- `inspections` - Vehicle state documentation
- `inspection_details` - Inspection checklist items
- `gps_tracking` - Real-time location data

### Indexes (18 total)
- Customer/car lookups: `customers(name)`, `cars(plate)`, `cars(status)`
- Foreign key columns: `reservations(customer_id/car_id)`, etc.
- Status/date queries: `reservations(status)`, `payments(payment_date)`, etc.
- Real-time tracking: `gps_tracking(car_id)`, `gps_tracking(tracked_at)`

---

## 🔑 Key Concepts

### Multi-Currency
- **Base currency**: TND (Tunisian Dinar)
- **Fields**: `amount_original`, `currency`, `amount_tnd`
- **Exchange rate**: Stored in `settings.eur_to_tnd`

### Status Tracking
- **Vehicles**: disponible, reserve, en_location, maintenance, indisponible
- **Contracts**: active, completed, cancelled
- **Invoices**: en_attente, partielle, payee, en_retard, annulee
- **Payments**: multiple methods (cash, cheque, transfer, card, online)

### Document Management
- **Inspections**: Check-in/check-out with photo attachments
- **Insurance**: Policy documents with attachments
- **Leasing**: Contract documents with attachments
- **Vignettes**: Tax document attachments

### Real-Time Tracking
- GPS data updated via IoT devices
- Location + speed + accuracy + altitude
- Indexed for efficient queries
- Archive old data for performance

---

## 📋 Deployment Checklist

- [ ] Choose database (Supabase ☁️ or Local 🖥️)
- [ ] Read DATABASE_SETUP.md
- [ ] Configure environment (.env)
- [ ] Test connection
- [ ] Deploy schema
- [ ] Seed sample data
- [ ] Run API tests
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitor in production

---

## 🔄 Maintenance Guide

### When Adding New Features

1. **Update Schema**
   - Edit `src/backend/schema.sql`
   - Create migration if needed

2. **Document Changes**
   - Update `SCHEMA_REFERENCE.md` with table changes
   - Add status values if new ones created
   - Update `DATABASE_SETUP.md` if setup process changes

3. **Cross-Reference**
   - Update `API_REFERENCE.md` with new endpoints
   - Update `README.md` if major features added
   - Update `SETUP.md` if structure changes

4. **Update Summary**
   - Log changes in `DOCUMENTATION_UPDATE.md`
   - Include date and version number

---

## 🎯 Table Lookup Quick Reference

| Need | See Table | Primary Use |
|------|-----------|------------|
| Create rental | `contracts` | Formal agreement |
| Track payment | `payments` | Record transaction |
| Check car status | `cars` | Availability |
| Find customer | `customers` | Client lookup |
| Inspect vehicle | `inspections` | State documentation |
| Track location | `gps_tracking` | Real-time position |
| Insurance info | `insurances` | Coverage details |
| Maintenance cost | `maintenance_costs` | Expense tracking |
| Revenue report | `invoices` | Financial tracking |
| User actions | `audit_logs` | Compliance tracking |

---

## 📞 Support References

**Schema Questions** → See `SCHEMA_REFERENCE.md`  
**Setup Issues** → See `DATABASE_SETUP.md` Troubleshooting  
**API Questions** → See `API_REFERENCE.md`  
**Project Structure** → See `README.md` or `SETUP.md`

---

## ✨ Documentation Compliance

This documentation update fulfills the LocaCar project rule:

> **"A chaque modification, il faut mettre à jour toute la documentation"**  
> (With every modification, all documentation must be updated)

✅ **Completed**:
- Schema documentation created
- Setup guide created
- Cross-references added
- Related files updated
- Change summary documented
- Index/navigation created

---

**Last Verified**: June 2026  
**Total Documentation**: 35,000+ words  
**Files**: 3 new + 3 updated
