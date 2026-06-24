# Plan de tests maître — LocaCar (V1 + V2)

> **Portée** : toutes les fonctionnalités implémentées à ce jour (session au 2026-06-24).  
> **Référence V2 détaillée** : voir `docs/06-tests/V2_TEST_PLAN.md` pour les tests exhaustifs BR18-BR27.  
> **Convention** :  
> - `[ ]` = à tester / `[x]` = passé / `[!]` = échoué  
> - Chaque test indique **Précondition → Action → Résultat attendu**  
> - Les tests « Persistance » exigent un **rechargement complet (F5)** après l'action  
> - Environnement : `node serve.js` (port 3000) + `npm run backend:dev` (port 3001) + Supabase connecté

---

## 0. Pré-requis & Mise en place

### 0.1 Démarrage de l'environnement
- [ ] **Backend** : `npm run backend:dev` démarre sans erreur, log `✓ Supabase connected` et `✓ Server running on http://localhost:3001`
- [ ] **Frontend** : `API_URL=http://localhost:3001/api/v1 node serve.js` démarre sur le port 3000
- [ ] **Health check** : `GET http://localhost:3001/api/v1/health` → `{ success: true, database: "connected" }`
- [ ] **Variables d'env** : `.env` contient `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`

### 0.2 Jeu de données démo
- [ ] **Chargement démo** : se connecter en admin, cliquer "Charger données démo" → succès (aucune erreur 500), les grilles Voitures/Clients/Contrats/Factures affichent des données
- [ ] **Rechargement après démo** : F5 → les données démo sont toujours présentes (persistées en base, pas seulement en mémoire)
- [ ] **Remise à zéro** : après "Charger données démo", les données précédentes sont bien remplacées (pas de doublons)

---

## 1. Authentification

### UC-AUTH-1 : Connexion standard
**En tant qu'utilisateur**, je veux me connecter avec mon email + mot de passe pour accéder à l'application.

- [ ] **Connexion valide** : saisir email + mot de passe corrects → token JWT stocké dans `localStorage`, dashboard chargé, nom d'utilisateur affiché dans l'en-tête
- [ ] **Email inexistant** : saisir un email inconnu → message d'erreur explicite en français (pas "401" brut), champ mot de passe non vidé
- [ ] **Mot de passe incorrect** : email correct + mauvais mot de passe → message d'erreur explicite, pas de token stocké
- [ ] **Champs vides** : tenter de soumettre sans email ni mot de passe → validation UI bloque avant l'appel API
- [ ] **Persistance session** : se connecter, fermer/rouvrir l'onglet → l'utilisateur est toujours connecté (token valide en `localStorage`), données rechargées automatiquement

### UC-AUTH-2 : Déconnexion
- [ ] **Bouton déconnexion** : cliquer sur "Déconnexion" → token supprimé de `localStorage`, écran de login affiché
- [ ] **Accès sans token** : tenter d'appeler `GET /api/v1/cars` sans token → `401 Unauthorized`
- [ ] **Token expiré** : avec un token périmé (attendre ou modifier `exp`) → l'API renvoie `401`, l'UI affiche le formulaire de login (pas un écran blanc)

### UC-AUTH-3 : Multi-utilisateur
- [ ] **Deux sessions simultanées** : se connecter avec deux comptes différents dans deux onglets → chaque onglet charge les données de son propre utilisateur, sans interférence
- [ ] **Audit (BR23)** : créer un enregistrement connecté en tant qu'utilisateur A, se reconnecter en tant que B et modifier ce même enregistrement → `created_by = A`, `updated_by = B`

---

## 2. Module Parc Véhicules

### UC-CAR-1 : Ajouter un véhicule
**En tant que gestionnaire**, je veux ajouter un nouveau véhicule au parc.

- [ ] **Formulaire nouveau véhicule** : cliquer "+ Nouveau véhicule" → formulaire apparaît avec champs Immatriculation, Marque, Modèle, Année, Couleur, Statut, Agence, Kilométrage, Carburant
- [ ] **Immatriculation obligatoire** : soumettre sans immatriculation → erreur inline, pas d'appel API
- [ ] **Création réussie** : remplir tous les champs requis → `POST /cars` → voiture apparaît dans la grille, rechargement F5 la confirme en base
- [ ] **Doublon d'immatriculation** : créer un second véhicule avec la même immatriculation → erreur (contrainte unique en base), message clair

