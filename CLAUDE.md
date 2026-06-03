# CLAUDE.md — App_locaCar

## Règles du projet

### Documentation
Après **chaque modification** de code, mettre à jour la documentation correspondante dans `docs/` :
- `docs/01-specifications/BMAD.md` — si les specs métier ou règles business changent
- `docs/02-architecture/ARCHITECTURE.md` — si l'architecture ou les services changent
- `docs/03-data-model/SCHEMA_REFERENCE.md` — si le schéma DB change
- `docs/04-features/FEATURE_SPECIFICATIONS.md` — si une feature est ajoutée ou modifiée
- `docs/05-api/API_REFERENCE.md` — si les endpoints API changent

## Architecture rapide

- **App principale** : `worksheet-mini-app/index.html` + `serve.js` (port 3000)
- **Backend API** : `src/backend/index.ts` (port 3001, Express + Supabase)
- **Frontend React** : `src/frontend/` (en cours de construction)
- **DB** : Supabase (PostgreSQL cloud), URL dans `.env`

## Démarrer en local

```bash
# App worksheet (port 3000)
node serve.js

# Backend API (port 3001)
npm run backend:dev
```

## Variables d'env requises

- `SUPABASE_URL` — URL du projet Supabase
- `SUPABASE_ANON_KEY` — clé anonyme Supabase
- `JWT_SECRET` — secret JWT pour l'API backend
- `ANTHROPIC_API_KEY` — (optionnel) pour l'analyse de dommages IA
- `PORT` — injecté automatiquement par Railway en production
