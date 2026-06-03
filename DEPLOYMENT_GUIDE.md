# LocaCar - Setup & Déploiement Guide

## 🎯 Architecture

L'application LocaCar est maintenant structurée en deux couches :

### Frontend (Mini-App HTML)
- **Localisation** : `/worksheet-mini-app/index.html`
- **Type** : Single Page Application (SPA)
- **Stockage** : localStorage (local) ou API PostgreSQL (production)
- **Fonctionnalité** : Gestion complète de locations de voitures

### Backend (API Express + PostgreSQL)
- **Localisation** : `/src/backend/`
- **Base de données** : PostgreSQL 15+
- **Cache** : Redis
- **API** : REST HTTP/JSON sur port 3001

## 📋 Entités Managées

La système gère les entités suivantes :
- **Véhicules** (Cars) - Flotte de location
- **Clients** (Customers) - Fichier client
- **Contrats** (Contracts) - Contrats de location
- **Réservations** (Reservations) - Planning
- **Factures** (Invoices) - Facturation
- **Paiements** (Payments) - Suivi des paiements
- **Maintenance** - Coûts de maintenance
- **Inspections** - États des lieux (check-in/check-out)
- **Assurances** (Insurances) - Couverture assurance
- **Leasing** - Contrats de leasing
- **Vignettes** - Taxes annuelles
- **GPS** - Suivi de localisation
- **Settings** - Configuration globale

## 🚀 Déploiement Local (Développement)

### Option 1 : Mini-App + localStorage (SUR CE PC)

La mini-app fonctionne déjà en local :

```bash
# Ouvrir simplement le fichier dans le navigateur
file:///c:/Applications/App_locaCar/worksheet-mini-app/index.html
```

**Avantages** :
- ✅ Fonctionne immédiatement
- ✅ Aucune dépendance système
- ✅ Données stockées localement dans le navigateur

**Limitations** :
- ❌ Données non persistantes entre navigateurs
- ❌ Pas de multi-utilisateurs
- ❌ Pas de synchronisation

### Option 2 : Avec Backend API (Quand Docker/Node.js disponibles)

#### Prérequis
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (recommandé)

#### Installation

```bash
# 1. Cloner/accéder au projet
cd c:\Applications\App_locaCar

# 2. Installer les dépendances
npm install

# 3. Initialiser les services avec Docker
docker-compose up -d

# 4. L'API démarrera sur http://localhost:3001
# 5. La mini-app se connectera automatiquement
```

#### Variables d'environnement (.env)

```env
NODE_ENV=development
PORT=3001
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=locacar_user
POSTGRES_PASSWORD=locacar_password
POSTGRES_DB=locacar_db
REDIS_URL=redis://redis:6379
```

## 🔌 Architecture API

### Endpoints disponibles

```
GET    /api/v1/health                 # Health check
GET    /api/v1/cars                   # Lister tous les véhicules
POST   /api/v1/cars                   # Créer un véhicule
GET    /api/v1/cars/:id               # Détails d'un véhicule
PUT    /api/v1/cars/:id               # Modifier un véhicule
DELETE /api/v1/cars/:id               # Supprimer un véhicule

# Même pattern pour:
/api/v1/customers
/api/v1/contracts
/api/v1/invoices
/api/v1/payments
/api/v1/reservations
/api/v1/maintenance
/api/v1/inspections
/api/v1/insurances
/api/v1/leasing
/api/v1/vignettes
/api/v1/settings
```

## 🔄 Utilisation de l'API depuis la Mini-App

### Code Client JavaScript

```javascript
// Utiliser le StorageAdapter pour abstraire la source de données
const API_ENABLED = true;

// Récupérer toutes les voitures
if (API_ENABLED) {
  const response = await fetch('http://localhost:3001/api/v1/cars');
  const { data: cars } = await response.json();
} else {
  const cars = JSON.parse(localStorage.getItem('cars') || '[]');
}

// Créer une voiture
const newCar = await fetch('http://localhost:3001/api/v1/cars', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'CAR-001', plate: 'TN-123-XX', model: 'Dacia Duster' })
});
```

## 📦 Structure du Projet

```
c:\Applications\App_locaCar\
├── worksheet-mini-app/              # Frontend SPA
│   ├── index.html                   # Application principale
│   ├── api-client.js                # Client API
│   ├── storage-adapter.js           # Adaptateur localStorage/API
│   └── html2pdf.bundle.min.js       # Export PDF
├── src/
│   ├── backend/                     # API Express
│   │   ├── index.ts                 # Point d'entrée
│   │   ├── schema.sql               # Schéma PostgreSQL
│   │   └── routes/                  # Endpoints API
│   │       ├── cars.routes.ts
│   │       ├── customers.routes.ts
│   │       ├── contracts.routes.ts
│   │       ├── invoices.routes.ts
│   │       ├── payments.routes.ts
│   │       ├── reservations.routes.ts
│   │       ├── maintenance.routes.ts
│   │       ├── inspections.routes.ts
│   │       ├── insurances.routes.ts
│   │       ├── leasing.routes.ts
│   │       ├── vignettes.routes.ts
│   │       └── settings.routes.ts
│   └── frontend/                    # Frontend React (futur)
├── docker-compose.yml               # Orchestration services
├── Dockerfile.backend               # Build image backend
├── Dockerfile.frontend              # Build image frontend
├── package.json                     # Dépendances
└── docs/                            # Documentation
```

## ✅ Fonctionnalités Actuellement Disponibles

### Mini-App Worksheet
- ✅ Gestion des véhicules avec stati GPS
- ✅ Gestion des clients
- ✅ Contrats de location (court & long terme)
- ✅ Invoicing et payment tracking
- ✅ Réservations avec calendrier
- ✅ États des lieux (inspections) avec photos
- ✅ Maintenance tracking
- ✅ Assurances & Leasing
- ✅ Vignettes (taxes)
- ✅ Recouvrements & Collections
- ✅ Export Excel
- ✅ Timeline visuelle des réservations
- ✅ Calculs automatiques (devises TND/EUR)

## 🔐 Sécurité (À implémenter)

Pour production :
- [ ] Authentication JWT
- [ ] Role-based access control (RBAC)
- [ ] HTTPS / TLS
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Input validation & sanitization

## 📊 Prochaines étapes

1. **À court terme** :
   - ✅ Schéma BD complètement défini
   - ✅ Routes API implémentées
   - [ ] Adapter la mini-app pour utiliser l'API

2. **À moyen terme** :
   - [ ] Frontend React moderne
   - [ ] Mobile app (React Native)
   - [ ] Authentification & RBAC
   - [ ] Tests unitaires & intégration

3. **À long terme** :
   - [ ] CI/CD pipeline
   - [ ] Multi-ténant
   - [ ] Analytics & Reporting
   - [ ] GPS real-time tracking
   - [ ] Mobile payment integration

## 🛠️ Développement

### Build Backend
```bash
npm run build:backend
```

### Tester l'API
```bash
npm run dev          # Mode développement
npm run build        # Build production
```

### Logs
```bash
# Backend logs
docker logs locacar_backend

# Database logs
docker logs locacar_postgres
```

## 📞 Support

En cas de problème :
1. Vérifier les logs Docker
2. Vérifier la connexion à la base de données
3. Vérifier que les ports 3001 (API) et 5432 (PostgreSQL) sont libres
4. Vérifier les credentials PostgreSQL dans .env

## 📝 Notes

- La mini-app peut fonctionner **indépendamment** en mode localStorage
- Le backend est **optionnel** pour le développement local
- En production, utiliser la configuration Docker Compose
- Les données PostgreSQL sont persistantes dans des volumes Docker