### UC-CAR-2 : Modifier un véhicule
- [ ] **Double-clic → éditeur** : double-cliquer sur une ligne de la grille → éditeur générique s'ouvre avec tous les champs
- [ ] **Statut via sélecteur** : le champ "Statut" dans l'éditeur est un `<select>` (dispo/loue/maintenance/hors-service), pas une saisie libre (règle cohérence contrôles)
- [ ] **Modification enregistrée** : changer la couleur, enregistrer → `PUT /cars/:id` → valeur persistée, visible après F5
- [ ] **Annulation** : modifier un champ puis annuler → valeur d'origine restaurée, aucun appel API

### UC-CAR-3 : Statuts et disponibilité
- [ ] **Badge statut coloré** : `dispo` → vert, `loue` → rouge/orange, `maintenance` → jaune, cohérent sur toutes les grilles et widgets
- [ ] **Filtre par statut** : filtrer la colonne "Statut" sur "dispo" → seuls les véhicules disponibles apparaissent
- [ ] **Voiture hors-service invisible au planning** : une voiture `hors-service` n'apparaît pas comme disponible dans le sélecteur de véhicule lors d'une nouvelle réservation/contrat

### UC-CAR-4 : Liens croisés depuis une voiture
- [ ] **Navigation vers les réservations** : depuis la grille Voitures, cliquer sur la plaque d'un véhicule → navigue vers Réservations filtré sur cette plaque (ou comportement documenté équivalent)
- [ ] **Navigation vers les contrats** : depuis une ligne de contrat, cliquer sur la plaque → navigue vers Voitures, voiture surlignée ou filtrée

---

## 3. Module Clients

### UC-CUST-1 : Créer un client
**En tant qu'agent**, je veux enregistrer un nouveau client.

- [ ] **Formulaire client** : Nom (obligatoire), Téléphone, Email, Adresse, Notes
- [ ] **Nom vide → bloqué** : soumettre sans nom → erreur inline
- [ ] **Création et persistance** : créer un client → `POST /customers` → visible dans la grille, persiste après F5
- [ ] **Recherche client** : dans le champ de recherche de la grille, taper une partie du nom → grille filtrée en temps réel

### UC-CUST-2 : Modifier / supprimer
- [ ] **Édition via éditeur générique** : double-clic → modifier l'email → enregistrer → persisté
- [ ] **Suppression** : supprimer un client sans réservations/contrats actifs → `DELETE /customers/:id` → disparaît de la grille après F5
- [ ] **Suppression bloquée (FK)** : tenter de supprimer un client qui a des contrats actifs → erreur de contrainte d'intégrité, message explicite, client non supprimé

---

## 4. Module Réservations

### UC-RSV-1 : Créer une réservation manuelle
**En tant qu'agent**, je veux créer une réservation pour un client sur un véhicule.

- [ ] **Formulaire réservation** : Véhicule (sélecteur), Client (sélecteur), Date début, Date fin, Heure début/fin, Statut, Notes
- [ ] **Dates obligatoires** : soumettre sans dates → erreur inline
- [ ] **Date fin < date début** : soumettre avec fin antérieure au début → erreur inline
- [ ] **Création et persistance** : `POST /reservations` → réservation visible dans la grille et dans le planning, persistée après F5
- [ ] **Réservation créée → statut `confirmee` par défaut**

### UC-RSV-2 : Contrôle de chevauchement
- [ ] **Conflit → message clair** : créer une réservation pour le véhicule X sur 10-20/06 alors qu'une réservation active existe pour X sur 15-25/06 → message d'erreur rouge inline précisant véhicule/période/conflit, enregistrement bloqué
- [ ] **Périodes adjacentes → aucun conflit** : une réservation finissant le 20/06 et une nouvelle commençant le 21/06 → pas de conflit
- [ ] **Voiture `maintenance` ou `hors-service`** : tenter de créer une réservation sur un véhicule en maintenance → message d'avertissement (ou blocage selon règle métier)

### UC-RSV-3 : Gestion du cycle de vie
- [ ] **Passage à `terminee`** : modifier le statut d'une réservation passée en `terminee` → persisté, badge mis à jour
- [ ] **Annulation** : passer le statut à `annulee` → la réservation n'apparaît plus dans les contrôles de disponibilité future
- [ ] **Tri par date** : la grille Réservations affiche par défaut les réservations triées par date de début (ou created_at décroissant selon config)

