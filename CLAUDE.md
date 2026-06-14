# CLAUDE.md — App_locaCar

## Règles du projet

### Documentation
Après **chaque modification** de code, mettre à jour la documentation correspondante dans `docs/` :
- `docs/01-specifications/BMAD.md` — si les specs métier ou règles business changent
- `docs/02-architecture/ARCHITECTURE.md` — si l'architecture ou les services changent
- `docs/03-data-model/SCHEMA_REFERENCE.md` — si le schéma DB change
- `docs/04-features/FEATURE_SPECIFICATIONS.md` — si une feature est ajoutée ou modifiée
- `docs/05-api/API_REFERENCE.md` — si les endpoints API changent

### Persistance des données (règle absolue)
Aucun écran ne doit fonctionner uniquement avec des données locales/temporaires (état JS, localStorage). **Tout écran doit lire et écrire via l'API backend → Supabase** :
- Au chargement : récupérer les données via `apiGet`/`loadDataFromAPI` (pas uniquement depuis `localStorage`/le seed démo)
- À la création/modification : persister via `apiPost`/`apiPut`/`upsertMany` vers le bon endpoint, puis mettre à jour `state` localement
- Si une nouvelle entité est ajoutée à `state` (ex. `leasingContracts`, `insurances`), vérifier qu'elle est bien : (1) chargée dans `loadDataFromAPI`, (2) écrite par les formulaires de création/édition, (3) incluse dans `syncStateToAPI`/`/demo/reset` pour le bouton "Charger données démo"
- Repère pour auditer une entité : chercher son nom dans `loadDataFromAPI`, les handlers `addXxxBtn`, `syncStateToAPI`, et la route backend correspondante (`src/backend/routes/`)

### Navigation cliquable depuis les widgets (règle absolue)
Chaque pile/carte statistique (KPI), liste et graphique de l'application doit être cliquable et renvoyer vers l'écran contenant les données détaillées **avec le même filtre déjà appliqué** (ex. cliquer sur "Contrats actifs" → onglet Contrats filtré sur statut=actif ; cliquer sur une barre du graphique de rentabilité par véhicule → détail de ce véhicule). S'inspirer du pattern déjà en place sur les graphiques du dashboard (`onClick` + `switchToTab`/`openTab` + filtre pré-rempli).

## Architecture rapide

- **App principale** : `worksheet-mini-app/index.html` + `serve.js` (port 3000)
- **Backend API** : `src/backend/index.ts` (port 3001, Express + Supabase)
- **Frontend React** : `src/frontend/` (en cours de construction)
- **DB** : Supabase (PostgreSQL cloud), URL dans `.env`

## Démarrer en local

```bash
# App worksheet (port 3000) — API_URL requis pour que le frontend trouve le backend
API_URL=http://localhost:3001/api/v1 node serve.js

# Backend API (port 3001)
npm run backend:dev
```

## Variables d'env requises

- `SUPABASE_URL` — URL du projet Supabase
- `SUPABASE_ANON_KEY` — clé anonyme Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — clé service_role Supabase (contourne RLS). **Sans elle, le backend retombe sur la clé anon et tous les écritures (`POST`/`PUT`/`PATCH` Supabase) échouent en 401 à cause des policies RLS** — à ajouter dans `.env` local en plus de Railway
- `API_URL` — URL de base de l'API backend vue par le frontend (ex. `http://localhost:3001/api/v1`), injectée par `serve.js` via `window._API_URL`. Sans elle, la connexion échoue avec "API_URL non configuré"
- `JWT_SECRET` — secret JWT pour l'API backend
- `ANTHROPIC_API_KEY` — (optionnel) pour l'analyse de dommages IA
- `PORT` — injecté automatiquement par Railway en production
