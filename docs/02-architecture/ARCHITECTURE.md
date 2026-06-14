# System Architecture
## LocaCar Application

**Version**: 1.0  
**Last Updated**: May 2026

---

## 1. Architecture Overview

### 1.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├──────────────────┬────────────────┬────────────────┬────────┤
│  Web Dashboard   │  Mobile App    │  Admin Portal  │ APIs   │
│  (React)         │ (React Native) │  (React)       │(REST)  │
└──────────────────┴────────────────┴────────────────┴────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 API GATEWAY / LOAD BALANCER                  │
│  - Request routing, rate limiting, authentication           │
│  - WebSocket gateway for real-time features                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
├─────────────┬──────────────┬───────────┬──────────┬────────┤
│ Auth Svc    │ Rental Svc   │ Finance   │ Fleet    │ Report │
│             │              │ Svc       │ Svc      │ Svc    │
├─────────────┼──────────────┼───────────┼──────────┼────────┤
│ User Mgmt   │ Contract Mgmt│ Invoice   │ Vehicle  │ Analytics│
│ JWT/OAuth   │ Reservation │ Payment   │ GPS      │Dashboards│
└─────────────┴──────────────┴───────────┴──────────┴────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                          │
├────────────┬──────────┬──────────┬────────────┬───────────┤
│ GPS        │ Payment  │ Email    │ SMS        │ Third-    │
│ Providers  │ Gateway  │ Service  │ Service    │ party API │
└────────────┴──────────┴──────────┴────────────┴───────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
├────────────┬──────────────┬────────────┬────────────────┬───┤
│ PostgreSQL │ Redis Cache  │ S3 Storage │ Elasticsearch  │CDN│
│ (OLTP)     │ (Session)    │ (Files)    │ (Logs/Search)  │   │
└────────────┴──────────────┴────────────┴────────────────┴───┘
```

### 1.2 System Components

#### Backend Services (Microservices)
1. **Authentication Service**
   - JWT token generation and validation
   - OAuth 2.0 integration
   - User session management
   - Role-based access control

2. **Rental Service**
   - Contract management
   - Reservation processing
   - Customer management
   - Rental state machine

3. **Fleet Service**
   - Vehicle inventory management
   - Vehicle status tracking
   - GPS integration
   - Maintenance scheduling

4. **Financial Service**
   - Invoice generation and management
   - Payment processing
   - Financial reconciliation
   - Multi-currency support

5. **Reporting Service**
   - Business analytics
   - Financial reports
   - Real-time dashboards
   - Export functionality

6. **Notification Service**
   - Email notifications
   - SMS alerts
   - Push notifications
   - Real-time updates (WebSocket)

#### Frontend Applications
1. **Web Dashboard** (React)
   - Responsive design
   - Real-time updates
   - Role-based UI
   - Offline support

2. **Mobile App** (React Native)
   - Check-in/check-out operations
   - GPS tracking display
   - Photo capture
   - Offline functionality

3. **Admin Portal** (React)
   - System administration
   - User management
   - Configuration settings
   - Audit logs

---

## 2. Technology Architecture

### 2.1 Backend Stack

```
┌──────────────────────────────────┐
│     Application Framework         │
│  Express.js / NestJS (Node.js)   │
│  TypeScript                       │
└──────────────────────────────────┘
           ↓
┌──────────────────────────────────┐
│   Middleware Stack               │
├──────────────────────────────────┤
│ - Authentication (JWT, OAuth)    │
│ - Authorization (RBAC)           │
│ - Request validation             │
│ - Error handling                 │
│ - Logging (Winston, Pino)        │
│ - Rate limiting                  │
│ - CORS handling                  │
└──────────────────────────────────┘
           ↓
┌──────────────────────────────────┐
│   Business Logic Layer           │
├──────────────────────────────────┤
│ - Service classes                │
│ - Business rule validation       │
│ - Transaction management         │
│ - Caching logic                  │
└──────────────────────────────────┘
           ↓
┌──────────────────────────────────┐
│   Data Access Layer              │
├──────────────────────────────────┤
│ - ORM: TypeORM / Sequelize       │
│ - Query builders                 │
│ - Database migrations            │
│ - Connection pooling             │
└──────────────────────────────────┘
           ↓
