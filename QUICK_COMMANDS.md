# LocaCar Project - Quick Commands Reference

## 🚀 Quick Start (First Time Setup)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Start Docker containers
npm run docker:up

# 4. Initialize database
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev
```

**Access:**
- API: http://localhost:3001/api/v1
- Frontend: http://localhost:3000
- Postgres: localhost:5432
- Redis: localhost:6379
- MinIO: http://localhost:9001 (admin/minioadmin123)
- MailHog: http://localhost:8025

---

## 🛠️ Development Commands

### Running Application

```bash
# All services (backend + frontend)
npm run dev

# Backend only (with hot reload)
npm run backend:dev

# Frontend only (with hot reload)
npm run frontend:dev

# Mobile app
npm run mobile:dev
```

### Building

```bash
# Build everything
npm run build

# Build backend only
npm run build:backend

# Build frontend only
npm run build:frontend

# Build mobile (requires EAS account)
npm run build:mobile
```

### Testing

```bash
# Run all tests
npm run test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# Watch mode (auto-rerun)
npm run test -- --watch

# Coverage report
npm run test -- --coverage
```

### Code Quality

```bash
# Check linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Type checking
npm run type-check

# All checks (lint + type-check + test)
npm run check
```

---

## 🐳 Docker Commands

### Container Management

```bash
# Start all containers
npm run docker:up

# Stop all containers
npm run docker:down

# Rebuild Docker images
npm run docker:build

# View running containers
docker-compose ps

# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only
docker-compose logs -f postgres     # Database only
docker-compose logs -f redis        # Cache only
```

### Database Management

```bash
# Connect to database
docker-compose exec postgres psql -U locacar_user -d locacar_db

# View Redis
docker-compose exec redis redis-cli

# Backup database
docker-compose exec postgres pg_dump -U locacar_user locacar_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U locacar_user locacar_db < backup.sql
```

---

## 🗄️ Database Commands

```bash
# Create and run migrations
npm run db:migrate

# Rollback migrations
npm run db:rollback

# Create migration file
npm run db:create-migration -- migration_name

# Seed database
npm run db:seed

# Reset database (careful!)
npm run db:reset

# Database console
npm run db:shell
```

---

## 🔧 Configuration

### Environment Setup

```bash
# Copy development environment
cp .env.example .env.development

# Copy production environment
cp .env.example .env.production

# Use specific environment
NODE_ENV=development npm run dev
NODE_ENV=production npm run build
```

### Local Environment

Use `.env.development` for local development with:
- Local Docker services
- Mock payment service
- Debug logging enabled
- Relaxed CORS
- Mock SMS/Email

---

## 📝 Git Commands

### Branching

```bash
# Create feature branch
git checkout -b feature/feature-name

# Create bugfix branch
git checkout -b bugfix/bug-name

# Switch branch
git checkout branch-name

# Delete branch
git branch -d branch-name
```

### Commits

```bash
# Stage changes
git add .
git add src/specific-file.ts

# Commit with message
git commit -m "feat(module): description"

# Amend last commit
git commit --amend

# View recent commits
git log --oneline -n 10
```

### Push & Pull Requests

```bash
# Push branch
git push origin feature-name

# Push all branches
git push --all

# Pull latest
git pull origin develop

# Fetch without merging
git fetch origin
```

---

## 🧪 Testing Commands

### Jest Testing

```bash
# Run specific test file
npm test -- src/backend/services/vehicle.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="ContractService"

# Run with coverage
npm test -- --coverage

# Update snapshots
npm test -- --updateSnapshot

# Debug test
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Running Tests in Isolation

```bash
# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# Unit tests
npm test -- tests/unit

# Integration tests
npm test -- tests/integration

# E2E tests (if configured)
npm test -- tests/e2e
```

---

## 📦 Dependency Management

```bash
# Install dependencies
npm install

# Install specific package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update packages
npm update

# Check outdated packages
npm outdated

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 🚢 Deployment

### Build for Production

```bash
# Build all
npm run build

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production containers
docker-compose -f docker-compose.prod.yml up -d

# Stop production containers
docker-compose -f docker-compose.prod.yml down
```

---

## 🔍 Debugging

### Enable Debug Logging

```bash
# Backend debug
DEBUG=locacar:* npm run backend:dev

# Specific module debug
DEBUG=locacar:services:* npm run backend:dev

# Node inspector
node --inspect src/backend/index.ts
```

### Check Services

```bash
# Health check
curl http://localhost:3001/api/v1/health

# API status
curl http://localhost:3001/api/v1/

# Database connection
npm run db:shell

# Redis connection
docker-compose exec redis redis-cli ping
```

---

## 📚 Documentation

```bash
# View API documentation (if Swagger enabled)
open http://localhost:3001/api/docs

# View project documentation
open docs/01-specifications/BMAD.md
open docs/02-architecture/ARCHITECTURE.md
open docs/03-data-model/DATA_MODEL.md

# Project summary
cat PROJECT_SUMMARY.md
```

---

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3001
lsof -i :3000

# Kill process
kill -9 PID
# or
killall node
```

### Database Issues

```bash
# Reset containers
docker-compose down
docker volume rm locacar_postgres_data
npm run docker:up

# Run migrations fresh
npm run db:migrate

# Seed test data
npm run db:seed
```

### Node Modules Issues

```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install
```

### Docker Issues

```bash
# Rebuild images
docker-compose build --no-cache

# Clear unused data
docker system prune

# View volume usage
docker volume ls
```

---

## 🔐 Security Commands

### Code Security

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Security scanning (requires tool)
npm run security-scan
```

### Environment Security

```bash
# Never commit .env
git checkout -- .env

# Check for leaked secrets
git log -p --all -S "password" | grep -i password
```

---

## 📊 Monitoring Commands

```bash
# View container stats
docker stats

# Check container health
docker-compose ps

# View application logs
docker-compose logs -f --tail=100 backend

# Monitor resource usage
docker-compose stats
```

---

## 💡 Useful Tips

### Command Shortcuts

```bash
# Create alias for common commands
alias loc_dev="npm run dev"
alias loc_test="npm run test"
alias loc_lint="npm run lint"
alias loc_build="npm run build"

# Or add to .zshrc or .bashrc
```

### Screen Management

```bash
# Run backend and frontend in separate screens
screen -S locacar_backend npm run backend:dev
screen -S locacar_frontend npm run frontend:dev

# Attach to screen
screen -r locacar_backend
```

### Database Backup

```bash
# Regular backup
npm run db:backup

# Restore backup
npm run db:restore backup.sql

# Export to CSV
npm run db:export-csv
```

---

## 📞 Need Help?

1. **Documentation**: See `/docs` folder
2. **Setup Issues**: See `SETUP.md`
3. **Contributing**: See `CONTRIBUTING.md`
4. **Project Summary**: See `PROJECT_SUMMARY.md`
5. **API Reference**: See `docs/05-api/API_REFERENCE.md`

---

**Last Updated**: May 2026  
**Version**: 1.0.0
