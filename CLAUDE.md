# CLAUDE.md — App_locaCar

## Règles du projet

### Alignement label-valeur (règle absolue UI)
Dans **tous les écrans** (modals, listes, formulaires, cartes KPI, tableaux), le bord gauche du label doit être **exactement aligné** avec le bord gauche de la valeur qu'il décrit. Règles concrètes :
- Ne jamais mettre un `padding` ou `margin-left` différent sur le label et sur la valeur dans un même bloc.
- Utiliser `display: flex; flex-direction: column; align-items: flex-start;` (ou `display: block`) pour les paires label/valeur — jamais `text-align: center` sauf dans les cellules de tableaux centrées explicitement.
- Les labels de sections (ex. `MUTED_LABEL`, `<small>`, `<span class="label">`) doivent hériter du même `padding-left` que leur valeur.
- **Repère d'audit** : sélectionner visuellement le label, vérifier que son bord gauche coïncide pixel par pixel avec celui de la valeur en dessous.

### Label obligatoire sur chaque champ (règle absolue UI)
Tout champ de formulaire, d'éditeur générique ou de modal doit avoir un **label en français lisible** — jamais le nom technique camelCase ou snake_case.

Règles concrètes :
- **Formulaire de création/édition HTML** : chaque `<input>`, `<select>`, `<textarea>` doit être précédé d'un `<label>` (ou d'un `<label class="label-small">`) avec le libellé français.
- **Éditeur générique `openRecordEditor`** : tout nouveau champ d'une entité doit avoir une entrée dans `fieldLabelMap` (`"entite.champ": "Libellé français"`). Si le champ n'est pas dans ce map, l'éditeur affiche le nom technique brut — c'est une régression.
- **Règles complémentaires pour `getEditorFieldConfig`** :
  - Champ date → ajouter `"entite.champ": "date"` dans `inputTypeMap`
  - Champ enum (liste fermée) → ajouter dans `enumMap` ou `enumMap2`
  - Champ lié à une autre entité → ajouter dans `lookupMap`
  - Champ calculé/lecture seule → ajouter dans `calculatedFields`
- **Migration DB** : tout nouveau champ persisté en base nécessite une migration SQL dans `src/backend/migrations/<N>_<nom>.sql`. **Signaler explicitement à l'utilisateur** qu'il doit exécuter la migration dans le SQL Editor Supabase avant de tester — ne jamais supposer qu'elle sera appliquée automatiquement.
- **Repère d'audit** : ouvrir l'éditeur générique (double-clic sur une ligne) de l'entité modifiée → aucun champ ne doit afficher un nom camelCase ou snake_case comme label.

### Visibilité complète des valeurs (règle absolue UI)
Les valeurs (texte, nombres, badges, dates) doivent être **entièrement lisibles** dans tous les états de l'interface. Règles concrètes :
- Interdire `overflow: hidden` sur un conteneur de valeur sans prévoir `text-overflow: ellipsis` + `title` tooltip affichant la valeur complète.
- Les colonnes de tableaux ont une largeur minimale suffisante (`min-width`) pour que la valeur la plus courante soit visible sans tronquage ni débordement masqué.
- Les inputs et cellules de formulaire en mode lecture ne doivent pas clipper leur contenu.
- **Repère d'audit** : réduire la fenêtre à 1024 px de large → aucune valeur ne doit être coupée ; le tableau doit défiler (`overflow-x: auto`) plutôt que tronquer.

### Documentation
Après **chaque modification** de code, mettre à jour la documentation correspondante dans `docs/` :
- `docs/01-specifications/BMAD.md` — si les specs métier ou règles business changent
- `docs/02-architecture/ARCHITECTURE.md` — si l'architecture ou les services changent
- `docs/03-data-model/SCHEMA_REFERENCE.md` — si le schéma DB change
- `docs/04-features/FEATURE_SPECIFICATIONS.md` — si une feature est ajoutée ou modifiée
- `docs/05-api/API_REFERENCE.md` — si les endpoints API changent
- `USER_GUIDE.md` — si l'expérience utilisateur change (nouvel écran, nouveau bouton/action, changement de parcours, FAQ/troubleshooting impactés) ; régénérer ensuite `USER_GUIDE.pdf` à partir du `.md` mis à jour

