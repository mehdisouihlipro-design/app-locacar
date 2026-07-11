# Plan de tests — Portail Client LocaCar · site-web

**Lot courant** : Lot 1 (consultation uniquement)
**Date de création** : 2026-07-06

---

## Modules couverts

| Préfixe | Module                    |
|---------|---------------------------|
| `CAT`   | Catalogue des véhicules   |
| `SRCH`  | Recherche par dates       |
| `FILT`  | Filtres                   |
| `ERR`   | Gestion des erreurs       |

---

### UC-CAT-1 : Afficher le catalogue au chargement
**En tant que visiteur**, je veux voir immédiatement les véhicules disponibles dès l'ouverture du site.

- [ ] **Nominal** : Ouvrir index.html → spinner visible → liste de voitures affichée (si la flotte contient des véhicules disponibles/réservés)
- [ ] **Données affichées** : Chaque carte montre marque, modèle, type de carburant, couleur, agence, kilométrage, statut "Disponible"
- [ ] **SVG coloré** : Le SVG de chaque voiture reflète la couleur stockée en base (ex. "Rouge" → silhouette rouge)
- [ ] **Chips de filtre** : Générées dynamiquement selon les carburants présents dans les résultats
- [ ] **Sélecteur agences** : Alimenté dynamiquement selon les agences présentes
- [ ] **Compteur** : "X véhicules disponibles" (sans mention de dates)
- [ ] **Flotte vide** : Si aucun véhicule disponible → état vide affiché (icône + message)

---

### UC-CAT-2 : Consulter une fiche voiture
**En tant que visiteur**, je veux voir les détails d'un véhicule pour évaluer s'il me convient.

- [ ] **Marque** : Affichée en petit texte uppercase au-dessus du modèle
- [ ] **Modèle** : Affiché en grand texte (titre de la carte)
- [ ] **Badge carburant** : Icône + libellé (⛽ Essence, ⚡ Électrique, etc.)
- [ ] **Badge couleur** : Fond coloré selon la couleur du véhicule
- [ ] **Agence** : 📍 + nom de l'agence (masqué si null)
- [ ] **Kilométrage** : 🔄 + nombre formaté (séparateur milliers FR) (masqué si null)
- [ ] **Statut** : Point vert animé + "Disponible"
- [ ] **Bouton réserver** : Visible, désactivé, tooltip explicatif

---

### UC-SRCH-1 : Rechercher les véhicules disponibles pour des dates
**En tant que visiteur**, je veux sélectionner mes dates pour voir uniquement les voitures libres.

- [ ] **Nominal** : Saisir date départ + date retour → clic Rechercher → catalogue mis à jour avec les voitures disponibles sur la période
- [ ] **Compteur avec dates** : "X véhicules disponibles · du JJ/MM/AAAA au JJ/MM/AAAA"
- [ ] **Voiture occupée exclue** : Une voiture avec un contrat actif sur la période ne doit pas apparaître
- [ ] **Voiture avec réservation exclue** : Une voiture avec une réservation non annulée sur la période ne doit pas apparaître
- [ ] **Voiture libre** : Une voiture sans conflit sur la période doit apparaître
- [ ] **Flotte vide pour les dates** : Si toutes les voitures sont occupées → état vide affiché
- [ ] **Date passée** : Le champ date de départ ne permet pas de sélectionner une date antérieure à aujourd'hui

---

### UC-SRCH-2 : Valider les dates de recherche
**En tant que visiteur**, je veux être guidé si je saisis des dates invalides.

- [ ] **Sans dates** : Clic Rechercher sans dates → toast "Veuillez sélectionner les dates de départ et de retour."
- [ ] **Retour avant départ** : Date retour ≤ date départ → toast "La date de retour doit être après la date de départ."
- [ ] **Date retour auto-réajustée** : Si on change la date de départ à une valeur postérieure à la date de retour déjà saisie → champ retour vidé automatiquement

---

### UC-FILT-1 : Filtrer par carburant
**En tant que visiteur**, je veux n'afficher que les voitures d'un certain type de carburant.

- [ ] **Nominal** : Clic sur "Essence" → seules les voitures essence affichées (filtrage client)
- [ ] **Reset** : Clic sur "Tous" → toutes les voitures réaffichées
- [ ] **Chip active** : La chip du filtre sélectionné est mise en surbrillance (fond amber)
- [ ] **Compteur mis à jour** : Le compteur de résultats reflète le sous-ensemble filtré
- [ ] **Pas de nouveau fetch** : Le filtre carburant s'applique côté client, aucun appel réseau supplémentaire

---

### UC-FILT-2 : Filtrer par agence
**En tant que visiteur**, je veux n'afficher que les voitures d'une agence précise.

- [ ] **Nominal** : Sélectionner une agence → seules les voitures de cette agence affichées
- [ ] **Reset** : Sélectionner "Toutes les agences" → toutes les voitures réaffichées
- [ ] **Combinaison** : Filtre carburant + filtre agence actifs simultanément (ET logique)
- [ ] **Pas de nouveau fetch** : Filtrage côté client

---

### UC-ERR-1 : Gérer une erreur de connexion API
**En tant que visiteur**, je veux comprendre pourquoi le catalogue ne s'affiche pas.

- [ ] **Backend arrêté** : Lancer index.html avec le backend éteint → bandeau d'erreur rouge "Impossible de charger les véhicules. Vérifiez votre connexion ou réessayez plus tard."
- [ ] **Pas de spinner infini** : Le spinner disparaît après l'erreur
- [ ] **Pas de crash JS** : La console ne lève pas d'exception non gérée

---

### UC-ERR-2 : Gérer une réponse d'erreur du backend
**En tant que visiteur**, je veux que les erreurs serveur soient présentées de façon compréhensible.

- [ ] **Backend répond 500** : Le bandeau d'erreur s'affiche avec un message générique (pas d'exposition du détail technique)
- [ ] **Backend répond 400 (mauvaises dates)** : Le message de validation est affiché (cas normalement impossible depuis l'UI puisque la validation est faite côté client avant l'envoi)

---

## Checklist qualité globale

- [ ] Site responsive testé sur mobile 375px, tablette 768px, desktop 1280px
- [ ] Aucune donnée fictive codée en dur dans `app.js` ou `index.html`
- [ ] Console navigateur sans erreurs en condition normale
- [ ] Accessibilité : navigation clavier fonctionnelle sur le formulaire de recherche
- [ ] `window.SITE_API_URL` configuré correctement en production avant déploiement
