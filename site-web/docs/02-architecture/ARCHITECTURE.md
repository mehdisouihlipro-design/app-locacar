# Architecture — Portail Client LocaCar · site-web

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────┐
│                 Navigateur client                    │
│                                                      │
│  index.html + style.css + app.js                     │
│  (HTML/CSS/JS statique — aucune dépendance npm)      │
│                                                      │
│  window.SITE_API_URL ─────────────────────────┐      │
└──────────────────────────────────────────────────────┘
                                                 │ fetch()
                                                 ▼
┌──────────────────────────────────────────────────────┐
│          Backend LocaCar (App_locaCar)               │
│          Port 3001 / Railway en production           │
│                                                      │
│  GET /api/v1/public/cars?from=&to=                   │
│  (route sans authentification JWT)                   │
│                       │                              │
│                       ▼                              │
│  global.db (axios → Supabase REST API)               │
│                       │                              │
│         ┌─────────────┴──────────────┐               │
│         ▼                            ▼               │
│  SELECT cars               SELECT contract_lines     │
│  (champs publics)          + reservations            │
│  status IN (disponible,    (calcul disponibilité)    │
│             reserve)                                 │
└──────────────────────────────────────────────────────┘
                                                 │
                                                 ▼
                                    ┌────────────────────┐
                                    │   Supabase (cloud) │
                                    │   PostgreSQL       │
                                    │                    │
                                    │  cars              │
                                    │  contract_lines    │
                                    │  reservations      │
                                    └────────────────────┘
```

## Stack technique

| Couche       | Technologie                                         |
|--------------|-----------------------------------------------------|
| HTML         | HTML5 sémantique                                    |
| CSS          | CSS3 + Custom Properties (variables CSS)            |
| JavaScript   | Vanilla ES2020 (modules natifs, pas de bundler)     |
| Typographie  | Inter (Google Fonts CDN)                            |
| Backend      | Express + TypeScript (App_locaCar `src/backend/`)   |
| Base de données | Supabase (PostgreSQL cloud)                      |

## Fichiers principaux

```
site-web/
├── index.html              ← Page unique (SPA-like, pas de routing)
├── assets/
│   ├── css/style.css       ← Tous les styles (CSS variables, responsive)
│   └── js/app.js           ← Logique métier : fetch, rendu, filtres
├── CLAUDE.md               ← Instructions pour Claude Code
├── .env.example            ← Template de configuration
└── docs/                   ← Documentation BMAD complète
```

## Flux de données (Lot 1)

1. L'utilisateur ouvre `index.html`
2. `app.js` appelle `GET /api/v1/public/cars` (sans paramètres)
3. Le backend interroge Supabase : `cars` où `status IN ('disponible','reserve')`
4. Les voitures sont affichées avec des SVG colorés selon `cars.color`
5. L'utilisateur sélectionne des dates et clique "Rechercher"
6. `app.js` appelle `GET /api/v1/public/cars?from=DATE&to=DATE`
7. Le backend exclut les voitures avec des conflits de période (contract_lines + reservations)
8. Le catalogue est mis à jour avec les voitures disponibles

## Configuration

L'URL du backend est configurée via `window.SITE_API_URL` dans la balise `<script>` de `index.html` :

```html
<script>
  window.SITE_API_URL = 'http://localhost:3001'; // dev
  // window.SITE_API_URL = 'https://xxx.railway.app'; // prod
</script>
```

## Déploiement

Le site est 100% statique : il suffit de servir les fichiers sur n'importe quel hébergeur.

| Hébergeur       | Commande / Notes                                           |
|-----------------|------------------------------------------------------------|
| **Netlify**     | Drag & drop du dossier `site-web/` ou déploiement Git      |
| **Vercel**      | `vercel --cwd site-web`                                    |
| **GitHub Pages**| Push dans une branche `gh-pages`                           |
| **Railway**     | Ajout d'un service "Static Site" pointant sur `site-web/`  |
| **Local**       | `npx serve site-web -p 8080`                               |

> **CORS** : le backend LocaCar (`src/backend/index.ts`) applique `app.use(cors())` qui autorise toutes les origines. En production, restreindre à l'URL exacte du portail client.

## Évolutions Lot 2

- Ajouter un formulaire de réservation → `POST /api/v1/public/reservations`
- Ajouter les champs `photo_url` et `price_day` dans la route `/api/v1/public/cars`
- Prévoir une migration SQL pour ajouter `photo_url TEXT` sur la table `cars`