### UC-RSV-4 : Lien avec lignes de contrat (BR25)
- [ ] **Réservation liée** : une réservation créée automatiquement par BR25 (lors d'ajout d'une ligne de contrat) affiche `contract_line_id` renseigné dans l'éditeur générique
- [ ] **Suppression de ligne de contrat → réservation BR25 supprimée** : supprimer la ligne de contrat qui a créé la réservation → la réservation associée disparaît de la grille
- [ ] **Réservation manuelle préexistante → non supprimée** : si la réservation préexistait avant la ligne de contrat (juste liée), supprimer la ligne → la réservation reste (déliée)

---

## 5. Module Contrats

### UC-CTR-1 : Créer un contrat (entête)
**En tant qu'agent**, je veux créer un nouveau contrat de location pour un client.

- [ ] **Formulaire simplifié** : "+ Nouveau contrat" → Client (sélecteur obligatoire), Date du contrat, Type (court/long terme), Mode de paiement, Plan de paiement
- [ ] **Création → modal de détail** : après création, le modal de détail s'ouvre immédiatement pour permettre d'ajouter les lignes
- [ ] **Contrat créé sans lignes** : le contrat existe en base mais la colonne "Lignes" affiche "0 ligne" dans la grille
- [ ] **Persistance** : F5 → le contrat entête est bien présent, avec 0 lignes

### UC-CTR-2 : Ajouter des lignes à un contrat
- [ ] **Bouton "+ Ajouter une ligne"** : dans le modal de détail, cliquer → ligne de saisie inline apparaît en bas du tableau
- [ ] **Saisie complète** : Véhicule (sélecteur), Date début, Date fin → durée calculée automatiquement (jours) → saisir Tarif/j → Montant HT calculé automatiquement (jours × tarif)
- [ ] **HT → TTC automatique** : modifier le montant HT → TTC recalculé en temps réel avec TVA (BR18), sans taxe journalière ni timbre
- [ ] **TTC → HT automatique** : modifier le TTC → HT recalculé en sens inverse (BR18)
- [ ] **Enregistrement** : ✓ → `POST /contract-lines` → ligne apparaît dans la grille, totaux entête mis à jour
- [ ] **Persistance** : F5 → la ligne est bien chargée depuis l'API (pas seulement en mémoire)

### UC-CTR-3 : Chevauchement véhicule (BR19)
- [ ] **Conflit détecté inline** : créer une ligne pour véhicule X sur une période déjà occupée par une ligne `active` d'un autre contrat → message rouge inline, ligne non créée
- [ ] **Message localisé et exploitable** : le message indique clairement le véhicule, la période en conflit et l'ID du contrat en conflit
- [ ] **Backend 409** : contourner l'UI et appeler `POST /contract-lines` avec chevauchement → réponse `409 vehicle_overlap`
- [ ] **Lignes résiliées exclues** : une période qui chevauche une ligne `resilie` du même véhicule → aucun conflit

### UC-CTR-4 : Édition inline d'une ligne
- [ ] **Bouton ✎ (edit)** : sur une ligne `active` dans le modal de détail → champs deviennent éditables inline
- [ ] **Modification** : modifier le tarif → HT/TTC recalculés → cliquer ✓ → `PUT /contract-lines/:id` → ligne mise à jour
- [ ] **409 sur modification** : modifier les dates d'une ligne de façon à créer un chevauchement → message rouge inline, modification annulée

### UC-CTR-5 : Résiliation anticipée d'une ligne (BR26)
- [ ] **Bouton ⏹ (résilier)** : disponible sur les lignes `active` uniquement → saisie de la date de fin effective
- [ ] **Validation des bornes** : `actual_end_date` doit être entre `period_start` et `period_end` (inclus) → hors bornes → erreur
- [ ] **Résiliation standard** : `actual_end_date` dans le futur → ligne passe à `resilie`, réservation associée raccourcie à `actual_end_date`
- [ ] **Résiliation rétroactive** : `actual_end_date` dans le passé → confirmation explicite demandée → après confirmation, réservation passe à `annulee`
- [ ] **Prorata recalculé** : montant HT/TTC recalculé proportionnellement à la durée réelle
- [ ] **Contrat résilié si dernière ligne active** : pour un contrat avec 1 ligne active résiliée → `contracts.status = resilie`
- [ ] **Contrat reste actif si lignes restantes** : résiliation d'une ligne sur 2 actives → `contracts.status` reste `active`