┌──────────────────────────────────┐
│   Database Layer                 │
├──────────────────────────────────┤
│ - PostgreSQL (Primary)           │
│ - Read replicas                  │
│ - Connection pool (20-100)       │
│ - Query optimization             │
└──────────────────────────────────┘
```

### 2.2 Frontend Stack

**Web Dashboard:**
```
React 18
├── Redux (State Management)
├── React Query (Data Fetching)
├── React Router (Navigation)
├── Material-UI / Tailwind (UI)
└── TypeScript
```

**Mobile App:**
```
React Native
├── Redux (State Management)
├── React Navigation
├── AsyncStorage (Local storage)
├── React Native Camera (Photos)
└── React Native Maps (GPS)
```

### 2.3 Infrastructure Stack

```
Docker
├── Docker Compose (development)
├── Kubernetes (production)
└── Container Registry (image storage)

CI/CD Pipeline
├── GitHub Actions (build/test)
├── SonarQube (code quality)
├── SAST/DAST (security scanning)
└── Automated deployment

Monitoring & Logging
├── Prometheus (metrics)
├── Grafana (dashboards)
├── ELK Stack (logs)
└── Sentry (error tracking)
```

---

## 3. Database Architecture

### 3.1 Database Design Principles
- **Normalization**: 3NF for OLTP
- **Indexing**: Strategic indexes on foreign keys and frequently queried fields
- **Partitioning**: By agency for multi-tenancy
- **Sharding**: Future consideration for scale

### 3.2 Key Relationships

```
┌─────────────┐
│  AGENCIES   │
└──────┬──────┘
       │ 1:M
       ↓
┌─────────────────┐
│  VEHICLE_TYPES  │
└──────┬──────────┘
       │ 1:M
       ↓
┌─────────────┐         1:M      ┌──────────────┐
│  VEHICLES   │────────────────→  │  CONTRACTS   │
└──────┬──────┘                   └──────┬───────┘
       │                                  │
       │  1:M                        1:M  │
       ↓                                  ↓
┌──────────────────┐         ┌──────────────────┐
│ VEHICLE_CHECKS   │         │   INVOICES       │
│ (photos, status) │         │   (line items)   │
└──────────────────┘         └────────┬─────────┘
                                      │
                                 1:M  │
                                      ↓
                             ┌──────────────────┐
                             │   PAYMENTS       │
                             └──────────────────┘

