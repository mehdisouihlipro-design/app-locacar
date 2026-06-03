# Database Setup & Connection Guide

**Version**: 1.0  
**Updated**: June 2026

---

## Table of Contents
1. [Quick Setup](#quick-setup)
2. [Supabase Configuration](#supabase-configuration)
3. [Local PostgreSQL Setup](#local-postgresql-setup)
4. [Database Connection](#database-connection)
5. [Schema Deployment](#schema-deployment)
6. [Seeding Data](#seeding-data)
7. [Troubleshooting](#troubleshooting)

---

## Quick Setup

### Supabase Cloud (Recommended for Production)

**Step 1: Create Supabase Project**
```bash
# Visit https://supabase.com
# 1. Sign up or log in
# 2. Click "New Project"
# 3. Enter project name: "locacar"
# 4. Set password (save securely)
# 5. Select region closest to your users
# 6. Click "Create New Project"
```

**Step 2: Get Connection String**
```bash
# In Supabase Dashboard:
# 1. Go to "Settings" → "Database"
# 2. Copy "Connection String" (URI format)
# 3. The format is: postgresql://[user]:[password]@[host]:[port]/[database]
```

**Step 3: Configure Environment**
```bash
# In your .env file:
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
```

### Docker Compose (Development)

```bash
# Docker handles PostgreSQL + Redis automatically
docker-compose up -d
```

---

## Supabase Configuration

### Connection Details

```
Protocol: PostgreSQL
Host: [your-project].supabase.co
Port: 5432
User: postgres
Password: [your-secure-password]
Database: postgres
```

### Connection String Examples

**psql (command line)**:
```bash
psql postgresql://postgres:PASSWORD@[project].supabase.co:5432/postgres
```

**DBeaver**:
- Host: `[project].supabase.co`
- Port: `5432`
- User: `postgres`
- Password: `[your password]`
- Database: `postgres`

**Node.js (pg)**:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

### Security Notes
- **Save credentials securely** (use password managers)
- **Never commit credentials** to version control
- **Use environment variables** for all connections
- **Enable SSL/TLS** for remote connections
- Consider **SSL Enforce** in Supabase settings

---

## Local PostgreSQL Setup

### Option 1: Docker (Recommended)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: locacar
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: locacar_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Start the service**:
```bash
docker-compose up -d
```

### Option 2: Direct Installation

**Windows**:
```bash
# Download PostgreSQL 15+ from https://www.postgresql.org/download/windows/
# Run installer with default settings
# During installation, set password for 'postgres' user
```

**macOS**:
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu)**:
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib-15
sudo systemctl start postgresql
```

### Create Database

```bash
# Connect as default user
psql -U postgres

# Create database
CREATE DATABASE locacar_db;

# Create user
CREATE USER locacar_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE locacar_db TO locacar_user;

# Exit
\q
```

---

## Database Connection

### Test Connection

**Using psql**:
```bash
psql -h localhost -U locacar_user -d locacar_db -p 5432
```

**Using Node.js**:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'locacar_db',
  user: 'locacar_user',
  password: 'secure_password'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connected! Current time:', res.rows[0]);
  }
});
```

### Connection Pool Configuration

```javascript
// src/backend/config/database.ts
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Idle timeout
  connectionTimeoutMillis: 2000
});

module.exports = pool;
```

---

## Schema Deployment

### Method 1: Direct SQL Import

```bash
# Using psql
psql -h localhost -U locacar_user -d locacar_db -f src/backend/schema.sql

# Using Supabase SQL Editor
# 1. Go to Supabase Dashboard
# 2. Click "SQL Editor"
# 3. Click "New Query"
# 4. Paste content from src/backend/schema.sql
# 5. Click "Run"
```

### Method 2: Migration Scripts

```javascript
// src/backend/database/migrations/001_initial_schema.ts
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const schema = fs.readFileSync(
      path.join(__dirname, '../../schema.sql'),
      'utf8'
    );
    
    await pool.query(schema);
    console.log('✓ Schema deployed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
```

### Method 3: ORM Migrations (TypeORM/Sequelize)

```bash
# Using TypeORM
npm run typeorm migration:generate -- -n InitialSchema
npm run typeorm migration:run

# Using Sequelize
npx sequelize-cli migration:generate --name initial-schema
npx sequelize-cli db:migrate
```

---

## Seeding Data

### Sample Data Script

```javascript
// src/backend/database/seeds/sample-data.ts
import { Pool } from 'pg';

async function seedDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Insert settings
    await pool.query(`
      INSERT INTO settings (base_currency, eur_to_tnd, opening_cash_tnd, reservation_buffer_hours)
      VALUES ('TND', 3.4, 5000.00, 2)
      ON CONFLICT (id) DO UPDATE SET
        base_currency = EXCLUDED.base_currency,
        eur_to_tnd = EXCLUDED.eur_to_tnd,
        opening_cash_tnd = EXCLUDED.opening_cash_tnd,
        reservation_buffer_hours = EXCLUDED.reservation_buffer_hours;
    `);

    // Insert sample user
    await pool.query(`
      INSERT INTO users (id, email, password_hash, full_name, role, is_active)
      VALUES ('admin-001', 'admin@locacar.tn', '$2b$10$...', 'Administrator', 'admin', true)
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample customer
    await pool.query(`
      INSERT INTO customers (id, name, phone, email, city, country)
      VALUES ('cust-001', 'Ahmed Ben Ali', '21612345678', 'ahmed@example.tn', 'Tunis', 'Tunisia')
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample car
    await pool.query(`
      INSERT INTO cars (id, plate, model, brand, fuel_type, color, status)
      VALUES ('car-001', 'TN-123-ABC', 'Peugeot 308', 'Peugeot', 'petrol', 'white', 'disponible')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✓ Database seeded successfully');
  } catch (error) {
    console.error('✗ Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seedDatabase();
```

**Run seeding**:
```bash
npm run db:seed
```

---

## Testing Connection

### Connection Test Checklist

- [ ] Can connect with psql
- [ ] Can connect with DBeaver
- [ ] Can connect from Node.js application
- [ ] Can read from tables
- [ ] Can write to tables
- [ ] Indexes are created
- [ ] Foreign keys work correctly

### Verify Schema

```sql
-- List all tables
\dt

-- Check table structure
\d customers

-- List indexes
\di

-- Check foreign keys
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';
```

---

## Troubleshooting

### Connection Refused

**Symptoms**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
```bash
# Check if PostgreSQL is running
# Windows
Get-Service PostgreSQL-x64-15

# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Restart if needed
docker-compose restart postgres
```

### Authentication Failed

**Symptoms**: `FATAL: password authentication failed for user`

**Solutions**:
```bash
# Reset password (psql must be run as postgres user)
# Windows (Run as Admin)
psql -U postgres
ALTER USER locacar_user PASSWORD 'new_password';

# Verify credentials in .env
DATABASE_URL="postgresql://locacar_user:new_password@localhost:5432/locacar_db"
```

### Table/Database Not Found

**Symptoms**: `relation "customers" does not exist`

**Solutions**:
```bash
# Check if schema is deployed
psql -h localhost -U locacar_user -d locacar_db
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

# Re-deploy schema
psql -h localhost -U locacar_user -d locacar_db -f src/backend/schema.sql
```

### Connection Pool Exhausted

**Symptoms**: `timeout acquiring a connection from the pool`

**Solutions**:
- Increase `max` setting in pool configuration
- Check for connection leaks
- Use connection pooling middleware (PgBouncer)

### Performance Issues

**Check indexes**:
```sql
SELECT * FROM pg_stat_user_indexes;
```

**Rebuild indexes**:
```sql
REINDEX INDEX CONCURRENT idx_customers_name;
```

**Analyze query performance**:
```sql
EXPLAIN ANALYZE SELECT * FROM contracts WHERE customer_id = 'cust-001';
```

---

## Next Steps

1. ✅ Database connected and schema deployed
2. → [Seed initial data](#seeding-data)
3. → [Set up API endpoints](../05-api/API_REFERENCE.md)
4. → [Implement authentication](../02-architecture/ARCHITECTURE.md)
5. → [Create frontend components](../04-features/FEATURE_SPECIFICATIONS.md)

---

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Connection Pool Best Practices](https://node-postgres.com/features/pooling)
- [Database Schema Reference](./SCHEMA_REFERENCE.md)