### UC-CTR-6 : Suppression d'une ligne
- [ ] **Bouton 🗑 (supprimer)** : confirmation demandée → `DELETE /contract-lines/:id` → ligne disparaît, totaux recalculés
- [ ] **Réservation BR25 supprimée** : la réservation créée automatiquement par BR25 est supprimée avec la ligne

### UC-CTR-7 : Navigation et affichage liste
- [ ] **Colonne "Lignes" cliquable** : badge "N ligne(s)" dans la grille Contrats → clic → modal de détail s'ouvre
- [ ] **Double-clic row → détail** : double-cliquer sur un contrat → modal de détail s'ouvre
- [ ] **Totaux corrects** : Total HT et Total TTC dans la grille proviennent des lignes de contrat (pas des factures)
- [ ] **Période affichée** : en mode lecture, le modal entête affiche la "Période" calculée (min date début → max date fin des lignes), pas une date libre
- [ ] **Modifier entête** : bouton "✏ Modifier entête" → champs devenus éditables (client, date signature, type, paiement, statut) → enregistrement → persisté

---

## 6. Module Devis (BR27)

### UC-QUO-1 : Créer un devis
**En tant qu'agent commercial**, je veux préparer un devis pour un client avant de créer le contrat.

- [ ] **Onglet "Devis"** : accessible depuis la barre de navigation
- [ ] **Formulaire nouveau devis** : Client (sélecteur), Date du devis (aujourd'hui par défaut), Date de validité (aujourd'hui + 30j par défaut), Notes
- [ ] **Validité obligatoire** : vider le champ "Date de validité" et tenter de créer → erreur inline
- [ ] **Création → modal de détail** : devis créé au statut `brouillon`, modal de détail s'ouvre immédiatement
- [ ] **Persistance** : F5 → devis visible dans la grille

### UC-QUO-2 : Ajouter des lignes à un devis
- [ ] **Ajout inline** : "+ Ajouter une ligne" → sélecteur véhicule + dates + tarif → HT/TTC synchronisés (BR18)
- [ ] **Aucun contrôle de chevauchement** : ajouter une ligne sur un véhicule/période déjà engagé par un contrat actif → **aucun blocage** (un devis ne réserve pas)
- [ ] **Aucune réservation créée** : après ajout de la ligne, aucune `reservations` n'apparaît en base pour cette ligne
- [ ] **Totaux mis à jour** : Total HT et TTC dans l'entête recalculés après chaque ajout/suppression de ligne

### UC-QUO-3 : Cycle de vie du devis
- [ ] **Envoi** : bouton "📤 Marquer envoyé" → `quotes.status = envoye` → badge mis à jour dans la liste
- [ ] **Refus** : bouton "✗ Refuser" (confirmation) → `quotes.status = refuse` → bouton "Valider" disparaît
- [ ] **Expiration affichée** : devis `envoye` avec `validity_date` dans le passé → badge "expiré" affiché dans la liste (calculé à l'affichage), statut en base reste `envoye`
- [ ] **Devis refusé/expiré → non validable** : le bouton "Valider → Contrat" est absent ou désactivé

### UC-QUO-4 : Générer le PDF du devis
- [ ] **Bouton "🖨 PDF"** : génère un document imprimable
- [ ] **Contenu PDF** : en-tête agence (nom, adresse, RIB), informations client, tableau des lignes (véhicule/immatriculation/période/jours/HT/TVA/TTC), totaux, **date de validité mise en évidence**
- [ ] **PDF d'un devis avec 0 ligne** : comportement documenté (PDF vide propre ou message d'erreur, pas de crash)

### UC-QUO-5 : Valider un devis → Contrat
- [ ] **Confirmation explicite** : cliquer "✓ Valider → Contrat" → boîte de confirmation "opération irréversible"
- [ ] **Annulation** : annuler la confirmation → aucune modification
- [ ] **Validation réussie** : confirmer → `POST /quotes/:id/validate` → nouveau contrat créé avec mêmes client/lignes/montants → devis passe à `valide`, `converted_contract_id` renseigné
- [ ] **Réservations créées (BR25)** : pour chaque ligne de contrat créée, une réservation est automatiquement créée/liée
- [ ] **Navigation post-validation** : lien "Voir le contrat {id}" dans l'entête du devis → clic ouvre le détail du contrat créé
- [ ] **Devis validé → lecture seule** : aucun bouton d'édition de lignes ni d'entête
- [ ] **Validation avec conflit BR19** : valider un devis dont une ligne chevauche désormais un contrat actif → erreur rouge inline, rollback complet (aucun contrat créé en base), devis reste `envoye`/`brouillon`

