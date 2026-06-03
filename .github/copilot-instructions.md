# LocaCar - Car Rental Management System

## Project Overview
Complete car rental management application supporting multi-agency operations, GPS tracking, invoicing, contracts, and vehicle state documentation.

## Technology Stack
- **Backend**: Node.js + Express / NestJS
- **Frontend**: React / Vue.js + TypeScript
- **Mobile**: React Native / Flutter
- **Database**: PostgreSQL + Redis
- **Infrastructure**: Docker, Kubernetes-ready
- **API**: REST + GraphQL

## Development Guidelines

### Code Quality
- TypeScript for type safety
- ESLint + Prettier for formatting
- Jest for unit testing
- Comprehensive error handling

### Project Structure
```
src/
  ├── backend/
  │   ├── api/
  │   ├── services/
  │   ├── models/
  │   ├── middleware/
  │   └── config/
  ├── frontend/
  │   ├── components/
  │   ├── pages/
  │   ├── store/
  │   └── styles/
  └── mobile/
      ├── screens/
      ├── components/
      └── services/
docs/
  ├── 01-specifications/
  ├── 02-architecture/
  ├── 03-data-model/
  ├── 04-features/
  └── 05-api/
```

### Key Principles
1. **Modularity**: Each feature is independent and reusable
2. **Scalability**: Design for 100+ vehicles and 5+ agencies
3. **Security**: JWT authentication, role-based access control
4. **Performance**: Caching, pagination, lazy loading
5. **Documentation**: Every feature must be documented

### Naming Conventions
- Files: kebab-case
- Classes: PascalCase
- Functions/Variables: camelCase
- Database tables: snake_case
- API endpoints: /api/v1/resource-name

## References
- See `/docs/01-specifications/BMAD.md` for detailed requirements
- See `/docs/02-architecture/` for technical design
- See `/docs/04-features/` for feature specifications
