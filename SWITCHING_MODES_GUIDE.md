# ðŸ”„ Guide: Basculer entre localStorage et API PostgreSQL

## Ã‰tat Actuel

### âœ… Mode localStorage (Par DÃ©faut)
- **Statut**: ðŸŸ¢ Actif - La mini-app fonctionne maintenant comme avant
- **Stockage**: DonnÃ©es dans le navigateur (localStorage)
- **Serveur**: Aucun requis
- **Fichier**: `worksheet-mini-app/index.html`

### â³ Mode API PostgreSQL (Optionnel)
- **Statut**: âšª PrÃªt - Attendant Node.js + Docker
- **Stockage**: Base de donnÃ©es PostgreSQL
- **Serveur**: Express API sur port 3001
- **Fichier**: `src/backend/index.ts`

---

## ðŸ“‹ Checklist: Utiliser l'API

### Ã‰tape 1: PrÃ©requis SystÃ¨me
```bash
# VÃ©rifier Node.js
node --version        # Besoin: v18+

# VÃ©rifier Docker
docker --version      # Besoin: v20+
docker-compose --version
```

Si âŒ non disponibles:
- Continuer avec localStorage (mode par dÃ©faut)
- Demander Ã  l'administrateur systÃ¨me d'installer Node.js + Docker

### Ã‰tape 2: Installation (Une seule fois)
```bash
cd c:\Applications\App_locaCar

# Installer les dÃ©pendances npm
npm install

# VÃ©rifier que tout est OK
npm run build:backend
```

### Ã‰tape 3: DÃ©marrer les Services
```bash
# Lancer PostgreSQL + Redis + Backend
docker-compose up -d

# VÃ©rifier que tout dÃ©marre
docker-compose logs -f

# VÃ©rifier la santÃ© de l'API
curl http://localhost:3001/api/v1/health
```

### Ã‰tape 4: Activer l'API dans la Mini-App

**Fichier**: `worksheet-mini-app/storage-wrapper.js`

```javascript
// Chercher cette ligne (ligne ~5):
const USE_API_STORAGE = false;

// Changer Ã :
const USE_API_STORAGE = true;

// Recharger le navigateur
```

### Ã‰tape 5: VÃ©rifier le Fonctionnement
```
Ouvrir: file:///c:/Applications/App_locaCar/worksheet-mini-app/index.html

VÃ©rifier la console du navigateur (F12):
âœ“ Pas d'erreur CORS
âœ“ Les requÃªtes API apparaissent dans Network
âœ“ Les donnÃ©es se chargent depuis http://localhost:3001
```

---

## ðŸ”„ Comparaison Modes

| Aspect | localStorage | API PostgreSQL |
|--------|---|---|
| **Installation** | Aucune | npm + Docker |
| **Persistance** | Par navigateur | Base de donnÃ©es |
| **Multi-navigateur** | âŒ Non | âœ… Oui |
| **Multi-utilisateur** | âŒ Non | âœ… Oui |
| **Backup** | Manuel | Automatique |
| **AccÃ¨s API** | âŒ Non | âœ… Oui |
| **Performance** | Excellente | TrÃ¨s bonne |
| **ScalabilitÃ©** | LimitÃ©e | Excellente |

---

## ðŸ› Troubleshooting

### Erreur: CORS issue
```
Access to XMLHttpRequest at 'http://localhost:3001' 
from origin 'file://' has been blocked by CORS policy
```

**Solution**:
```javascript
// Dans storage-wrapper.js, vÃ©rifier:
// Que USE_API_STORAGE = true
// Que le backend est lancÃ© (docker-compose up -d)
// Que le port 3001 est accessible
```

### Erreur: API ne rÃ©pond pas
```
Failed to fetch
```

**Solution**:
```bash
# 1. VÃ©rifier le backend
docker-compose ps
# Doit montrer: locacar_backend RUNNING

# 2. VÃ©rifier les logs
docker-compose logs locacar_backend

# 3. VÃ©rifier la connectivitÃ©
curl http://localhost:3001/api/v1/health

# 4. Relancer si besoin
docker-compose restart
```

### Erreur: Base de donnÃ©es
```
database connection failed
```