---

## 7. Module Factures

### UC-INV-1 : Créer une facture manuelle
**En tant que comptable**, je veux créer une facture pour un client.

- [ ] **Formulaire facture** : Client, Contrat (optionnel), Libellé, Devise, Date d'échéance
- [ ] **Lignes de facturation** : bouton "+ Ajouter une ligne" → ligne avec Véhicule, Période début/fin, Jours, Montant HT
- [ ] **Calcul automatique** (BR15bis) : HT → TVA calculée + taxe journalière (par ligne) + timbre (une fois pour la facture)
- [ ] **Facture sans ligne → bloquée** : tenter d'enregistrer sans aucune ligne → message "Une facture doit contenir au moins une ligne"

### UC-INV-2 : Auto-remplissage depuis un contrat (BR21)
- [ ] **Sélection d'un contrat** : dans le formulaire facture, sélectionner un contrat ayant 2 lignes actives → 2 lignes de facture générées automatiquement (véhicule, période, montant HT repris de chaque `contract_line`)
- [ ] **Lignes modifiables avant enregistrement** : modifier le montant HT d'une ligne générée → calcul TVA/taxe mis à jour
- [ ] **Ligne résiliée au prorata (BR26)** : sélectionner un contrat dont une ligne a été résiliée → la ligne de facture reprend le montant HT **ajusté** (prorata), pas l'original
- [ ] **Changement de contrat** : changer le contrat sélectionné → lignes du premier contrat remplacées par celles du second

### UC-INV-3 : Sélection du RIB (BR22)
- [ ] **RIB n°2 configuré** : si 2 RIB sont configurés en Paramètres, le sélecteur "RIB" apparaît dans le formulaire
- [ ] **RIB figé sur la facture** : créer une facture avec RIB n°2, puis modifier les paramètres RIB → régénérer le PDF → le PDF affiche toujours le RIB n°2 initial (non le nouveau RIB)
- [ ] **PDF sans RIB n°2** : avec seulement RIB n°1 configuré → pas de sélecteur, RIB n°1 utilisé implicitement dans le PDF

### UC-INV-4 : Générer le PDF de la facture
- [ ] **PDF correct** : toutes les lignes visibles, totaux HT/TVA/taxe/timbre/TTC cohérents
- [ ] **Timbre fiscal une seule fois** : pour une facture multi-lignes, le timbre n'apparaît qu'une fois dans les totaux
- [ ] **RIB affiché** : le PDF contient les coordonnées bancaires (RIB figé à la création)

### UC-INV-5 : Statuts de facture et recouvrement
- [ ] **Statuts** : `en_attente` → `partiellement_payee` → `payee` (progression via les paiements)
- [ ] **Grille Recouvrement** : affiche les factures avec montant dû / payé / restant
- [ ] **Navigation dashboard → factures** : KPI factures impayées du dashboard → navigue vers `#invoices` filtré sur statut impayé

---

## 8. Module Paiements

### UC-PAY-1 : Enregistrer un paiement
**En tant que comptable**, je veux enregistrer un paiement reçu sur une facture.

- [ ] **Formulaire paiement** : Facture (sélecteur), Montant, Devise, Date, Mode de paiement (espèces/virement/chèque)
- [ ] **Montant 0 → bloqué** : montant nul ou négatif → erreur inline
- [ ] **Création** : `POST /payments` → le montant dû de la facture est réduit, statut facture mis à jour
- [ ] **Persistance** : F5 → paiement visible, statut facture correct
- [ ] **Sur-paiement** : payer plus que le montant dû → comportement documenté (accepté avec avertissement, ou bloqué)

### UC-PAY-2 : Grille paiements
- [ ] **Tri par date** : paiements triés par date décroissante par défaut
- [ ] **Filtre par mode** : filtrer "virement" → seuls les virements affichés
- [ ] **Suppression** : supprimer un paiement → montant dû de la facture recalculé, statut facture recalculé

---

## 9. Module Maintenance

### UC-MAINT-1 : Enregistrer un coût de maintenance
**En tant que responsable parc**, je veux enregistrer une dépense de maintenance sur un véhicule.

