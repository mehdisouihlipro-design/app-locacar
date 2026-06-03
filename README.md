# LocaCar - Multi-Agency Car Rental Management System

A comprehensive, scalable car rental management application designed for small to medium fleets (20-100 vehicles) with support for centralized multi-agency operations.

## Overview

LocaCar provides complete fleet management capabilities including:
- **Fleet Management**: Vehicle inventory, status tracking, GPS monitoring
- **Rental Operations**: Contract management, vehicle check-in/check-out, state documentation
- **Financial**: Invoicing, payment processing, expense management
- **Multi-Agency**: Centralized control with support for subcontractors and agency networks
- **Compliance**: Document management, audit trails, reporting

## Key Features

### 1. Fleet Management
- Vehicle inventory with detailed specifications
- Real-time GPS tracking
- Status monitoring (available, rented, maintenance, etc.)
- Entry/exit documentation with photos
- Maintenance scheduling

### 2. Rental Contracts
- Rental agreement generation
- Client management
- Contract lifecycle management
- Insurance tracking
- Damage documentation

### 3. Financial Management
- Invoice generation and management
- Payment processing and tracking
- Multi-currency support
- Accounting reports
- Expense tracking

### 4. Multi-Agency Support
- Centralized multi-agency management
- Subcontractor vehicle integration
- Inter-agency vehicle sharing
- Unified reporting
- Agency-level analytics

### 5. Mobile & Field Operations
- Mobile app for field operations
- Real-time vehicle check-in/out
- Photo documentation
- GPS check-in verification
- Offline capability

### 6. Reporting & Analytics
- Fleet utilization reports
- Revenue reports
- Maintenance schedules
- Client history
- GPS tracking analytics

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+, Redux, TypeScript |
| Backend | Node.js, Express/NestJS, TypeScript |
| Mobile | React Native |
| Database | PostgreSQL, Redis |
| Authentication | JWT, OAuth 2.0 |
| File Storage | AWS S3 / MinIO |
| Real-time | Socket.io, WebSockets |
| Deployment | Docker, Docker Compose |

## Project Structure

```
locacar/
├── docs/
│   ├── 01-specifications/     # BMAD requirements
│   ├── 02-architecture/       # Technical architecture
│   ├── 03-data-model/         # Database schema
│   ├── 04-features/           # Feature specifications
│   └── 05-api/               # API documentation
├── src/
│   ├── backend/              # Node.js backend
│   ├── frontend/             # React web app
│   └── mobile/               # React Native app
├── tests/                    # Test suites
├── config/                   # Configuration files
└── docker-compose.yml        # Container orchestration
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose

### Installation

```bash
# Clone repository
git clone <repo-url>
cd locacar

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development environment
docker-compose up -d

# Initialize database
npm run db:migrate

# Start development server
npm run dev
```

### Development Commands

```bash
# Backend
npm run backend:dev

# Frontend
npm run frontend:dev

# Mobile
npm run mobile:dev

# All tests
npm run test

# Linting
npm run lint

# Type checking
npm run type-check
```

## Documentation

- **[Specifications (BMAD)](docs/01-specifications/BMAD.md)** - Complete requirements using BMAD methodology
- **[Architecture](docs/02-architecture/)** - Technical design and system architecture
- **[Data Model & Schema](docs/03-data-model/)** 
  - **[Schema Reference](docs/03-data-model/SCHEMA_REFERENCE.md)** - Complete database schema documentation
  - **[Database Setup Guide](docs/03-data-model/DATABASE_SETUP.md)** - Connection, deployment, and seeding
- **[Features](docs/04-features/)** - Detailed feature specifications
- **[API Documentation](docs/05-api/)** - REST and GraphQL API references

## System Requirements

### Minimum
- 100+ concurrent users
- 20-100 vehicles
- 2-10 agencies
- 1GB+ RAM
- 10GB+ storage

### Recommended
- 500+ concurrent users
- Multi-region deployment
- 50GB+ storage
- Load balancing
- Redis cluster

## Architecture Highlights

### Multi-Tenancy
- Agency-level data isolation
- Shared infrastructure
- Unified reporting

### Scalability
- Horizontal scaling ready
- Database sharding support
- Cache-first design

### Security
- End-to-end encryption for sensitive data
- Role-based access control (RBAC)
- Audit logging
- Data encryption at rest

### Performance
- Real-time GPS tracking
- Optimized database queries
- Redis caching
- CDN integration for static assets

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[Specify License]

## Support

For issues and questions:
- Documentation: [/docs](docs/)
- Issue Tracker: [GitHub Issues]
- Email: support@locacar.com

---

**Version**: 1.0.0 (Initial Release)
**Last Updated**: May 2026