### Use Cases (règle absolue)
Pour **chaque fonctionnalité** ajoutée ou modifiée, écrire ou mettre à jour les cas d'utilisation correspondants dans `docs/06-tests/MASTER_TEST_PLAN.md`.

**Format obligatoire** :
```
### UC-<MODULE>-<n> : <Titre en verbe d'action>
**En tant que <rôle>**, je veux <objectif>.

- [ ] **<Scénario nominal>** : <précondition> → <action> → <résultat attendu>
- [ ] **<Scénario alternatif>** : ...
- [ ] **<Cas d'erreur>** : ...
- [ ] **Persistance** : F5 après l'action → données toujours présentes (vérification base)
```

**Modules et préfixes** : `AUTH` · `CAR` · `CUST` · `CTR` (contrats) · `INV` (factures) · `PAY` · `MAINT` · `RSV` (réservations) · `QUO` (devis) · `SET` (paramètres) · `DASH` (dashboard/KPIs)

**Ce qu'un UC doit couvrir** :
1. **Scénario nominal** (tout se passe bien)
2. **Validation UI** (champ obligatoire vide, format invalide → erreur inline visible)
3. **Erreur backend** (400/409/422 → message compréhensible affiché à l'utilisateur)
4. **Persistance** (rechargement F5 → donnée toujours là)
5. **Navigation** (si la feature a une règle de navigation cliquable → UC dédié)
6. **Rétro-compatibilité** (si migration de données — ex. JSONB → table relationnelle → anciens enregistrements toujours lisibles/éditables)

**Quand ajouter les UC** : immédiatement après la livraison de la fonctionnalité, dans le même commit. Si la feature modifie un UC existant (ex. BR21 modifie UC-INV-2), le mettre à jour plutôt qu'en créer un doublon.

### Persistance des données (règle absolue)
Aucun écran ne doit fonctionner uniquement avec des données locales/temporaires (état JS, localStorage). **Tout écran doit lire et écrire via l'API backend → Supabase** :
- Au chargement : récupérer les données via `apiGet`/`loadDataFromAPI` (pas uniquement depuis `localStorage`/le seed démo)
- À la création/modification : persister via `apiPost`/`apiPut`/`upsertMany` vers le bon endpoint, puis mettre à jour `state` localement
- Si une nouvelle entité est ajoutée à `state` (ex. `leasingContracts`, `insurances`), vérifier qu'elle est bien : (1) chargée dans `loadDataFromAPI`, (2) écrite par les formulaires de création/édition, (3) incluse dans `syncStateToAPI`/`/demo/reset` pour le bouton "Charger données démo"
- Repère pour auditer une entité : chercher son nom dans `loadDataFromAPI`, les handlers `addXxxBtn`, `syncStateToAPI`, et la route backend correspondante (`src/backend/routes/`)

### Navigation cliquable depuis les widgets (règle absolue)
Chaque pile/carte statistique (KPI), liste et graphique de l'application doit être cliquable et renvoyer vers l'écran contenant les données détaillées **avec le même filtre déjà appliqué** (ex. cliquer sur "Contrats actifs" → onglet Contrats filtré sur statut=actif ; cliquer sur une barre du graphique de rentabilité par véhicule → détail de ce véhicule). S'inspirer du pattern déjà en place sur les graphiques du dashboard (`onClick` + `switchToTab`/`openTab` + filtre pré-rempli).

### Tables relationnelles pour les collections de lignes (règle absolue)
Toute collection de lignes rattachée à un entête (ex. `invoice_lines` → `invoices`, `contract_lines` → `contracts`, `quote_lines` → `quotes`) doit être une **table relationnelle dédiée**, jamais un champ JSONB sur l'entête.

**Schéma cible pour chaque nouvelle table de lignes** :
- Colonne `id` (PK), colonne `<entête>_id` (FK `→ <entête>.id ON DELETE CASCADE`), colonnes métier, colonnes audit (`created_at`, `created_by`, `updated_at`, `updated_by`)
- Index sur `<entête>_id`
- Migration SQL dans `src/backend/migrations/<n>_<nom>.sql`

**Backend** :
- Fichier `src/backend/routes/<entité>-lines.routes.ts` avec `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- Chaque `POST`/`PUT`/`DELETE` **recalcule et met à jour les totaux de l'entête parent** (fonction `recalc<Entête>Totals`)
- `DELETE /:id` retourne **422** si suppression de la dernière ligne (toute entête doit avoir ≥ 1 ligne)
- `POST /<entête>` accepte un tableau `lines[]` dans le body, crée l'entête puis insère chaque ligne dans la table relationnelle ; retourne **400** si `lines` est vide
- Enregistrer la nouvelle route dans `src/backend/index.ts` et dans `src/backend/routes/demo.routes.ts` (suppression dans l'ordre FK inverse + insertion après l'entête)

**Frontend** :
- `state.<entitéLines> = []` initialisé au démarrage
- Chargé dans `loadDataFromAPI` via `apiGet("/<entité>-lines")`
- `renderXxxDetailLines(id)` filtre `state.<entitéLines>` par l'id de l'entête ; **repli JSONB** pour les anciens enregistrements pas encore migrés
- **Migration lazy** : à la première ouverture du modal de détail d'un enregistrement ancien (JSONB, pas encore dans la table relationnelle), migrer automatiquement ses lignes via `POST /<entité>-lines` avant d'afficher
- Ajout/édition/suppression de ligne depuis le modal → appels `apiPostWithError`/`apiPutWithError`/`apiDeleteWithError` vers les endpoints dédiés (jamais mutation locale du JSONB)
- Après chaque opération, recalculer les totaux localement et appeler `PUT /<entête>/:id` avec les nouveaux totaux
- Inclure `state.<entitéLines>` dans `syncStateToAPI` (body demo/reset) et ajouter `state.<entitéLines> = []` dans le handler du bouton "Réinitialiser"
- Repère pour auditer : chercher `<entitéLines>` dans `loadDataFromAPI`, `submitInline`, `save*Edit`, `delete*`, `syncStateToAPI`, et la route backend `src/backend/routes/<entité>-lines.routes.ts`

**Exemple appliqué** : `invoice_lines` (BR21, juin 2026) — `src/backend/routes/invoice-lines.routes.ts`, migration `006_br21_invoice_lines.sql`, `state.invoiceLines` dans le frontend.

### Sélecteur de colonnes sur tous les grids (règle absolue)
**Tout nouvel écran liste (grid)** doit intégrer le sélecteur de colonnes `⚙ Colonnes` dès sa création. Liste des étapes obligatoires :

1. **HTML** — ajouter `<button class="secondary" data-col-picker="<entity>" onclick="openColumnPicker('<entity>', this)">⚙ Colonnes</button>` dans la `div.actions` du panel.
2. **Thead statique** — ajouter `data-col="<key>"` sur chaque `<th>` de données (pas sur la colonne Action).
3. **Tbody render** — ajouter `data-col="<key>"` sur chaque `<td>` de données dans la boucle de rendu.
4. **data-entity** — au début de la fonction `render<Entity>()`, ajouter `tbody.closest("table").dataset.entity = "<entity>"`.
5. **COL_DEFS** — ajouter une entrée `<entity>: [{ key, label, render }, …]` dans l'objet `COL_DEFS` (avant `renderCars`). `render` est optionnel pour les entités non-dynamiques.
6. **DEFAULT_COLS** — ajouter `<entity>: ["col1", "col2", …]` dans l'objet `DEFAULT_COLS` (sous-ensemble par défaut).
7. **applyColPrefs** — appeler `applyColPrefs("<entity>")` **en fin** de la fonction `render<Entity>()`.
8. **saveAndRender** — ajouter `"<entity>"` dans le tableau passé à `.forEach(applyColPrefs)`.
9. **renderMap** — ajouter `<entity>: render<Entity>` dans les trois `renderMap` de `openColumnPicker` (inline change-handler + bouton Défaut + bouton Tout).
10. **COLUMNS array** — s'assurer que le `<ENTITY>_COLUMNS` array contient exactement les mêmes clés (dans le même ordre) que les `<th>` du thead statique de données, pour que `setupSortableTable` génère les bons filtres avec `data-col`.

**Règle de parité thead/tbody** : le nombre de `<th data-col>` dans le thead doit être **identique** au nombre de `<td data-col>` dans chaque `<tr>` du tbody. Toute colonne ajoutée au tbody doit aussi être ajoutée au thead (et au `<ENTITY>_COLUMNS` array).

**Repère d'audit** : chercher `data-col-picker="<entity>"`, `data-entity="<entity>"`, `applyColPrefs("<entity>")`, `COL_DEFS.<entity>`, `DEFAULT_COLS.<entity>` dans `worksheet-mini-app/index.html`.

### Cohérence des contrôles de saisie (règle absolue)
Un même champ doit utiliser **le même type de contrôle à la création et dans l'éditeur générique de détail/édition** (`openRecordEditor`). Si un champ est une liste de choix contrainte (select) dans le formulaire de création, il doit rester un select avec les mêmes options dans l'éditeur générique — jamais retomber en saisie libre (`input` texte).
- Repère pour appliquer cette règle : dans `getEditorFieldConfig`, ajouter l'entrée `"<entity>.<champ>"` au `lookupMap` avec les mêmes options que le `<select>` du formulaire de création.
- Si un champ dérivé (ex. libellé associé au choix) doit rester synchronisé avec ce choix, l'ajouter à `calculatedFields` (lecture seule dans l'éditeur) et calculer sa valeur dans `applyDerivedFields`.
- Pour les enregistrements existants dont la valeur figée ne correspond plus aux options actuelles (paramètres modifiés depuis), `openRecordEditor` réinjecte automatiquement la valeur stockée comme option supplémentaire — ne pas la perdre.
- Exemple appliqué : `invoices.rib`/`invoices.ribLabel` (sélecteur RIB1/RIB2, cf. BR22) utilisent désormais le même sélecteur qu'à la création de facture (`#invoiceRib`).

### Blocage sur erreur à l'enregistrement (règle absolue)
**Dans tous les écrans, quelle que soit l'entité**, une erreur lors de la création ou modification d'un enregistrement doit **bloquer avec un message d'erreur visible** — jamais fermer silencieusement le formulaire/modal en laissant croire que l'enregistrement a été créé alors qu'il ne l'a pas été.

Règles concrètes :
- **Jamais `apiPost`/`apiPut` seuls pour une création/modification déclenchée par l'utilisateur.** Ces deux helpers (définis vers `index.html` ~5808/5822) avalent silencieusement toute erreur réseau ou backend et retournent `null` — ils ne doivent être utilisés que pour de la synchronisation best-effort en arrière-plan, jamais pour un bouton "Enregistrer"/"Nouveau X".
- **Toujours utiliser `apiPostWithError`/`apiPutWithError`/`apiDeleteWithError`**, qui retournent `{ ok, data, status, errorMsg }`, et **vérifier `.ok` avant de continuer** :
  ```js
  const res = await apiPostWithError("/entite", payload);
  if (!res.ok) {
    alert(`Erreur lors de la création : ${res.errorMsg}`);
    return; // ne pas fermer le modal, ne pas pousser dans state, ne pas re-render
  }
  const saved = res.data;
  ```
- Ne fermer le modal/formulaire, ne pousser l'enregistrement dans `state.<entité>`, et ne rafraîchir l'affichage **qu'après** avoir confirmé `res.ok`.
- Si une opération dépend d'un enregistrement déjà créé avec succès juste avant (ex. mise à jour du solde d'une facture après un paiement), une erreur sur cette étape secondaire est un **avertissement** (l'enregistrement principal existe déjà côté serveur) — informer l'utilisateur clairement, mais ne pas annuler l'opération principale déjà réussie.
- Pour une création en lot (boucle sur plusieurs enregistrements), ne pas utiliser `.forEach(async ...)` (les erreurs et l'ordre de complétion ne sont pas fiables) — utiliser `for...of` avec `await`, comptabiliser succès/échecs, et afficher un récapitulatif incluant les échecs.
- **S'applique identiquement à la création ET à la modification** : un bouton "✓ Enregistrer" sur un entête existant (contrat, devis, facture, paramètres, changement de statut…) suit exactement la même règle qu'un bouton "Nouveau X" — ne jamais muter `state`/fermer le mode édition avant d'avoir confirmé `res.ok`.
- **Exception volontaire** : les préférences d'affichage pures (ex. `saveDashboardLayout` → `/preferences/dashboard-layout`) ne sont pas des enregistrements métier — les laisser en synchronisation silencieuse best-effort (`apiPut` + `try/catch` + `console.warn`) reste correct ; ne pas ajouter d'`alert()` bloquante sur un simple drag/resize de widget.
- **Repère d'audit** : chercher `await apiPost(` et `await apiPut(` (sans `WithError`) dans `worksheet-mini-app/index.html` — tout appel trouvé en dehors de la synchronisation best-effort (`syncStateToAPI`, préférences d'affichage) est une régression potentielle.

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
