# 📖 Guide d'Utilisation Complet - E-Drive Gestion Locative

**Version:** 1.1  
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
✅ Persistance localStorage + Supabase optionnel  

---

## Démarrage Rapide

### Accès à l'Application
```
https://web-production-b4967.up.railway.app
```

### Connexion (Optionnel)
- Cliquez sur **"Se Connecter"** pour synchroniser avec Supabase
- Laissez vide pour utiliser mode **hors ligne** (localStorage)

### Premier Lancement
1. Les données de démonstration se chargent automatiquement
2. Vous verrez plusieurs véhicules, clients et contrats pré-configurés
3. Vous pouvez commencer à créer des locations immédiatement

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

#### Créer un Contrat Court Terme
1. **Sélectionner Client** dans dropdown
2. **Sélectionner Véhicule** (auto-filtre dispo)
3. **Type:** `court` (< 30 jours généralement)
4. **Durée:** {jours} ou {mois/années}
5. **Tarif:** Montant journalier/mensuel
6. **Devise Tarif:** EUR, TND, USD, etc. (13 devises)
7. **Quotient:** Frais supplémentaires
8. **Devise Quotient:** Séparé du tarif
9. **Moment Paiement:** `debut` ou `fin`
10. **Plan de Paiement:** Description (ex: "paiement client debut")

#### Créer un Contrat Long Terme
- Similaire, mais:
  - **Durée:** Généralement mois/années
  - **Plan:** "mensualite", "trimestrielle", etc.
  - Factures générées automatiquement par mois

#### États du Contrat
- 🟢 **actif:** En cours
- 🔴 **termine:** Fini, compte clôturé
- 🟡 **suspendu:** Temporairement en pause

#### Symboles Contrats
- **Tarif multi-devises:** Converti automatiquement en TND
- **Total:** Montant facturé calculé (durée × tarif + quotient)

---

## Factures & Paiements

### Onglet: Factures

#### Factures Créées Automatiquement
- Location court terme = 1 facture
- Location long terme = 1 facture/mois
- Statut: `non_payee` → `partiellement_payee` → `payee`

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

### Onglet: Paramètres

#### Devises & Conversion
- **Devise de Base:** TND (Dinar Tunisien)
- **Taux EUR → TND:** Défini localement (ex: 3.4)
- **Devises Acceptées:** 13 options (EUR, USD, GBP, JPY, CAD, CHF, AED, SAR, KWD, BHD, CNY, OMR)

#### Trésorerie Initiale
- **Solde Ouverture:** Solde initial en TND
- Utilisé pour calcul prévisionnel

#### Sauvegarde
- **Local:** Données dans localStorage (navigateur)
- **Supabase (optionnel):** Connecter pour sync cloud

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

### Q: Comment migrer de local vers Supabase?
**A:** Allez dans Paramètres → Connexion Supabase → Entrez identifiants → Cliquer "Charger du cloud"

### Q: Peux-tu payer une facture partiellement?
**A:** Oui! Entrez montant < restant dû. Facture passe en "partiellement payée".

### Q: Comment exporter les données?
**A:** Download depuis localStorage (Dev Tools > Application > localStorage > locacar-mini-v3) ou export Supabase.

### Q: Les signatures et photos sont-elles cryptées?
**A:** Non, elles sont en base64. Pour production, activez HTTPS + chiffrement Supabase RLS.

### Q: Quelle est la limite de stockage?
**A:** localStorage ~5-10MB. Après, basculez sur Supabase pour illimité.

### Q: Comment réinitialiser les données?
**A:** Dev Tools > Application > localStorage > Supprimer "locacar-mini-v3" > Refresh.

---

## 📞 Support & Troubleshooting

### Problème: L'app ne charge pas
1. Vérifier l'URL: `https://web-production-b4967.up.railway.app`
2. Vérifier votre connexion internet
3. Essayer un rafraîchissement forcé (`Ctrl+F5`) pour vider le cache du navigateur

### Problème: Données disparues après refresh
1. Vérifier localStorage activé (pas mode incognito)
2. Vérifier "locacar-mini-v3" présent en DevTools

### Problème: Analyse IA ne fonctionne pas
1. Vérifier ANTHROPIC_API_KEY définie
2. Vérifier deux EDL avec photos sélectionnées
3. Vérifier connexion internet

### Problème: PDFs ne génèrent pas
1. Vérifier html2pdf.js chargé (console, pas d'erreur 404)
2. Vérifier photos < 10MB
3. Essayer autre navigateur

---

**Dernière mise à jour:** Juin 2026  
**Prochaines évolutions:** Factures récurrentes, API mobile, Dashboard temps réel