**Solution**:
```bash
# 1. VÃ©rifier PostgreSQL
docker-compose ps
# Doit montrer: locacar_postgres RUNNING

# 2. VÃ©rifier les variables d'environnement
# Fichier: .env (ou voir docker-compose.yml)
# VÃ©rifier:
# - POSTGRES_USER
# - POSTGRES_PASSWORD
# - POSTGRES_HOST
# - POSTGRES_PORT

# 3. Relancer les services
docker-compose down
docker-compose up -d
```

### Les donnÃ©es ne se chargent pas
```
1. F12 â†’ Console â†’ Voir les erreurs
2. VÃ©rifier que USE_API_STORAGE = true
3. VÃ©rifier dans Network que les requÃªtes vont Ã  http://localhost:3001
4. VÃ©rifier que le backend retourne des donnÃ©es:
   curl http://localhost:3001/api/v1/cars
```

---

## âš™ï¸ Configuration AvancÃ©e

### Variables d'Environnement

**Fichier**: `.env` (Ã  crÃ©er Ã  la racine du projet)

```env
# Backend
NODE_ENV=development
PORT=3001

# PostgreSQL
POSTGRES_USER=locacar_user
POSTGRES_PASSWORD=locacar_password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=locacar_db

# Redis
REDIS_URL=redis://redis:6379

# SÃ©curitÃ©
JWT_SECRET=your_secret_key_here
```

### Adapter l'URL de l'API

**Fichier**: `worksheet-mini-app/storage-wrapper.js`

```javascript
// Pour production, changer Ã :
const API_BASE_URL = 'https://api.votre-domaine.com/api/v1';

// Pour localhost avec port custom:
const API_BASE_URL = 'http://localhost:3001/api/v1';
```

---

## ðŸ§ª Test des Endpoints

### Avec curl
```bash
# Get all cars
curl http://localhost:3001/api/v1/cars

# Create a car
curl -X POST http://localhost:3001/api/v1/cars \
  -H "Content-Type: application/json" \
  -d '{"id":"CAR-001","plate":"TN-123-XX","model":"Dacia","brand":"Renault"}'

# Get one car
curl http://localhost:3001/api/v1/cars/CAR-001

# Update a car
curl -X PUT http://localhost:3001/api/v1/cars/CAR-001 \
  -H "Content-Type: application/json" \
  -d '{"status":"maintenance"}'

# Delete a car
curl -X DELETE http://localhost:3001/api/v1/cars/CAR-001
```

### Avec Postman/Insomnia
1. Import cette collection:
```json
{
  "info": { "name": "LocaCar API", "version": "1.0" },
  "item": [
    {
      "name": "GET /cars",
      "request": { "method": "GET", "url": "http://localhost:3001/api/v1/cars" }
    },
    {
      "name": "GET /customers",
      "request": { "method": "GET", "url": "http://localhost:3001/api/v1/customers" }
    }
  ]
}
```

---

## ðŸ“Š Monitoring

### Logs des Services
```bash
# Backend
docker-compose logs -f locacar_backend

# PostgreSQL
docker-compose logs -f locacar_postgres

# Redis
docker-compose logs -f locacar_redis

# Tous
docker-compose logs -f
```

### Health Check
```bash
# API
curl http://localhost:3001/api/v1/health

# Attendu:
# {"success":true,"message":"API is healthy","database":"connected"}
```

---

## ðŸ”™ Revenir Ã  localStorage

Si vous voulez temporairement revenir Ã  localStorage:

**Fichier**: `worksheet-mini-app/storage-wrapper.js`

```javascript
// Changer:
const USE_API_STORAGE = true;

// Ã€:
const USE_API_STORAGE = false;

// Recharger le navigateur
```

**Attention**: Les donnÃ©es crÃ©Ã©es en API ne seront plus visibles en localStorage !

---

## ðŸ’¾ Backup des DonnÃ©es

### Mode localStorage
```javascript
// Dans la console du navigateur:
copy(localStorage.getItem('locacar-mini-v3'))
// Sauvegarder dans un fichier .json
```

### Mode PostgreSQL
```bash
# Backup de la base
docker-compose exec postgres pg_dump -U locacar_user locacar_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U locacar_user locacar_db < backup.sql
```

---

## ðŸ“ž Pour Aller Plus Loin

- Documentation dÃ©taillÃ©e: `DEPLOYMENT_GUIDE.md`
- Architecture: `WORK_SUMMARY.md`
- Schema DB: `src/backend/schema.sql`
- API Client: `worksheet-mini-app/api-client.js`

---

**PrÃªt Ã  basculer vers l'API ?** ðŸš€

