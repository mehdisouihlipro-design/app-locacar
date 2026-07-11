# CLAUDE.md — site-web (Portail Client LocaCar)

Sous-projet indépendant de `c:\Applications\App_locaCar`.
Portail client statique (HTML/CSS/JS) pour la consultation de la flotte de véhicules disponibles.

## Règles du projet (identiques à l'app principale)

### Documentation
Après **chaque modification** de code, mettre à jour la documentation correspondante dans `docs/` :
- `docs/01-specifications/BMAD.md` — si les specs métier ou règles business changent
- `docs/02-architecture/ARCHITECTURE.md` — si l'architecture ou les services changent
- `docs/03-data-model/SCHEMA_REFERENCE.md` — si les données exposées changent
- `docs/04-features/FEATURE_SPECIFICATIONS.md` — si une feature est ajoutée ou modifiée
- `docs/05-api/API_REFERENCE.md` — si les endpoints consommés changent
- Mettre à jour `docs/06-tests/MASTER_TEST_PLAN.md` pour chaque feature ajoutée/modifiée

### Use Cases (règle absolue)
Pour **chaque fonctionnalité** ajoutée ou modifiée, écrire ou mettre à jour les cas d'utilisation dans `docs/06-tests/MASTER_TEST_PLAN.md`.

**Format obligatoire** :
```
### UC-<MODULE>-<n> : <Titre en verbe d'action>
**En tant que <rôle>**, je veux <objectif>.

- [ ] **<Scénario nominal>** : <précondition> → <action> → <résultat attendu>
- [ ] **<Scénario alternatif>** : ...
- [ ] **<Cas d'erreur>** : ...
```

**Modules et préfixes** : `CAT` (catalogue) · `SRCH` (recherche) · `FILT` (filtres) · `RSV` (réservation — Lot 2) · `CONF` (configuration/admin)

### Pas de données locales
Le site ne doit jamais afficher de données codées en dur (voitures fictives). Toutes les données proviennent de l'endpoint public du backend LocaCar.

### Sécurité
- Ne jamais exposer la clé service_role Supabase côté frontend.
- Seule la clé anon peut être publique si une connexion Supabase directe est nécessaire.
- L'endpoint `/api/v1/public/` n'expose que les champs publics (aucune donnée client, aucune donnée financière).

### Accessibilité
- Tous les éléments interactifs ont un `aria-label` ou un texte visible.
- Le HTML sémantique est obligatoire (`<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`).

## Architecture

- **Stack** : HTML5 + CSS3 + Vanilla JS (ES2020) — aucun framework, aucun build step
- **Config API** : `window.SITE_API_URL` défini dans `<script>` en tête de `index.html`
- **Endpoint consommé** : `GET /api/v1/public/cars?from=&to=` (backend LocaCar)
- **Images voitures** : SVG inline généré par `app.js` (coloré selon `cars.color`) — Lot 1
  - En Lot 2 : prévoir un champ `photo_url` sur la table `cars` → Supabase Storage

## Démarrer en local

```bash
# 1. Démarrer le backend LocaCar (port 3001)
cd ..
npm run backend:dev

# 2. Servir le site web sur n'importe quel serveur statique (ex. port 8080)
npx serve . -p 8080
# ou avec Python : python -m http.server 8080
# ou ouvrir index.html directement dans le navigateur (CORS peut bloquer les fetch)
```

> **Important CORS** : en développement, ouvrir `index.html` directement (`file://`) ne fonctionnera
> pas si le backend est sur `localhost:3001`. Utilisez un serveur statique local.

## Variables de configuration

| Variable              | Où               | Description                                         |
|-----------------------|------------------|-----------------------------------------------------|
| `window.SITE_API_URL` | `index.html`     | URL base du backend LocaCar (ex. Railway en prod)   |

## Roadmap lots

| Lot | Fonctionnalité                                | Statut       |
|-----|-----------------------------------------------|--------------|
| 1   | Consultation catalogue + filtres              | ✅ Livré      |
| 1   | Vérification disponibilité par dates          | ✅ Livré      |
| 2   | Formulaire de réservation → base Supabase     | 🔜 Planifié   |
| 2   | Affichage du tarif par jour                   | 🔜 Planifié   |
| 2   | Photos réelles des véhicules (Supabase Storage) | 🔜 Planifié |
| 2   | Espace client (historique réservations)       | 🔜 Planifié   |
