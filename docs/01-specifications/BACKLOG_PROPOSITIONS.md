# Backlog de propositions

## LocaCar - Idées en attente d'arbitrage

**Statut du document** : propositions non planifiées, aucune n'est encore engagée en développement. Chaque entrée décrit un besoin (user story) et le contexte qui l'a fait émerger, pour pouvoir reprendre le sujet plus tard sans perdre le raisonnement.

Quand une proposition est retenue pour implémentation : la déplacer vers `docs/01-specifications/BMAD.md` (section 6.5, avec numéro de BR) et suivre le processus normal (migration si besoin, code, UC dans `docs/06-tests/MASTER_TEST_PLAN.md`, mise à jour des autres docs concernés).

---

### PROP-1 : Relances de paiement automatisées

**En tant que** comptable, **je veux** que les factures impayées déclenchent automatiquement une relance (email) au client, **afin de** ne plus dépendre de l'ouverture manuelle de l'onglet Recouvrement pour détecter un retard de paiement.

**Contexte** : le schéma possède déjà `last_reminder_at` et `reminder_count` sur les factures (`src/backend/schema.sql:170-171`), mais rien dans le backend ne les met à jour ni n'envoie d'email — ces colonnes sont mortes aujourd'hui. L'onglet Recouvrement existe et affiche l'état des factures, mais c'est un mode "pull" (il faut l'ouvrir pour voir un impayé).

**Pistes d'implémentation à évaluer plus tard** :
- Job planifié (cron backend) qui scanne les factures `due_date` dépassée / proche et non soldées
- Paliers configurables (ex. J-3 avant échéance, J+1, J+15 en retard) — probablement dans `Paramètres`
- Canal d'envoi : email dans un premier temps (SMS mentionné dans les specs V1 mais nécessite un fournisseur tiers, à confirmer si utile)
- Mise à jour de `last_reminder_at`/`reminder_count` à chaque envoi, visible dans le détail facture

---

### PROP-2 : Alertes proactives par email (échéances assurance / vignette / leasing)

**En tant que** gestionnaire de flotte, **je veux** recevoir un résumé périodique des échéances proches (assurance, vignette, leasing), **afin de** ne pas dépendre d'une visite manuelle de l'onglet Alertes pour anticiper un renouvellement.

**Contexte** : l'onglet "Alertes" existe déjà et calcule correctement les échéances proches côté frontend (`collectAlerts()` / `renderAlerts()` dans `worksheet-mini-app/index.html`), avec des niveaux `en_retard` / `urgent` / `proche`. Le calcul est fait ; il manque uniquement le déclenchement et la diffusion en dehors de l'application.

**Pistes d'implémentation à évaluer plus tard** :
- Réutiliser la logique de `collectAlerts()` côté backend (ou exposer un endpoint qui la recalcule server-side) pour ne pas dupliquer la règle métier
- Job planifié quotidien → email digest au(x) gestionnaire(s) si au moins une alerte `urgent`/`en_retard`
- Éviter le spam : ne pas ré-envoyer une alerte déjà notifiée la veille sans changement de niveau

---

### PROP-3 : Transitions de statut automatiques (contrats / devis)

**En tant que** gestionnaire, **je veux** que les statuts `termine` (ligne de contrat) et `expire` (devis) soient appliqués dès que leur date est dépassée, **afin de** avoir des KPIs et des listes fiables sans dépendre de l'ouverture d'un enregistrement précis pour déclencher la transition.

**Contexte** : BR20 et BR27 (`docs/01-specifications/BMAD.md`) documentent explicitement ce mécanisme comme "transition calculée à l'affichage, persistée à la prochaine action" — c'est-à-dire qu'un devis expiré hier reste `envoye` en base tant que personne ne l'a rouvert. Aucun job planifié n'existe côté backend (vérifié : pas de `cron`/`node-cron`/tâche planifiée dans `src/backend`).

**Pistes d'implémentation à évaluer plus tard** :
- Job planifié (quotidien, nuit) qui applique les transitions `active → termine` (contract_lines) et `envoye → expire` (quotes) en base
- Vérifier l'impact sur BR19 (les lignes `termine` sont-elles exclues du contrôle de chevauchement comme les lignes `resilie`/`annule` ?) et sur les KPIs dashboard qui filtrent par statut
- Attention à ne pas transitionner une ligne/un devis en cours d'édition côté UI au même instant (risque de conflit avec une sauvegarde utilisateur)

---

### PROP-4 : Multi-agence

**En tant que** propriétaire de plusieurs agences, **je veux** que chaque enregistrement (véhicule, contrat, facture, utilisateur…) soit rattaché à une agence, **afin de** pouvoir cloisonner les données par agence et consolider les rapports au niveau groupe.

**Contexte** : le BMAD (`docs/01-specifications/BMAD.md`, section "4.4 Multi-Agency Module") positionne LocaCar comme une application multi-agences, mais aucune route backend actuelle ne référence `agency_id`/`agencies` (vérifié par recherche dans `src/backend/routes/`). C'est un écart de fond entre l'ambition documentée et l'implémentation réelle, pas une simple fonctionnalité manquante.

**Pistes d'implémentation à évaluer plus tard** — chantier structurant, à ne lancer que si plusieurs agences sont concrètement prévues à court terme :
- Nouvelle table `agencies` + colonne `agency_id` sur toutes les tables métier concernées (migration lourde, à séquencer)
- Filtrage de toutes les listes/API par agence de l'utilisateur connecté (RBAC), sauf rôle "Owner"/"Admin" multi-agence
- Impact sur la numérotation des souches (BR33) : souche par agence ou souche globale ? à trancher
- Impact sur BR19 (chevauchement véhicule) : un véhicule appartient-il à une seule agence, ou peut-il être partagé (cf. "Inter-Agency Vehicle Sharing" F4.2 du BMAD) ?

---

## Comment reprendre une proposition

1. Relire l'entrée ci-dessus + les fichiers cités pour retrouver le contexte exact
2. Discuter du périmètre exact avec l'utilisateur (souvent plus étroit que la piste d'implémentation esquissée)
3. Une fois validée : migration SQL si besoin (`src/backend/migrations/`), backend, frontend, documentation (`BMAD.md`, `FEATURE_SPECIFICATIONS.md`, `API_REFERENCE.md` selon le cas), UC dans `MASTER_TEST_PLAN.md`
4. Retirer l'entrée de ce fichier une fois livrée (elle vit désormais dans les docs normales)
