# LocaCar Project Structure and Development Setup

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (optional, use Docker)
- Redis 7+ (optional, use Docker)

### Installation

```bash
# 1. Clone repository
git clone <repository-url>
cd locacar

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env

# 4. Start development environment
npm run docker:up

# 5. Initialize database
npm run db:migrate
npm run db:seed

# 6. Start development servers
npm run dev
```

### Development Commands

```bash
# Start all dev servers
npm run dev

# Backend only
npm run backend:dev

# Frontend only
npm run frontend:dev

# Run tests
npm run test

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Build for production
npm run build
```

### Docker Commands

```bash
# Start Docker containers
npm run docker:up

# Stop Docker containers
npm run docker:down

# Rebuild Docker images
npm run docker:build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Project Structure

```
locacar/
├── docs/                          # Documentation
│   ├── 01-specifications/
│   │   └── BMAD.md               # Business Model Analysis
│   ├── 02-architecture/
│   │   └── ARCHITECTURE.md       # System architecture
│   ├── 03-data-model/
│   │   ├── DATA_MODEL.md         # Database schema (legacy)
│   │   └── SCHEMA_REFERENCE.md   # Current database schema reference
│   ├── 04-features/
│   │   └── FEATURE_SPECIFICATIONS.md
│   └── 05-api/
│       └── API_REFERENCE.md      # REST API docs
│
├── src/
│   ├── backend/
│   │   ├── api/
│   │   │   ├── controllers/      # API endpoints
│   │   │   ├── routes/           # Route definitions
│   │   │   └── middleware/       # Custom middleware
│   │   ├── services/             # Business logic
│   │   ├── models/               # Data models/ORM
│   │   ├── utils/                # Utility functions
│   │   ├── config/               # Configuration
│   │   ├── database/
│   │   │   ├── migrations/       # Database migrations
│   │   │   ├── seeds/            # Database seeds
│   │   │   └── scripts/          # DB scripts
│   │   ├── types/                # TypeScript types
│   │   └── index.ts              # Entry point
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/       # React components
│   │   │   ├── pages/            # Page components
│   │   │   ├── store/            # Redux store
│   │   │   ├── services/         # API services
│   │   │   ├── hooks/            # Custom hooks
│   │   │   ├── utils/            # Utilities
│   │   │   ├── styles/           # Styling
│   │   │   ├── types/            # TypeScript types
│   │   │   └── App.tsx           # Root component
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── index.html
│   │
│   └── mobile/                   # React Native app
│       ├── screens/
│       ├── components/
│       ├── services/
│       ├── utils/
│       └── App.tsx
│
├── tests/
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
│
├── config/
│   ├── eslint.config.js
│   ├── prettier.config.js
│   ├── jest.config.js
│   └── nginx.conf
│
├── scripts/
│   ├── db/
│   │   ├── migrate.ts
│   │   └── seed.ts
│   └── build/
│       └── deploy.sh
│
├── .github/
│   ├── workflows/                # CI/CD pipelines
│   └── copilot-instructions.md
│
├── .env.example                  # Environment template
├── .gitignore
├── docker-compose.yml            # Docker Compose config
├── Dockerfile.backend
├── Dockerfile.frontend
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## Development Guidelines

### Code Organization

1. **Services**: Business logic independent of framework
2. **Controllers**: Handle HTTP requests, call services
3. **Models**: Data structures and ORM definitions
4. **Routes**: API endpoint definitions
5. **Middleware**: Cross-cutting concerns

### File Naming

- Files: `kebab-case.ts`
- Classes/Interfaces: `PascalCase`
- Functions/Variables: `camelCase`
- Database tables: `snake_case`

### Commit Messages

```
type(scope): subject

feat(auth): add JWT token refresh
fix(contracts): correct date validation
docs(readme): update installation steps
style(api): format code with prettier
refactor(services): simplify vehicle status logic
test(contracts): add unit tests
```

### Branch Naming

- Feature: `feature/feature-name`
- Bug fix: `bugfix/bug-name`
- Hotfix: `hotfix/issue-name`
- Release: `release/v1.0.0`

## Testing

```bash
# All tests
npm run test

# Unit tests
npm run test:backend
npm run test:frontend

# With coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

## Database Migrations

```bash
# Create new migration
npm run db:create-migration -- name_of_migration

# Run migrations
npm run db:migrate

# Rollback
npm run db:rollback

# Seed database
npm run db:seed
```

## Linting & Formatting

```bash
# Check linting issues
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type checking
npm run type-check
```

## Production Build

```bash
# Build all
npm run build

# Backend
npm run build:backend

# Frontend
npm run build:frontend

# Mobile
npm run build:mobile
```

## Deployment

### Docker Deployment

```bash
# Build images
docker-compose build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f
```

## API Documentation

- [REST API Reference](docs/05-api/API_REFERENCE.md)
- API available at: `http://localhost:3001/api/v1`
- API docs: `http://localhost:3001/api/docs` (Swagger)

## Frontend

- React app available at: `http://localhost:3000`
- Built with: React 18, Redux, React Query, TypeScript

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check credentials in .env
# Reset database
npm run db:migrate:fresh
```

### Redis Connection Failed
```bash
# Check Redis is running
docker-compose ps redis

# Flush Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

### Port Already in Use
```bash
# Kill process on port
lsof -ti:3001 | xargs kill -9

# Or change port in .env
```

## Support

- Documentation: [/docs](docs/)
- Issues: GitHub Issues
- Discussions: GitHub Discussions

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

PROPRIETARY - See LICENSE file

---

**Last Updated**: May 2026
**Version**: 1.0.0
