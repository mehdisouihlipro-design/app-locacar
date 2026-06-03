# E-Drive — Guide de Déploiement

## Architecture réelle (juin 2026)

```
┌─────────────────────────────────────────────────┐
│               CLOUD (Railway)                   │
│                                                 │
│  serve.js (Node.js)          PORT=auto          │
│  ├── GET /                → worksheet-mini-app/ │
│  ├── GET /html2pdf.bundle.min.js  (statique)    │
│  ├── GET /1000095084.jpg          (statique)    │
│  ├── POST /api/proxy/auth         (Supabase)    │
│  ├── POST /api/proxy/snapshot/*   (Supabase)    │
│  └── POST /api/analyze-damages    (Anthropic)   │
│                                                 │
│  Backend API Express (src/backend/)   port 3001 │
│  └── JWT auth + 13 modules REST                 │
└─────────────────────────────────────────────────┘
         │                         │
         ▼                         ▼
   Supabase Cloud            Anthropic API
   (PostgreSQL)              (analyse dommages IA)
```

**Deux serveurs distincts :**
- `serve.js` — sert la mini-app HTML worksheet (port 3000/prod)
- `src/backend/index.ts` — API REST Express + JWT (port 3001)

---

## Déploiement local (développement)

### Mini-app worksheet (serve.js)

```bash
# Installer les dépendances (une seule fois)
npm install

# Démarrer le serveur
node serve.js
# → http://localhost:3000
```

### Backend API (Express + Supabase)

```bash
# Démarrer le backend
npm run backend:dev
# → http://localhost:3001

# Vérifier la santé de l'API
curl http://localhost:3001/api/v1/health
```

### Variables d'environnement (.env)

```env
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# JWT (backend API)
JWT_SECRET=change_me_in_production

# Optionnel — analyse de dommages IA
ANTHROPIC_API_KEY=sk-ant-...

# Inscription libre
ALLOW_REGISTRATION=true
```

---

## Déploiement cloud — Railway

### Prérequis accomplis (juin 2026)

- [x] `serve.js` adapté pour le cloud :
  - `PORT` utilise `process.env.PORT` (injecté par Railway)
  - Serveur écoute sur `0.0.0.0` (plus `localhost` uniquement)
  - Fichiers statiques servis : `html2pdf.bundle.min.js` et `1000095084.jpg`
- [x] `Procfile` créé : `web: node serve.js`
- [x] `railway.toml` créé
- [x] `package.json` : script `"start": "node serve.js"` ajouté
- [x] Repo GitHub créé : https://github.com/mehdisouihlipro-design/app-locacar

### Étapes de déploiement Railway

**1. Créer un compte / se connecter**
- Aller sur [railway.app](https://railway.app)
- Se connecter avec GitHub

**2. Créer un nouveau projet**
- Cliquer **New Project**
- Choisir **Deploy from GitHub repo**
- Sélectionner `mehdisouihlipro-design/app-locacar`

**3. Railway utilise la config `railway.toml`**
- Build : `npm install --omit=dev` (évite les devDependencies React/TypeScript/Vite)
- Start : `node serve.js`
- Note : `serve.js` n'utilise que des modules Node.js natifs (http, fs, path) — pas de dépendances npm nécessaires

**4. Configurer les variables d'environnement**
- Aller dans l'onglet **Variables** du service
- Ajouter :

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `SUPABASE_URL` | URL du projet Supabase | Oui |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase | Oui |
| `ANTHROPIC_API_KEY` | Clé API Anthropic | Non (pour l'IA uniquement) |

> `PORT` est injecté automatiquement par Railway — ne pas le définir.

> `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont injectés automatiquement dans le localStorage du navigateur par `serve.js` au chargement de la page, ce qui connecte l'app à Supabase sans configuration manuelle.

**5. Domaine public**
- Onglet **Settings → Networking**
- URL de production : `https://web-production-b4967.up.railway.app`

**6. Vérifier le déploiement**
```bash
curl https://web-production-b4967.up.railway.app/
# → 200 OK ✅ (testé et validé juin 2026)
```

### Redéploiement automatique

Chaque `git push` sur la branche `master` déclenche automatiquement un nouveau déploiement Railway.

```bash
git add .
git commit -m "description du changement"
git push origin master
# → Railway redéploie automatiquement
```

---

## Outils installés (juin 2026)

| Outil | Version | Usage |
|-------|---------|-------|
| GitHub CLI (`gh`) | 2.93.0 | Créer/gérer les repos GitHub |
| Node.js | 18+ | Runtime serve.js et backend |
| npm | 9+ | Gestion des dépendances |

### Authentification GitHub CLI

```bash
# Dans un nouveau terminal (après installation gh)
gh auth login
# → Choisir GitHub.com → HTTPS → Login with a web browser
# → Entrer le code affiché dans le navigateur
```

---

## Fonctionnalités de l'app worksheet (serve.js)

| Route | Description |
|-------|-------------|
| `GET /` | Charge `worksheet-mini-app/index.html` |
| `GET /html2pdf.bundle.min.js` | Librairie export PDF |
| `GET /1000095084.jpg` | Logo E-Drive |
| `POST /api/proxy/auth` | Auth Supabase (login/signup) |
| `POST /api/proxy/snapshot/load` | Charge les données de l'utilisateur |
| `POST /api/proxy/snapshot/save` | Sauvegarde les données |
| `POST /api/analyze-damages` | Analyse de dommages via Claude AI |

---

## Tests API réussis (juin 2026)

```bash
# Register
POST /api/v1/auth/register
→ { success: true, data: { id, email, role: "agent" } }

# Login
POST /api/v1/auth/login
→ { success: true, data: { token, user } }

# Profil (token requis)
GET /api/v1/auth/me
→ { success: true, data: { id, email, role, is_active } }

# Health check
GET /api/v1/health
→ { success: true, database: "connected" }
```

---

## Structure des fichiers de déploiement

```
App_locaCar/
├── serve.js              # Serveur mini-app (DÉPLOYÉ sur Railway)
├── Procfile              # web: node serve.js
├── railway.toml          # Config Railway
├── package.json          # "start": "node serve.js"
├── .gitignore            # node_modules, .env, .env.development exclus
├── worksheet-mini-app/
│   ├── index.html        # App principale (324 KB)
│   ├── html2pdf.bundle.min.js
│   └── supabase-schema.sql
└── src/backend/          # API Express (déploiement séparé futur)
```

---

## Prochaines étapes

- [ ] Déployer le backend Express (src/backend/) sur Railway — service séparé
- [ ] Connecter la mini-app au backend JWT au lieu de Supabase Auth direct
- [ ] Configurer un domaine personnalisé sur Railway
- [ ] Mettre en place des variables d'env de production séparées