- [ ] **Formulaire** : Véhicule (sélecteur), Type (vidange/pneumatiques/réparation/contrôle technique/autre), Date, Montant, Devise, Statut (payé/en attente), Notes
- [ ] **Création** : `POST /maintenance` → visible dans la grille
- [ ] **Devise étrangère** : saisir un montant en EUR → montant TND converti automatiquement au taux de change configuré
- [ ] **Navigation depuis Rentabilité** : cliquer sur "Dépenses" d'une voiture dans l'onglet Rentabilité → navigue vers Maintenance filtré sur cette voiture

### UC-MAINT-2 : Alertes maintenance
- [ ] **Alerte kilométrage** : si `alertKmLimit` est configuré et `km` > seuil → alerte visible dans l'onglet Alertes
- [ ] **Alerte contrôle technique** : si la date de prochain CT est dans moins de 30 jours → alerte visible

---

## 10. Module Assurances

### UC-INS-1 : Gérer une police d'assurance
- [ ] **Création** : Véhicule, Compagnie, N° police, Date début/fin, Montant mensuel, Devise → `POST /insurances`
- [ ] **Échéancier automatique** : après création, les `insurance_installments` (mensualités) sont générés automatiquement jusqu'à la date de fin
- [ ] **Persistance** : F5 → police et mensualités présentes

### UC-INS-2 : Alerte expiration assurance
- [ ] **Alerte** : une police dont `end_date` est dans moins de 30 jours apparaît dans l'onglet Alertes avec badge d'urgence

---

## 11. Module Leasing

### UC-LEAS-1 : Contrat de leasing
- [ ] **Création** : Véhicule, Bailleur, N° contrat, Dates, Mensualité, Devise → `POST /leasing`
- [ ] **Mensualités générées** : `leasing_installments` créés automatiquement
- [ ] **Alerte** : mensualité en attente impayée → apparaît dans les alertes

---

## 12. Module Vignettes

### UC-VIG-1 : Vignette annuelle
- [ ] **Création** : Véhicule, Année fiscale, Montant, Date d'échéance, Statut (à_payer/payé)
- [ ] **Alerte vignette à payer** : `status = a_payer` et date d'échéance passée/proche → alerte dans l'onglet Alertes
- [ ] **Marquer comme payé** : modifier le statut → alerte disparaît

---

## 13. Module GPS

### UC-GPS-1 : Carte de localisation
- [ ] **Onglet GPS** : affiche une carte avec les véhicules géolocalisés (si trackers configurés)
- [ ] **Grille GPS** : tableau avec immatriculation, dernière position, dernière mise à jour, vitesse
- [ ] **Lien vers voiture** : cliquer sur une plaque dans la grille GPS → navigue vers l'onglet Voitures filtré sur cette plaque

---

## 14. Module États des lieux (Inspections)

### UC-INSP-1 : Créer un état des lieux
- [ ] **Formulaire** : Véhicule, Date, Type (départ/retour), Kilométrage, Photos, Notes, Dommages
- [ ] **Création** : `POST /inspections` → visible dans la grille Inspections
- [ ] **Détail inspection** : ouvrir le détail → liste des dommages, photos associées

---

## 15. Module Rentabilité

### UC-RENT-1 : Tableau de rentabilité par véhicule
**En tant que directeur**, je veux voir la rentabilité de chaque véhicule (CA généré vs. dépenses).

- [ ] **Onglet Rentabilité** : tableau Immatriculation / Modèle / CA généré / Dépenses / Solde
- [ ] **Calcul CA** : CA = somme des paiements reçus sur les contrats liés au véhicule (ou factures liées)
- [ ] **Calcul Dépenses** : somme maintenance + leasing + assurances + vignettes pour ce véhicule
- [ ] **Solde** : CA - Dépenses (positif = rentable, négatif = déficitaire)
- [ ] **Bouton "Détails"** : ouvre le modal bilan financier avec graphique mensuel CA/Dépenses/Solde + tableau mensuel détaillé
- [ ] **Sélecteur d'année** : dans le modal, changer l'année → graphique et tableau se mettent à jour
- [ ] **Navigation cliquable** : cliquer sur la ligne d'un véhicule ou le bouton "Détails" → modal s'ouvre correctement

---

## 16. Dashboard & KPIs

### UC-DASH-1 : Indicateurs clés
**En tant que directeur**, je veux voir les métriques essentielles en un coup d'œil.

- [ ] **KPI Véhicules** : "Véhicules dispo", "En location", "En maintenance" — chiffres corrects (somme par statut)
- [ ] **KPI Financier** : "CA du mois", "Factures impayées", "Trésorerie prévisionnelle"
- [ ] **KPI Contrats** : "Contrats actifs", "Réservations à venir"
- [ ] **Cohérence** : les KPIs correspondent aux données réelles (vérifier manuellement sur un jeu de données connu)

