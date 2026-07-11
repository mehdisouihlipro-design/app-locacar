# Spécifications fonctionnelles — Portail Client LocaCar · site-web

---

## F01 — Catalogue des véhicules (Lot 1 ✅)

**Description** : Au chargement de la page, l'application affiche automatiquement tous les véhicules dont le statut est `disponible` ou `reserve`, sans filtrage par dates.

**Comportement** :
- Appel `GET /api/v1/public/cars` sans paramètres au `DOMContentLoaded`
- Affichage en grille responsive (auto-fill, min 276px par colonne)
- Chaque carte affiche : marque, modèle, carburant, couleur, agence, kilométrage, statut "Disponible"
- Illustration : SVG de voiture coloré selon `cars.color` (mapping couleur FR → hex CSS)
- Badge carburant en haut à gauche de l'illustration
- Badge couleur en haut à gauche (couleur de fond = couleur de la voiture)

**États** :
- Chargement : spinner animé + texte "Chargement des véhicules…"
- Erreur API : bandeau rouge avec message explicite
- Aucun véhicule : illustration + message "Aucun véhicule disponible"

---

## F02 — Recherche par dates (Lot 1 ✅)

**Description** : L'utilisateur sélectionne une date de départ et une date de retour pour vérifier la disponibilité réelle sur cette période.

**Composants UI** :
- Deux champs `<input type="date">` dans la barre de recherche hero
- Bouton "Rechercher" avec icône 🔍

**Règles de validation** :
- La date de départ ne peut pas être dans le passé (`min = today`)
- La date de retour doit être > date de départ
- Les deux champs sont obligatoires (toast d'avertissement si manquants)

**Comportement** :
- Au clic "Rechercher" : appel `GET /api/v1/public/cars?from=DATE&to=DATE`
- Le catalogue est rechargé avec uniquement les véhicules disponibles sur la période
- Le compteur de résultats affiche : "X véhicules disponibles · du JJ/MM/AAAA au JJ/MM/AAAA"

---

## F03 — Filtrage par carburant (Lot 1 ✅)

**Description** : Chips de filtre générées dynamiquement à partir des types de carburant présents dans les résultats.

**Comportement** :
- Chips affichées : "Tous" (actif par défaut) + une chip par type de carburant unique dans les résultats
- Icônes : ⛽ Essence/Diesel, ⚡ Électrique, 🔋 Hybride, 💧 GPL
- Le filtre s'applique côté client (sans nouveau fetch)
- Une seule chip active à la fois

---

## F04 — Filtrage par agence (Lot 1 ✅)

**Description** : Sélecteur dropdown généré dynamiquement à partir des agences (`location`) présentes dans les résultats.

**Comportement** :
- "Toutes les agences" par défaut
- Options : liste triée des valeurs uniques de `cars.location` dans les résultats
- Combinable avec le filtre carburant (ET logique)

---

## F05 — Fiche voiture (Lot 1 ✅)

**Description** : Chaque carte voiture affiche toutes les informations publiques disponibles.

**Champs affichés** :
| Champ         | Affiché si  | Format                          |
|---------------|-------------|---------------------------------|
| Marque        | non vide    | Texte majuscule, petit, discret |
| Modèle        | toujours    | Texte principal (large)         |
| Carburant     | non vide    | Badge + icône                   |
| Couleur       | non vide    | Badge coloré                    |
| Agence        | non vide    | 📍 + texte                      |
| Kilométrage   | non null    | 🔄 + nombre localisé FR         |
| Statut        | toujours    | Point vert animé + "Disponible" |

---

## F06 — Bouton réservation désactivé (Lot 1 ✅)

**Description** : Chaque carte affiche un bouton "🔒 Réservation en ligne — Bientôt" désactivé (`disabled`).

**Objectif** : Préparer visuellement le terrain pour Lot 2 sans tromper l'utilisateur.

**Attributs** :
- `disabled` (non cliquable)
- `title` explicatif : "Réservation en ligne disponible prochainement — Lot 2"
- Style différent des boutons actifs (fond gris, bordure pointillée, texte grisé)

---

## F07 — Section contact (Lot 1 ✅)

**Description** : Section en bas de page présentant les coordonnées de l'agence.

**Contenu** :
- Téléphone, Email, Adresse, Horaires
- Encart "Réservation en ligne — Bientôt" avec message explicatif
- CTA "Nous contacter" dans le header → ancre vers cette section

---

## F08 — [Lot 2] Formulaire de réservation

**Description** : Formulaire permettant au client de réserver un véhicule en laissant ses coordonnées.

**Champs prévus** :
- Nom et prénom (obligatoire)
- Téléphone (obligatoire)
- Email (optionnel)
- Dates (pré-remplies depuis la recherche)
- Véhicule sélectionné (pré-rempli depuis la carte)
- Message libre (optionnel)

**Backend prévu** : `POST /api/v1/public/reservations` → insertion dans `reservation_requests`

---

## F09 — [Lot 2] Affichage tarifaire

**Description** : Affichage du tarif journalier sur chaque carte véhicule.

**Prérequis** : Migration SQL ajoutant `price_day DECIMAL(10,2)` sur la table `cars`.

---

## F10 — [Lot 2] Photos réelles des véhicules

**Description** : Remplacement du SVG généré par la photo réelle du véhicule stockée dans Supabase Storage.

**Prérequis** : Migration SQL ajoutant `photo_url TEXT` sur la table `cars`.
**Fallback** : SVG coloré si `photo_url` est null.