┌─────────────┐  1:M      ┌──────────────┐
│ CUSTOMERS   │─────────→ │ CONTRACTS    │
└─────────────┘           └──────────────┘
```

### 3.3 Schema Overview

**AGENCIES**
```sql
- agency_id (UUID, PK)
- agency_name (VARCHAR)
- agency_type (ENUM: owned, subcontractor)
- parent_agency_id (UUID, FK nullable)
- country (VARCHAR)
- state (VARCHAR)
- city (VARCHAR)
- address (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- commission_rate (DECIMAL)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**VEHICLES**
```sql
- vehicle_id (UUID, PK)
- agency_id (UUID, FK)
- vehicle_type_id (UUID, FK)
- registration_number (VARCHAR, UNIQUE)
- vin (VARCHAR, UNIQUE)
- color (VARCHAR)
- status (ENUM)
- gps_latitude (DECIMAL nullable)
- gps_longitude (DECIMAL nullable)
- gps_last_update (TIMESTAMP nullable)
- current_mileage (INTEGER)
- insurance_expiry (DATE)
- last_inspection_date (DATE)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**CONTRACTS**
```sql
- contract_id (UUID, PK)
- customer_id (UUID, FK)
- vehicle_id (UUID, FK)
- rental_agency_id (UUID, FK)
- renting_agency_id (UUID, FK nullable)
- rental_start_date (TIMESTAMP)
- rental_end_date (TIMESTAMP)
- rental_status (ENUM)
- daily_rate (DECIMAL)
- total_amount (DECIMAL)
- insurance_type (VARCHAR)
- insurance_amount (DECIMAL)
- damage_deposit (DECIMAL)
- contract_number (VARCHAR, UNIQUE)
- signed_at (TIMESTAMP nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**INVOICES**
```sql
- invoice_id (UUID, PK)
- contract_id (UUID, FK)
- invoice_number (VARCHAR, UNIQUE)
- invoice_date (DATE)
- due_date (DATE)
- invoice_status (ENUM)
- subtotal (DECIMAL)
- tax_amount (DECIMAL)
- total_amount (DECIMAL)
- paid_amount (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## 4. API Architecture

### 4.1 REST API Design

**Base URL**: `/api/v1`

**Resources**:
```
/agencies
/vehicles
/contracts
/invoices
/payments
/customers
/vehicle-checks
/reports
```

**Standard Response Format**:
```json
{
  "success": boolean,
  "data": object,
  "error": {
    "code": string,
    "message": string,
    "details": object
  },
  "meta": {
    "timestamp": ISO8601,
    "requestId": string
  }
}
```

### 4.2 Authentication & Authorization

**Flow**:
```
1. User logs in → Receives JWT token
2. Request includes: Authorization: Bearer <token>
3. API validates token and extracts claims
4. API checks role-based permissions
5. Request processed or rejected
```

**Token Structure** (JWT):
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "agency_id": "agency_uuid",
  "roles": ["rental_agent", "agency_manager"],
  "permissions": ["rental:create", "invoice:read"],
  "iat": timestamp,
  "exp": timestamp
}
```

### 4.3 Pagination & Filtering

**Query Parameters**:
```
GET /api/v1/contracts?
  page=1&
  limit=20&
  sort=rental_start_date:desc&
  filter[agency_id]=uuid&
  filter[status]=active&
  search=customer_name
```

**Response Meta**:
```json
{
  "meta": {
    "total": 1000,
    "page": 1,
    "limit": 20,
    "pages": 50
  }
}
```

### 4.4 Real-time Features (WebSocket)

**Connection**:
```
ws://api.locacar.com/ws?token=<jwt_token>
```

**Events**:
```
- vehicle:location_updated (GPS updates)
- contract:status_changed
- invoice:payment_received
- notification:created
```

---

## 5. Security Architecture

### 5.1 Authentication
- **Method**: JWT + OAuth 2.0 (for third-party integrations)
- **Token Expiry**: 24 hours (access), 7 days (refresh)
- **Storage**: HTTPOnly cookies (web), Secure storage (mobile)

### 5.2 Authorization
- **Model**: Role-Based Access Control (RBAC)
- **Roles**: Admin, Owner, Manager, Agent, Operator, Accountant
- **Permissions**: Granular, resource-based

### 5.3 Data Security
- **Encryption**: TLS 1.3+ for transport, AES-256 for sensitive data at rest
- **Sensitive Fields**: SSN, passport, payment card (tokenized)
- **PCI-DSS**: For payment card data handling

### 5.4 API Security
- **Rate Limiting**: 100 requests/minute per user
- **Input Validation**: All inputs validated and sanitized
- **CORS**: Configured for allowed origins
- **CSRF Protection**: SameSite cookie attribute

### 5.5 Audit & Logging
- **Audit Trail**: All data modifications logged with user/timestamp
- **Sensitive Operations**: Flagged and reviewed
- **Log Retention**: 1 year minimum
- **GDPR Compliance**: Data deletion, export capabilities

---

## 6. Performance Optimization

### 6.1 Caching Strategy

```
Layer 1: Browser Cache (Static assets)
  ├── CSS, JS: 1 month
  ├── Images: 3 months
  └── API responses: 5 minutes

Layer 2: CDN Cache (CloudFlare/CloudFront)
  ├── Static assets: 1 week
  └── API responses: 1 minute

Layer 3: Application Cache (Redis)
  ├── User sessions: 24 hours
  ├── Vehicle data: 15 minutes
  ├── Agency info: 1 hour
  └── Reports: 30 minutes

Layer 4: Database Query Cache
  ├── Frequently accessed queries
  └── Pre-computed aggregations
```

### 6.2 Database Optimization
- **Query Optimization**: EXPLAIN ANALYZE on slow queries
- **Indexing**: B-tree on foreign keys, GiST for geospatial
- **Connection Pooling**: PgBouncer with 50-100 connections
- **Replication**: Read replicas for reporting

### 6.3 API Performance
- **Pagination**: Default 20, max 100 items
- **Field Selection**: Allow sparse fieldsets
- **Lazy Loading**: Relationships loaded on demand
- **Batch Operations**: Support bulk create/update/delete

### 6.4 Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Bundle Analysis**: Keep main bundle < 200KB
- **Image Optimization**: WebP format, lazy loading
- **State Management**: Selective subscription to Redux

---

## 7. Deployment Architecture

### 7.1 Development Environment
```
docker-compose.yml
├── PostgreSQL service
├── Redis service
├── Backend API
├── Frontend dev server
└── Mobile dev environment
```

### 7.2 Production Environment

```
┌─────────────────────────────────┐
│     Load Balancer (Nginx)       │
│     Rate limiting, SSL/TLS      │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
┌──────────┐    ┌──────────┐
│API Pod 1 │    │API Pod 2 │  ... (Auto-scaling)
└──────────┘    └──────────┘
    │                 │
    └────────┬────────┘
             ↓
    ┌─────────────────┐
    │ PostgreSQL      │
    │ (Primary)       │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    ↓                 ↓
┌────────┐      ┌────────┐
│Replica │      │ Backup │
└────────┘      └────────┘

└─ Redis Cluster (3 nodes)
└─ S3 / MinIO (Object Storage)
└─ Elasticsearch (Logging)
```

### 7.3 Kubernetes Deployment

```yaml
# Typical Kubernetes manifests
- Deployments (API, Workers)
- StatefulSets (PostgreSQL, Redis)
- Services (Internal, External)
- Ingress (URL routing)
- ConfigMaps (Configuration)
- Secrets (Sensitive data)
- PersistentVolumes (Storage)
```

---

## 8. Monitoring & Observability

### 8.1 Metrics Collection
- **Prometheus**: Infrastructure and application metrics
- **StatsD**: Application events and timings
- **Dashboards**: Grafana for visualization

### 8.2 Logging
- **Centralized**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Structured Logging**: JSON format with context

### 8.3 Tracing
- **Distributed Tracing**: Jaeger for request tracking
- **Service Dependencies**: Visual service map
- **Performance Analysis**: Identify bottlenecks

### 8.4 Alerting
- **Alert Manager**: Prometheus AlertManager
- **Channels**: Email, Slack, PagerDuty
- **Thresholds**: API latency, error rate, resource usage

---

## 9. Disaster Recovery

### 9.1 Backup Strategy
- **Database**: Daily automated backups, 30-day retention
- **Files**: S3 versioning enabled, cross-region replication
- **RTO**: < 1 hour recovery time objective
- **RPO**: < 15 minutes recovery point objective

### 9.2 High Availability
- **Database**: Master-slave replication, automatic failover
- **API**: Multi-node deployment with load balancing
- **Cache**: Redis cluster with sentinel monitoring
- **CDN**: Global content delivery with failover

---

## 10. Development Workflow

### 10.1 Git Branching Strategy
```
main (production)
├── release/v1.x (pre-production)
├── develop (integration)
└── feature/feature-name (development)
```

### 10.2 Code Review Process
1. Developer creates feature branch
2. Commits with descriptive messages
3. Push and create pull request
4. Code review (2+ approvals)
5. CI/CD pipeline passes
6. Merge to develop
7. Release to production on schedule

### 10.3 Testing Strategy
- **Unit Tests**: > 80% coverage (Jest)
- **Integration Tests**: API and database interaction
- **E2E Tests**: Critical user workflows (Cypress)
- **Performance Tests**: Load testing (k6, JMeter)

---

## 11. Scalability Considerations

### 11.1 Horizontal Scaling
- **Stateless API**: No session affinity required
- **Load Balancing**: Round-robin, least connections
- **Auto-scaling**: Based on CPU/memory/requests

### 11.2 Vertical Scaling
- **Database**: Query optimization before scaling up
- **Cache**: Sharding strategy for large datasets
- **File Storage**: S3 unlimited scalability

### 11.3 Expected Growth Path
- **Phase 1** (0-100 users): Single server
- **Phase 2** (100-1000 users): 2-3 API servers
- **Phase 3** (1000-5000 users): Full microservices
- **Phase 4** (5000+ users): Multi-region deployment

---

## 12. Évolutions V2 — Vers une version professionnelle

> Spécification (cf. `docs/01-specifications/BMAD.md` 6.5, `docs/03-data-model/SCHEMA_REFERENCE.md` "Évolutions V2", `docs/04-features/FEATURE_SPECIFICATIONS.md` section 9). Patrons architecturaux ajoutés au socle existant, à implémenter lors du développement V2.

### 12.1 Patron entête + lignes (header/detail)

Les entités `contracts` et `invoices` passent d'un modèle "ligne unique" à un modèle **entête + lignes** : une table d'entête (`contracts`/`invoices`) référencée par une table de lignes (`contract_lines`/`invoice_lines`), une ligne = un véhicule/une prestation. Ce patron remplace le stockage JSONB ad-hoc (`invoices.lines`) par des tables relationnelles, et sert de modèle standard pour toute future entité "document avec lignes" (ex. devis).

### 12.2 Composant de grille générique (tri/filtre)

Toutes les listes de l'app (`render<Entity>()`) s'appuient sur un composant générique `renderSortableFilterableTable` : tri par colonne (clic en-tête), filtre par colonne, tri par défaut sur `created_at DESC`. Ce composant devient le standard pour tout nouvel écran liste.

### 12.3 Traçabilité (audit)

Chaque route `POST`/`PUT` du backend (`src/backend/routes/`) renseigne désormais `created_by`/`updated_by` à partir de `req.user.id` (middleware JWT `AuthRequest` existant) avant transmission à Supabase. Convention à appliquer à toute nouvelle table métier.

### 12.4 Atomicité des opérations entête + lignes (RPC PostgreSQL)

Le patron entête + lignes (12.1) introduit des opérations qui écrivent dans plusieurs tables en une seule action utilisateur : créer un contrat avec ses lignes (et, pour chaque ligne, rechercher/créer/corriger une réservation, BR25), créer une facture avec ses lignes, ou valider un devis (création d'un contrat complet à partir du devis). Un enchaînement de plusieurs `INSERT`/`UPDATE` via PostgREST depuis le backend n'est **pas atomique** : une erreur en cours de séquence (ex. conflit BR19 sur la 2e ligne d'un contrat à 3 lignes) laisserait une entête orpheline ou des lignes partielles.

**Mécanisme retenu** : ces opérations sont implémentées comme des **fonctions PostgreSQL** (`LANGUAGE plpgsql`, `SECURITY INVOKER`), chacune exécutée dans une transaction unique par PostgreSQL, et exposées au backend via l'API RPC de PostgREST (`POST /rpc/<nom_fonction>`, déjà utilisée pour Supabase).

- `create_contract_with_lines(p_contract, p_lines)` — crée l'entête `contracts` + les `contract_lines`, exécute la séquence réservation BR25 par ligne, applique le contrôle BR19 ; rollback complet en cas d'échec.
- `create_invoice_with_lines(p_invoice, p_lines)` — crée l'entête `invoices` + les `invoice_lines` ; refuse si `p_lines` est vide (BR21).
- `validate_quote(p_quote_id)` — passe le devis à `valide`, appelle `create_contract_with_lines` avec les lignes converties, renseigne `quotes.converted_contract_id` ; rollback complet (devis non modifié) en cas d'échec.

Le backend (`src/backend/routes/contracts.routes.ts`, `invoices.routes.ts`, `quotes.routes.ts`) appelle ces fonctions via le client PostgREST/Supabase au lieu d'enchaîner des écritures multi-tables. Signatures et logique détaillées dans `docs/03-data-model/SCHEMA_REFERENCE.md` (section "Fonctions RPC — atomicité entête + lignes") et endpoints dans `docs/05-api/API_REFERENCE.md` section 13.

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Next Review**: June 2026