### UC-DASH-2 : Navigation depuis les KPIs (widgets cliquables)
- [ ] **KPI "Véhicules dispo"** → navigue vers `#cars` filtré `status=dispo`
- [ ] **KPI "En location"** → navigue vers `#cars` filtré `status=loue`
- [ ] **KPI "Contrats actifs"** → navigue vers `#contracts` filtré `status=active`
- [ ] **KPI "Factures impayées"** → navigue vers `#invoices` filtré sur statut impayé
- [ ] **Filtre visible** : après navigation depuis un KPI, le filtre pré-rempli est visible dans la ligne de filtres de la grille cible

### UC-DASH-3 : Graphiques interactifs
- [ ] **Graphique CA mensuel** : affiche les 12 derniers mois, barres ou lignes correctes
- [ ] **Graphique répartition véhicules** : pie chart ou barres des statuts
- [ ] **Clic sur barre graphique** : cliquer sur un mois du graphique → navigue vers les données détaillées de ce mois avec filtre appliqué
- [ ] **Prévision de trésorerie** : tableau des 365 prochains jours avec revenus/dépenses prévisionnels

---

## 17. Paramètres

### UC-PARAM-1 : Paramètres de facturation
- [ ] **Taux TVA** : modifier le taux TVA → enregistrer → F5 → nouveau taux appliqué aux prochaines créations de lignes (contrats, factures)
- [ ] **Taxe journalière et timbre** : modifier → enregistrer → F5 → valeurs persistées
- [ ] **TVA négative bloquée** : saisir une valeur négative → erreur inline, pas d'enregistrement
- [ ] **TVA = 0 acceptée**

### UC-PARAM-2 : RIBs (BR22)
- [ ] **RIB n°1 + libellé** : renseigné et persisté
- [ ] **RIB n°2 + libellé** : renseigné et persisté, sélecteur RIB apparaît dans le formulaire facture
- [ ] **Suppression RIB n°2** : vider les champs RIB n°2 → enregistrer → sélecteur disparaît du formulaire facture

### UC-PARAM-3 : Informations agence
- [ ] **Nom, adresse, logo** : renseignés et affichés dans les PDF factures/devis/contrats
- [ ] **Taux de change** : modifier → recalcul des montants TND lors de prochaines saisies en devise étrangère

---

## 18. Gestion des Utilisateurs

### UC-USER-1 : Créer un utilisateur
- [ ] **Formulaire** : Nom, Email, Mot de passe, Rôle (admin/agent/comptable), Agence
- [ ] **Email unique** : créer avec un email déjà utilisé → erreur
- [ ] **Création** : nouvel utilisateur peut se connecter avec ses identifiants

### UC-USER-2 : Modifier / Réinitialiser mot de passe
- [ ] **Changer le rôle** : modifier le rôle d'un utilisateur → permissions mises à jour à la prochaine connexion
- [ ] **Réinitialiser mot de passe** : fonctionnalité disponible (même admin-only)

---

## 19. Tri et Filtres Génériques (BR24)

### UC-SORT-1 : Tri sur toutes les grilles
- [ ] **Tri ascendant** : clic sur un en-tête de colonne → indicateur ▲, tri croissant
- [ ] **Tri descendant** : second clic → indicateur ▼, tri décroissant
- [ ] **Tri numérique correct** : trier par montant → 10 < 100 < 1000 (pas alphabétique "10" > "2")
- [ ] **Tri par date** : trier par date → ordre chronologique correct
- [ ] **Grilles concernées** : Voitures, Clients, Contrats, Factures, Recouvrement, Paiements, Maintenance, Réservations, Inspections, Alertes, Assurances, Mensualités assurance, Leasing, Mensualités leasing, Vignettes, GPS, Utilisateurs, Rentabilité, Prévision trésorerie, Devis

### UC-SORT-2 : Filtres par colonne
- [ ] **Filtre texte** : saisir une partie de valeur → résultats filtrés en temps réel, insensible à la casse
- [ ] **Filtre liste déroulante** : sur les colonnes à valeurs énumérées (Statut, Type, Devise...) → sélecteur au lieu d'un texte libre
- [ ] **Filtres cumulatifs** : activer 2 filtres → ET logique (seules les lignes respectant les deux critères)
- [ ] **Réinitialisation** : vider un filtre → résultats restaurés
- [ ] **État conservé en session** : naviguer vers un autre onglet puis revenir → filtre/tri toujours actif

