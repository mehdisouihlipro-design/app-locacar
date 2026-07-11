# BMAD — Portail Client LocaCar · site-web

## 1. Business Context

### 1.1 Contexte métier
LocaCar est une société de location de voitures opérant en Tunisie, potentiellement multi-agences. Elle dispose d'une application de gestion interne (App_locaCar) utilisée par les agents. Ce portail est la vitrine publique destinée aux clients finaux.

### 1.2 Problème résolu
Actuellement, les clients ne peuvent pas consulter la disponibilité du parc véhicules sans appeler l'agence. Ce site leur permet de vérifier en autonomie quelles voitures sont libres pour leurs dates, 24h/24.

### 1.3 Périmètre fonctionnel

| Lot | Description                                         | Statut     |
|-----|-----------------------------------------------------|------------|
| 1   | Consultation de la flotte disponible par dates      | ✅ Livré    |
| 1   | Filtrage par carburant et agence                    | ✅ Livré    |
| 2   | Réservation en ligne (coordonnées client)           | 🔜 Planifié |
| 2   | Affichage tarifaire dynamique                       | 🔜 Planifié |
| 2   | Photos réelles des véhicules                        | 🔜 Planifié |

---

## 2. Modules

### M1 — Catalogue (CAT)
Affichage de la flotte de véhicules disponibles avec leurs caractéristiques publiques.

### M2 — Recherche (SRCH)
Sélection d'une période (date départ / date retour) pour filtrer les véhicules disponibles sur cette période.

### M3 — Filtres (FILT)
Affinage des résultats par type de carburant et par agence.

### M4 — Contact
Section informative présentant les coordonnées de l'agence et le message "Réservation bientôt disponible".

---

## 3. Actors

| Acteur                | Rôle                                                                 |
|-----------------------|----------------------------------------------------------------------|
| **Client (visiteur)** | Consulte le catalogue, choisit des dates, filtre les véhicules       |
| **Admin (backend)**   | Maintient les données via l'app principale (App_locaCar)             |
| **Backend LocaCar**   | Fournit les données de disponibilité via l'API publique              |

---

## 4. Business Rules

### BR-SW-01 — Source de données exclusive
Toutes les données affichées (véhicules, disponibilité) proviennent exclusivement de l'endpoint `GET /api/v1/public/cars` du backend LocaCar. Aucune donnée fictive ne peut être codée en dur.

### BR-SW-02 — Disponibilité réelle
Un véhicule est considéré "disponible" pour une période [D1, D2] si et seulement si :
- son statut dans la table `cars` est `disponible` ou `reserve`, ET
- aucune ligne de contrat (`contract_lines`) active ne chevauche cette période, ET
- aucune réservation (`reservations`) non annulée/terminée ne chevauche cette période.

### BR-SW-03 — Données publiques uniquement
L'endpoint public n'expose que les champs : `id`, `brand`, `model`, `fuel_type`, `color`, `location`, `status`, `odometer_km`. Aucune donnée financière, client ou contractuelle n'est exposée.

### BR-SW-04 — Pas de réservation en Lot 1
En Lot 1, le bouton "Réserver" est visible mais désactivé. Aucune donnée de réservation n'est collectée côté client. Le client est invité à contacter l'agence.

### BR-SW-05 — Date minimale
La date de départ ne peut pas être dans le passé. La date de retour doit être strictement postérieure à la date de départ.

### BR-SW-06 — Affichage sans dates
Sans sélection de dates, le site affiche tous les véhicules dont le statut est `disponible` ou `reserve` (sans vérification de conflits de période).

### BR-SW-07 — [Lot 2] Réservation liée à l'app principale
En Lot 2, une réservation créée depuis ce portail sera insérée dans la table `reservations` de la même base Supabase que l'app principale, avec `status = 'en_attente'`. L'agent confirmera depuis l'app.

---

## 5. Data (vue publique)

Voir `docs/03-data-model/SCHEMA_REFERENCE.md` pour le schéma complet de la réponse API.

### Champs exposés (Lot 1)

| Champ          | Type    | Description                              |
|----------------|---------|------------------------------------------|
| `id`           | string  | Identifiant unique du véhicule           |
| `brand`        | string  | Marque (ex. Renault, Peugeot)            |
| `model`        | string  | Modèle (ex. Clio, 308)                   |
| `fuel_type`    | string  | Carburant (essence, diesel, électrique…) |
| `color`        | string  | Couleur (texte libre)                    |
| `location`     | string  | Agence / localisation                    |
| `status`       | string  | `disponible` ou `reserve`                |
| `odometer_km`  | integer | Kilométrage                              |

### Champs prévus Lot 2

| Champ          | Type   | Description                                          |
|----------------|--------|------------------------------------------------------|
| `photo_url`    | string | URL Supabase Storage (photo principale du véhicule)  |
| `price_day`    | number | Tarif journalier public (en TND)                     |
