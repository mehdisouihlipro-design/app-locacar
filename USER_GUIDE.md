# 📖 Guide d'Utilisation Complet - E-Drive Gestion Locative

**Version:** 1.3  
**Date:** Juin 2026  
**Application:** LocaCar - Gestion Multi-Agences de Location de Véhicules

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Démarrage rapide](#démarrage-rapide)
3. [Accueil & Tableau de bord](#accueil--tableau-de-bord)
4. [Gestion des Véhicules](#gestion-des-véhicules)
5. [Gestion des Clients](#gestion-des-clients)
6. [Contrats de Location](#contrats-de-location)
7. [Factures & Paiements](#factures--paiements)
8. [Réservations](#réservations)
9. [États des Lieux](#états-des-lieux)
10. [Assurance & Leasing](#assurance--leasing)
11. [Vignettes & GPS](#vignettes--gps)
12. [Trésorerie & Prévisions](#trésorerie--prévisions)
13. [Rentabilité par Véhicule](#rentabilité-par-véhicule)
14. [Alertes & Notifications](#alertes--notifications)
15. [Paramètres](#paramètres)
16. [Édition des Fiches & Navigation](#édition-des-fiches--navigation)

---

## Vue d'Ensemble

**E-Drive** est une application de gestion complète de location de véhicules multi-agences. Elle offre:

✅ Gestion de flotte (véhicules, statuts)  
✅ Gestion client CRM  
✅ Contrats court & long terme  
✅ Facturation et paiements  
✅ Réservations avec calendrier  
✅ **États des lieux numériques avec signatures et photos**  
✅ **Analyse IA des dégâts**  
✅ Gestion des assurances et leasings  
✅ Suivi des vignettes  
✅ Tracking GPS  
✅ **Prévisions de trésorerie 365 jours**  
✅ Système d'alertes avancé  
✅ Authentification multi-utilisateur (rôles agent/admin/manager)  
✅ Persistance cloud via Supabase (toutes les données passent par l'API backend)  

---

## Démarrage Rapide

### Accès à l'Application
```
https://web-production-b4967.up.railway.app
```

### Connexion (obligatoire)
- Saisissez votre **email** et votre **mot de passe**, puis cliquez **"Se connecter"**
- Toutes les données sont stockées sur Supabase (cloud) via l'API backend — il n'existe pas de mode "hors ligne"
- Une fois connecté, le bouton **"Se déconnecter"** apparaît et votre email/rôle s'affichent en haut de l'écran

### Premier Lancement
1. Au login, l'application charge automatiquement toutes les données existantes (véhicules, clients, contrats, factures...) depuis l'API
2. Si la base est vide, le bouton **"Charger données demo"** (page d'accueil) précharge un jeu de données de démonstration
3. Vous pouvez ensuite commencer à créer des locations immédiatement

---

## Accueil & Tableau de Bord

### Indicateurs Clés (KPIs)

| KPI | Description | Action |
|-----|-------------|--------|
| **Véhicules Disponibles** | Nombre de voitures libres | Cliquer → Filtre par "Dispo" |
| **Réservations Actives** | Réservations en attente/confirmées | Cliquer → Filtre par "Active" |
| **Alertes Critiques** | En retard + urgentes | Cliquer → Filtre par "Critique" |
| **Trésorerie Actuelle** | Solde de trésorerie NOW | Cliquer → Scroll vers table |
| **Prévision 365j** | Solde projeté end of year | Cliquer → Scroll vers table |
| **Solde Minimum** | Plus bas point prévu | Cliquer → Scroll vers table |

### Graphiques Interactifs
- **Revenus par mois:** Graphique barres colorées, totaux facturés
- **État Flotte:** Breakdown dispo/loué/maintenance
- **Alertes par mois:** Tendance des écheances critiques
- **Trésorerie 12 mois:** Projection solde mensuel

💡 **Cliquer sur un graphique** = vue détaillée du mois

### Message Trésorerie
- 🟢 **Vert:** "Projection stable à 1 an" + solde minimum
- 🔴 **Rouge:** "ALERTE: tresorerie prévisionnelle négative à partir de {date}"

---

## Gestion des Véhicules

### Onglet: Voitures

#### Ajouter un Véhicule
1. Remplir le formulaire:
   - **Immatriculation:** ex. `TU-1234` (unique)
   - **Modèle:** ex. `Dacia Sandero`
   - **Catégorie:** Économique, Familial, Premium
   - **Cylindrée (cm³):** Moteur
   - **Carburant:** Essence, Diesel, Hybride, Électrique
   - **Statut:** `dispo`, `loué`, `maintenance`
   - **Couleur:** Pour identification visuelle
   - **Kilométrage:** Actuel

2. Cliquer **"Ajouter Vehicule"**
3. Voiture apparaît dans le tableau

#### Filtrer Véhicules
- **Filtre Statut:** Voir seulement dispo/loué/maintenance
- **Filtre Recherche:** Chercher par plaque ou modèle
- **Bouton Réinit:** Reset filtres

#### Actions sur Véhicules
- **Details:** Double-clic pour éditer tous les champs
- **Supprimer:** Retire définitivement (avec confirmation)
- **État:** Badge coloré (🟢 vert dispo, 🔴 rouge loué, 🟡 jaune maintenance)

---

## Gestion des Clients

### Onglet: Clients

#### Ajouter un Client
1. Formulaire simple:
   - **Nom:** Personne ou Entreprise
   - **Type:** `particulier` ou `entreprise`
   - **Téléphone:** Contact principal
   - **Email:** Pour confirmations

2. Cliquer **"Ajouter Client"**

#### Rechercher & Filtrer
- Tableau affiche nom, téléphone, email, type
- Double-clic pour éditer infos
- Supprimer avec bouton action

---

## Contrats de Location

### Onglet: Contrats

Un contrat est composé d'un **entête** (client, type, paiement) et de **lignes** (chaque ligne représente un véhicule sur une période donnée).

#### Créer un Contrat (nouveau flux)
1. Cliquer **"Nouveau"** pour afficher le formulaire simplifié
2. Renseigner :
   - **Client** (obligatoire)
   - **Type de contrat** : `court`, `long` ou `autre`
   - **Date de début**
   - **Paiement** : `début de location` ou `fin de location`
3. Cliquer **"Créer contrat"** → le modal de détail s'ouvre automatiquement
4. Dans le modal, cliquer **"+ Ajouter une ligne"** pour associer un ou plusieurs véhicules au contrat (voir ci-dessous)

#### Ajouter une ligne de contrat (véhicule + période)
Dans le modal de détail d'un contrat :
1. Cliquer **"+ Ajouter une ligne"**
2. Renseigner :
   - **Véhicule** : tous les véhicules sont listés ; ceux dont la disponibilité entre en conflit avec les dates saisies sont marqués **⚠ conflit** en rouge
   - **Date début / Date fin**
   - **Tarif HT** (par jour ou mois) → le montant HT se calcule automatiquement selon la durée
   - **Montant HT** et **Montant TTC** sont liés : modifier l'un recalcule l'autre (TVA appliquée selon les Paramètres)
3. Cliquer **"Enregistrer la ligne"**
   - Si la période chevauche une ligne active existante pour ce véhicule, un message d'erreur rouge s'affiche (BR19) — ajuster les dates ou choisir un autre véhicule

#### Accéder au détail d'un contrat
- **Double-clic** sur une ligne du tableau → ouvre le modal de détail
- **Clic sur le badge "N ligne(s)"** → même action
- Dans le modal : bouton **"Modifier entête"** pour éditer les informations du contrat

#### États du Contrat
- 🟢 **active:** En cours
- 🔴 **termine:** Fini, compte clôturé
- ⚫ **annule:** Annulé

#### Colonne "Lignes"
Le badge affiché dans la colonne "Lignes" indique le nombre de lignes actives (hors lignes annulées) associées à ce contrat.

---

## Factures & Paiements

### Onglet: Factures

#### Factures Créées Automatiquement
- Location court terme = 1 facture
- Location long terme = 1 facture/mois
- Statut: `non_payee` → `partiellement_payee` → `payee`

#### Créer une Facture Manuelle
1. Cliquer **"Nouvelle facture"** pour afficher le formulaire
2. Renseigner :
   - **Client**
   - **Libellé** (ex: "Facture additionnelle")
   - **Devise**
   - **Date d'échéance**
   - **RIB** : choisir le compte bancaire affiché sur la facture — **RIB n°1** ou **RIB n°2** (le RIB n°2 n'apparaît que s'il est configuré dans Paramètres → Coordonnées légales, voir section [Paramètres](#paramètres)). Le RIB choisi est **figé** sur la facture, même si les coordonnées bancaires sont modifiées plus tard dans les paramètres.
3. **Lignes de facturation** (1 ligne = 1 contrat/véhicule) :
   - Pour chaque ligne : contrat (véhicule associé), date de début de période, nombre de jours, montant HT
   - Cliquer **"+ Ajouter une ligne"** pour facturer plusieurs contrats/véhicules sur la même facture
   - La taxe journalière (paramétrable en Paramètres, ex: 2 dt/jour) est calculée **par ligne** ; le timbre fiscal n'est compté **qu'une seule fois** pour toute la facture
4. Cliquer **"Créer facture"**

#### Modifier / Imprimer une Facture
- Double-clic sur une facture pour ouvrir sa fiche détaillée (voir [Édition des Fiches & Navigation](#édition-des-fiches--navigation)), ou utiliser la modale dédiée d'édition/impression :
  - Ajuster le montant HT ou TTC (calcul automatique de la TVA, de la taxe journalière et du timbre fiscal dans l'autre sens)
  - Bouton **"Télécharger PDF"** : ouvre un aperçu imprimable de la facture (impression/export PDF via le navigateur), avec le RIB sélectionné à la création
  - Bouton **"Enregistrer"** : sauvegarde les modifications

#### Colonnes
| Col | Signification |
|-----|---------------|
| ID | Identifiant facture |
| Contrat | Ref. du contrat |
| Client | Nom du client |
| Montant Original | En devise origine |
| Devise | EUR, TND, USD... |
| Total TND | Converti |
| Payé | Montant encaissé |
| À Payer | Restant dû |

### Onglet: Paiements

#### Enregistrer un Paiement
1. **Sélectionner Facture** à payer
2. **Montant TND:** ⚠️ Obligatoirement en TND
3. **Méthode:** `especes`, `cheque`, `carte`, `virement`
4. **Date:** Jour du paiement
5. Cliquer **"Enregistrer paiement client"**

#### Validation
- ❌ Impossible payer > montant restant dû
- ✅ Montant partiel accepté

#### Suivi
- Facture se met à jour automatiquement
- État passe à "partiellement payée" puis "payée"
- Trésorerie recalculée

---

## Réservations

### Onglet: Réservations

#### Créer une Réservation
1. **Client:** Dropdown des clients
2. **Véhicule:** Dropdown des autos (auto-filtrées dispo)
3. **Date Début:** Jour de prise en charge
4. **Date Fin:** Jour de restitution
5. **Statut:** `en_attente`, `confirmee`, `annulee`, `terminee`
6. Cliquer **"Ajouter Reservation"**

#### Vérifications
- ❌ Impossible si dates invalides (fin < début)
- ❌ Impossible si véhicule déjà réservé (overlap detection)
- ✅ Chevauchement avec passé autorisé

#### Calendrier Mensuel
- Navigation mois/année
- Affiche réservations existantes comme chips coloriées
- Cliquer date → liste des réservations ce jour

#### Filtres Réservations
- **Statut:** tous, en_attente, confirmee, annulee, terminee, active (=attente+confirmee)
- Bouton "Réinit" pour reset

---

## États des Lieux

### Onglet: États des Lieux (NEW!)

#### Créer un Etat des Lieux

**1. Type:**
- `sortie` = Etat à la prise en charge
- `entree` = Etat à la restitution

**2. Informations Véhicule:**
- **Contrat:** Optionnel, auto-remplit le véhicule
- **Véhicule:** Obligatoire
- **Date/Heure:** Moment de l'état des lieux
- **Kilométrage:** Compteur du véhicule

**3. État du Carburant:**
- vide, 1/4, 1/2, 3/4, plein

**4. Propreté:**
- **Intérieur:** propre, moyen, sale
- **Extérieur:** propre, moyen, sale
- **État Général:** excellent, bon, moyen, à_reparer

**5. Points de Vérification (détaillés):**
Pour chaque point (carrosserie, pneus, pare-brise, éclairage, etc.), vous avez maintenant:
- Une **note en étoiles cliquables** (1/5 à 5/5, modifiable)
- Une **observation dédiée**
- Une **photo dédiée** (1 fichier par point)

Cette saisie remplace l'ancienne checklist simple et améliore le niveau de preuve par élément contrôlé.

Points critiques avec **photo obligatoire**:
- Carrosserie
- Pneus
- Pare-brise
- Éclairage

Si une photo manque sur un de ces points, l'enregistrement est bloqué.

**6. Observation Générale:**
- Texte libre global (optionnel)
- Sert de synthèse de l'état des lieux
- Visible dans le tableau et le PDF

**7. Signatures:**
- **Canvas 1:** Signature Agent (vous)
- **Canvas 2:** Signature Client
- Cliquer sur canvas pour signer
- Bouton "Effacer" pour recommencer
- Sauvegardé en base64

**8. Enregistrer:**
- Cliquer **"Enregistrer etat des lieux"**
- Apparaît dans tableau en bas

#### Tableau États des Lieux

| Col | Contenu |
|-----|---------|
| ID | Identifiant EDL |
| Type | 🟢 sortie ou 🟡 entree |
| Date/Heure | Moment EDL |
| Véhicule | Plaque |
| Contrat | Ref. contrat |
| Km | Kilométrage |
| Carburant | vide, 1/4... plein |
| Etat | excellent, bon... + score global pondéré /5 |
| Checklist | Résumé auto: moyenne /5 + points sensibles |
| Photos | Liens générés depuis les photos de points |
| Observation | Texte tronqué 80 chars |
| Action | PDF, Supprimer |

#### Générer PDF
1. Cliquer bouton **"PDF"** sur la ligne EDL
2. PDF télécharge: `EDL-{plaque}-{date}.pdf`
3. Contenu PDF:
   - Header E-Drive
   - Infos véhicule complètes
   - Checklist détaillée avec notes étoiles par point
   - Score global pondéré automatique (/5)
   - Observations par point (si renseignées)
   - Observations
   - Signatures agent & client (images)
   - Galerie photos (4 max)

#### Analyse IA des Dégâts

**Prérequis:**
- Deux inspections: une `sortie`, une `entree`
- Chacune avec AU MOINS 1 photo
- ANTHROPIC_API_KEY configurée sur serveur

**Processus:**
1. **Sélectionner Inspection Sortie** dans dropdown (exit photos)
2. **Sélectionner Inspection Entrée** dans dropdown (entry photos)
3. Cliquer **"Analyser les degats"**
4. Attendre analyse (15-30 sec)
5. Résultats affichés:

**Résultats Format:**
```
✓ Dégâts détectés (ou ✓ Aucun dégât)
├─ Impacts détectés:
│  └─ Location: Aile avant gauche (severe)
│     Type: scratch | Recommandation: Repaint
├─ État Général: good | fair | poor
└─ Recommandations:
   - Inspecter usure pneu avant
   - Vérifier pare-brise
```

**Couleurs Sévérité:**
- 🟢 minor = vert
- 🟡 moderate = orange/jaune
- 🔴 severe = rouge

---

## Assurance & Leasing

### Onglet: Assurances

#### Ajouter une Assurance
1. **Véhicule:** Sélectionner auto
2. **Fournisseur:** ex. "CNAU", "AXA Assurance"
3. **N° Police:** Unique par assurance
4. **Montant Mensuel:** Cotisation
5. **Devise:** EUR, TND, etc.
6. **Dates:** Début et fin couverture
7. **Pièce Jointe:** PDF police (optionnel)
8. Cliquer **"Ajouter Assurance"**

#### Automatisation
- Crée automatiquement les **échéances mensuelles** jusqu'à date fin
- Chaque échéance = alerte possible (si en retard)
- Statut: `a_payer`, `paye`

### Onglet: Leasings

#### Similaire aux Assurances
- Loyer de leasing (location financière)
- Montant mensuel/trimestriel/annuel
- Crée échéances automatiquement
- Suivi paie via alertes

---

## Vignettes & GPS

### Onglet: Vignettes

#### Ajouter Vignette
- Véhicule, fournisseur, montant
- Date validité
- Alerte si expiration proche

### Onglet: GPS

#### Ajouter Suivi GPS
1. **Véhicule:** Sélectionner
2. **Fournisseur:** ex. "Tracki", "Sygic"
3. **Ref Boîtier:** ID du tracker
4. **Date Activation:** Quand installé
5. Cliquer **"Ajouter GPS"**

#### Affichage Carte
- Intégration cartographique (si disponible)
- Suivi position temps réel (avec API externe)

---

## Trésorerie & Prévisions

### Onglet: Trésorerie

#### Vue d'Ensemble (Dashboard)
Voir section **Accueil** pour KPIs trésorerie

#### Table Prévisions 365 Jours

**Colonnes:**
| Col | Signification |
|-----|---------------|
| Date | Jour de la prévision |
| Encaissements | Paiements clients prévus |
| Décaissements | Dépenses (assurance, leasing, vignette) |
| Variation Nette | Encaissement - Décaissement |
| Solde Projeté | Solde cumulé |
| Etat | 🟢 OK ou 🔴 NÉGATIF |

**Hauteur:** Table scrollable, max 420px

#### Calcul Trésorerie
1. **Solde Ouverture:** Défini en paramètres
2. **Paiements Réalisés:** Jusqu'à aujourd'hui
3. **Aujourd'hui:** Solde "NOW"
4. **365 Jours:** Projection avec:
   - Contrats futurs (factures)
   - Assurances impayées
   - Leasings impayés
   - Vignettes impayées
5. **Solde Minimum:** Jour le plus critique

#### Interprétation
- 🟢 Vert = Solde positif
- 🔴 Rouge = Risque négatif (alerte!)
- Cliquer ligne = détail du jour

---

## Rentabilité par Véhicule

### Onglet: Rentabilité (NEW!)

#### Vue d'Ensemble (Tableau global)
Liste paginée de tous les véhicules de la flotte avec, pour chacun :

**Colonnes:**
| Col | Signification |
|-----|---------------|
| Immatriculation | Plaque du véhicule |
| Modèle | Marque / modèle |
| CA généré | Total des paiements clients liés à ce véhicule |
| Dépenses | Total maintenance + leasing + assurance + vignette |
| Solde | CA généré − Dépenses (🟢 positif / 🔴 négatif) |
| Action | Bouton **"Détails"** → ouvre le bilan détaillé du véhicule |

#### Modale "Bilan financier" (détail par véhicule)
En cliquant sur **"Détails"**, une fenêtre s'ouvre avec :
1. **Sélecteur d'année** : permet de changer l'année analysée (le graphique et le tableau se mettent à jour automatiquement)
2. **Graphique mensuel** : compare CA généré, dépenses et solde mois par mois sur l'année sélectionnée
3. **Tableau mensuel détaillé** — colonnes : Mois | CA généré | Maintenance | Leasing | Assurance | Vignette | Total dépenses | Solde
4. **Récapitulatif annuel** : totaux de l'année (CA, dépenses par catégorie, solde net)

#### D'où viennent les chiffres ?
- **CA généré** : somme des paiements clients (`Paiements`) rattachés aux contrats du véhicule
- **Maintenance** : somme des coûts de maintenance enregistrés pour le véhicule
- **Leasing / Assurance** : montant mensuel du contrat réparti sur les mois où il est actif
- **Vignette** : montant de la vignette à sa date d'échéance

#### Interprétation
- Solde positif (🟢) = le véhicule rapporte plus qu'il ne coûte sur la période
- Solde négatif (🔴) = le véhicule coûte plus cher qu'il ne rapporte → à surveiller (révision du tarif de location, arbitrage flotte, etc.)

---

## Alertes & Notifications

### Onglet: Alertes

#### Types d'Alertes

| Type | Trigger | Exemple |
|------|---------|---------|
| **Assurance** | Cotisation impayée | "Assurance XYZ en retard 5j" |
| **Leasing** | Loyer impayé | "Leasing auto TU-123 urgente" |
| **Vignette** | Vignette expirée | "Vignette expire demain" |
| **Trésorerie** | Solde négatif prévu | "Projection 1an: négatif 15 mai" |

#### Niveaux Alerte

| Niveau | Condition | Couleur |
|--------|-----------|---------|
| 🔴 **en_retard** | Échéance dépassée (jours < 0) | Rouge |
| 🟠 **urgent** | Échéance < 7 jours | Orange |
| 🟡 **proche** | Échéance < 30 jours | Jaune |
| 🟢 **ok** | Échéance > 30 jours | Vert (non affiché) |

#### Filtrer Alertes
- **Filtre Niveau:**
  - `tous` = Toutes alertes
  - `critical` = en_retard + urgent
  - `en_retard` = Retard seul
  - `urgent` = Urgent seul
  - `proche` = Proche seul

#### Actions
- Cliquer KPI "Alertes Critiques" dashboard → Filtre auto `critical`
- Double-clic alerte → Ouvre record associé

#### Suivi Alerts
- **Statut:** `a_payer`, `paye`
- **DaysLeft:** Recalculé quotidiennement
- **Ref:** Lien vers contrat/assurance/vignette

---

## Paramètres

### Accès : bouton "⚙️ Paramètres de l'agence"
Les paramètres ne sont pas un onglet séparé : ils s'ouvrent dans une **fenêtre dédiée** depuis le bouton **"⚙️ Paramètres de l'agence"** (page Accueil). La fermeture de cette fenêtre (bouton "Fermer" ou croix **×** en haut à droite) enregistre automatiquement les modifications.

#### Personnalisation (White-label)
- **Nom de l'entreprise** : affiché dans l'en-tête de l'application et sur les factures
- **URL du logo** : remplace le logo par défaut

#### Coordonnées légales (en-tête des factures)
- **Adresse**, **Téléphone (Gsm)**, **Matricule fiscal / Code TVA**
- **RIB n°1** : libellé + numéro de compte (compte bancaire principal, utilisé par défaut sur les factures)
- **RIB n°2** (optionnel) : libellé + numéro de compte — un second compte bancaire, sélectionnable au cas par cas à la création de chaque facture (voir [Factures & Paiements](#factures--paiements))

#### Paramètres de facturation
- **TVA (%)**, **Taxe par jour de location (TND)**, **Timbre fiscal (TND)** — utilisés pour les conversions HT ↔ TTC des factures

#### Paramètres financiers
- **Devise principale** : TND (Dinar Tunisien, fixe)
- **Taux EUR → TND** : utilisé pour convertir tous les montants en EUR
- **Solde initial trésorerie (TND)** : point de départ des prévisions à 365 jours
- **Buffer réservations (heures)** : marge minimale appliquée entre deux réservations du même véhicule

#### Devises Acceptées
13 devises disponibles sur les contrats/factures : EUR, USD, GBP, JPY, CAD, CHF, AED, SAR, KWD, BHD, CNY, OMR, TND

---

## Édition des Fiches & Navigation

### Modale d'édition générique (double-clic)
Un double-clic sur une ligne de tableau (Contrats, Factures, Voitures, Clients, Réservations, Paiements, Maintenance, Assurances, Leasing, Vignettes, États des lieux...) ouvre une fenêtre d'édition détaillée :
- Tous les champs de l'enregistrement sont affichés et modifiables
- Les champs calculés (totaux, montants convertis en TND, lignes de facture...) sont affichés en lecture seule (grisés)
- Les champs à choix contraint (ex: statut, RIB de la facture) sont présentés sous forme de **liste déroulante**, avec les mêmes options qu'à la création
- **Traçabilité** : "Créé par"/"Créé le" et "Modifié par"/"Modifié le" sont affichés en lecture seule, avec le nom de l'utilisateur ayant créé/modifié la fiche
- Cliquer **"Enregistrer"** pour sauvegarder (persisté en base), ou **"Annuler"** / la croix **×** en haut à droite pour fermer sans enregistrer

### Croix de fermeture (×)
Chaque fenêtre détail de l'application (édition générique, paramètres, détail utilisateur, édition facture, changement de mot de passe, détail état des lieux, bilan financier véhicule) affiche une croix **×** en haut à droite pour la fermer rapidement, en complément du bouton "Fermer"/"Annuler" en bas.

### Navigation croisée entre fiches (liens cliquables)
Dans les tableaux, certains champs (client, véhicule, contrat, facture...) apparaissent comme des **liens cliquables** (soulignés au survol) : cliquer dessus bascule vers l'onglet correspondant avec une recherche/filtre déjà appliqué sur l'élément concerné — par exemple, cliquer sur le nom d'un client depuis un contrat ouvre l'onglet Clients filtré sur ce client.

### Indicateurs et graphiques cliquables
Comme indiqué en page d'accueil, les KPI, listes et graphiques (tableau de bord, rentabilité, trésorerie...) sont cliquables et renvoient vers l'écran de détail correspondant, avec le même filtre déjà appliqué.

### Tri et filtre par colonne (NEW!)
Tous les tableaux de l'application (Voitures, Clients, Contrats, Factures, Recouvrement, Paiements, Maintenance, Réservations, États des lieux, Alertes, Assurances, Leasing, Vignettes, GPS, Utilisateurs, Rentabilité, Prévision de trésorerie...) disposent désormais :
- **Tri par en-tête** : cliquer sur le titre d'une colonne trie le tableau par cette colonne (ordre croissant) ; cliquer une seconde fois inverse l'ordre (décroissant). Un indicateur **▲**/**▼** s'affiche sur la colonne triée.
- **Ligne de filtres** : juste sous les en-têtes, chaque colonne dispose d'un champ de saisie (filtre texte partiel, insensible à la casse) ou d'une liste déroulante (pour les colonnes à valeurs fixes comme le statut). Plusieurs filtres peuvent être combinés simultanément.
- Le tri et les filtres par colonne sont conservés tant que la page reste ouverte, mais ne sont pas sauvegardés au rechargement.

### Modification exceptionnelle du numéro de contrat/facture
Le numéro (identifiant) d'un contrat ou d'une facture peut être modifié depuis la modale d'édition générique. La modification est automatiquement répercutée sur tous les enregistrements liés (factures, paiements, états des lieux...).

---

## 🎨 Infos Pratiques

### Codes Couleur

| Couleur | Signification |
|---------|---------------|
| 🟢 Vert | OK, Disponible, Positif |
| 🔴 Rouge | Critique, En retard, Problème |
| 🟡 Jaune | Alerte, Attention, Maintenance |
| 🔵 Bleu | Info, Neutre |
| ⚪ Gris | Désactivé, Non applicable |

### Formats de Date
- **Entrée:** YYYY-MM-DD (ex: 2026-05-06)
- **Affichage:** Locale français (06/05/2026)
- **ISO:** Stocké en base ISO 8601

### Localisation Nombres
- **Séparateur décimal:** , (virgule)
- **Séparateur millier:** espace
- **Exemple:** 1 234,56 TND

### Raccourcis Clavier
- `Tab` = Navigation champs formulaire
- `Enter` = Valider/Ajouter
- `Echap` = Fermer dialogues

---

## ❓ FAQ

### Q: Peux-tu payer une facture partiellement?
**A:** Oui! Entrez un montant inférieur au restant dû. La facture passe en "partiellement payée".

### Q: Comment savoir qui a créé/modifié une fiche?
**A:** Ouvrez la fiche en double-clic : les champs "Créé par"/"Créé le" et "Modifié par"/"Modifié le" sont affichés en lecture seule en bas de la fenêtre.

### Q: Comment choisir le RIB affiché sur une facture?
**A:** À la création de la facture, sélectionnez "RIB n°1" ou "RIB n°2" dans le champ RIB (RIB n°2 doit avoir été configuré au préalable dans Paramètres → Coordonnées légales). Le choix est figé sur la facture, modifiable ensuite via sa fiche détaillée.

### Q: Les signatures et photos sont-elles cryptées?
**A:** Elles sont stockées en base64 dans Supabase. Pour la production, activez HTTPS et les policies RLS Supabase.

### Q: Comment recharger des données de démonstration?
**A:** Depuis la page d'accueil, cliquer sur **"Charger données demo"**.

---

## 📞 Support & Troubleshooting

### Problème: L'app ne charge pas
1. Vérifier l'URL: `https://web-production-b4967.up.railway.app`
2. Vérifier votre connexion internet
3. Essayer un rafraîchissement forcé (`Ctrl+F5`) pour vider le cache du navigateur

### Problème: Données disparues / non sauvegardées après refresh
1. Vérifier que vous êtes bien connecté (email et rôle visibles en haut de l'écran)
2. Vérifier qu'aucun message d'erreur d'API ne s'affiche après une création/modification
3. Rafraîchir la page (`F5`) — les données sont rechargées depuis Supabase via l'API

### Problème: Analyse IA ne fonctionne pas
1. Vérifier ANTHROPIC_API_KEY définie côté serveur
2. Vérifier deux EDL avec photos sélectionnées
3. Vérifier connexion internet

### Problème: PDFs (factures / états des lieux) ne génèrent pas
1. Vérifier qu'aucune fenêtre popup n'est bloquée par le navigateur (le PDF s'ouvre via une fenêtre d'impression)
2. Vérifier photos < 10MB (états des lieux)
3. Essayer un autre navigateur

---

**Dernière mise à jour:** Juin 2026  
**Prochaines évolutions:** Tri et filtre génériques sur toutes les grilles, Factures récurrentes, Dashboard temps réel