---

## 20. Persistance API & Règles transverses

### UC-PERSIST-1 : Aucun écran local-only
- [ ] **Recharge F5 = données API** : pour chaque entité (voitures, clients, contrats, lignes de contrat, devis, lignes de devis, réservations, factures, paiements, maintenance, assurances, leasing, vignettes), créer un enregistrement, recharger la page → données toujours présentes (viennent de l'API, pas d'un cache local)
- [ ] **État local synchronisé** : après création/modification via l'UI, `state.<entité>` est mis à jour localement sans attendre un rechargement complet

### UC-PERSIST-2 : Piste d'audit (BR23)
- [ ] **`created_by` renseigné** : créer n'importe quel enregistrement → `created_by = userId connecté` visible dans l'éditeur générique
- [ ] **`updated_by` renseigné** : modifier un enregistrement → `updated_by = userId modifiant`, `created_by` inchangé
- [ ] **Résolution du nom** : dans l'éditeur générique, `created_by`/`updated_by` affichent le nom de l'utilisateur, pas l'UUID

### UC-PERSIST-3 : Messages d'erreur
- [ ] **Tous en français** : aucun message d'erreur technique en anglais visible par l'utilisateur final
- [ ] **Inline, pas modal** : les erreurs de validation (BR19 chevauchement, BR21 facture vide, BR27 validité obligatoire) s'affichent en rouge inline dans le formulaire, pas via `alert()`
- [ ] **API indisponible** : couper le backend → l'UI affiche un message d'erreur explicite, pas un écran blanc ni un blocage silencieux

---

## 21. Non-régression globale

### UC-NR-1 : Après chaque déploiement
- [ ] **Connexion** : fonctionne toujours
- [ ] **Dashboard** : KPIs chargent, graphiques s'affichent
- [ ] **Voitures** : liste + création + édition
- [ ] **Clients** : liste + création + édition
- [ ] **Réservations** : liste + création + vérification conflit
- [ ] **Contrats** : liste + création entête + ajout ligne + résiliation
- [ ] **Devis** : liste + création + ajout ligne + PDF + validation
- [ ] **Factures** : liste + création + auto-remplissage + PDF
- [ ] **Paiements** : liste + création
- [ ] **Maintenance / Assurances / Leasing / Vignettes** : liste + création
- [ ] **Alertes** : onglet Alertes affiche les alertes actives
- [ ] **Paramètres** : ouvrir, modifier une valeur, enregistrer, F5 → persisté
- [ ] **Aucune erreur console** : ouvrir la console du navigateur → aucune erreur JavaScript rouge

### UC-NR-2 : Cohérence des totaux
- [ ] **Contrat** : Total HT affiché dans la liste = somme des lignes de contrat
- [ ] **Facture** : Total TTC = HT + TVA + taxes + timbre, cohérent entre la liste et le PDF
- [ ] **Devis** : Total TTC = somme des lignes de devis

### UC-NR-3 : Tri et filtre + navigation widgets (combinés)
- [ ] **Navigation depuis widget** : cliquer un KPI → grille cible filtrée, le filtre est visible dans la ligne de filtres génériques (pas seulement en mémoire)
- [ ] **Filtre actif + tri** : appliquer un filtre puis trier → seules les lignes filtrées sont triées

---

## Annexe — Matrice de couverture par entité

| Entité | Création | Lecture | Modification | Suppression | PDF | Persistance F5 | Audit BR23 | Tri/Filtre BR24 |
|--------|----------|---------|--------------|-------------|-----|----------------|------------|-----------------|
| `cars` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `customers` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `reservations` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `contracts` | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| `contract_lines` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `quotes` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `quote_lines` | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | — |
| `invoices` | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| `payments` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `maintenance_costs` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `insurances` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `leasing_contracts` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `vignettes` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| `inspections` | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| `settings` | — | ✓ | ✓ | — | — | ✓ | — | — |
| `users` | ✓ | ✓ | ✓ | — | — | ✓ | — | ✓ |

> **Légende** : ✓ = à couvrir par les tests UC de ce document | — = non applicable ou couvert implicitement

---

*Document généré le 2026-06-24 — à mettre à jour à chaque nouvelle phase.*  
*Pour les tests exhaustifs BR18-BR27, voir `docs/06-tests/V2_TEST_PLAN.md`.*
