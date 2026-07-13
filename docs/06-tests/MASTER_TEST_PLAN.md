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
**En tant que gestionnaire**, je veux ajouter un nouveau véhicule au parc avec tous ses détails.

- [ ] **Modal de création** : cliquer "Nouveau" → le modal "Nouveau véhicule" (même modal que l'éditeur de détail) s'ouvre avec tous les champs vides : Immatriculation, Modèle, Marque, Couleur, VIN, N° carte grise, Date d'immatriculation, Type de carburant (select), Kilométrage, Statut, Agence, Propriétaire, Prix d'achat, Date d'achat, Trésorerie initiale, Notes
- [ ] **Libellés en français** : chaque champ du modal affiche son libellé en français (pas le nom camelCase de la propriété JS)
- [ ] **Champs obligatoires** : cliquer "Enregistrer" sans Immatriculation ou sans Modèle → alerte "L'immatriculation et le modèle sont obligatoires", aucun appel API
- [ ] **Création réussie** : remplir immatriculation + modèle (au minimum) → `POST /cars` avec tous les champs renseignés → modal se ferme, voiture apparaît dans la grille, rechargement F5 la confirme en base avec tous les champs persistés
- [ ] **Carburant via sélecteur** : le champ "Type de carburant" est un `<select>` (Diesel, Essence, Hybride, Électrique, GPL), idem dans le modal d'édition
- [ ] **Annuler** : cliquer "Annuler" dans le modal → modal se ferme, aucun enregistrement créé, la grille est inchangée
- [ ] **Doublon d'immatriculation** : créer un second véhicule avec la même immatriculation → erreur (contrainte unique en base), message clair

### UC-CAR-2 : Modifier un véhicule
- [ ] **Double-clic → éditeur** : double-cliquer sur une ligne de la grille → éditeur générique s'ouvre avec tous les champs en français
- [ ] **Libellés éditeur** : les noms des champs dans l'éditeur sont en français (ex. "Kilométrage (km)" au lieu de "odometerKm", "Trésorerie initiale (TND)" au lieu de "openingCashTnd")
- [ ] **Statut via sélecteur** : le champ "Statut" dans l'éditeur est un `<select>` (dispo/loue/maintenance), pas une saisie libre
- [ ] **Carburant via sélecteur** : le champ "Type de carburant" dans l'éditeur est un `<select>` avec les mêmes options que dans le formulaire de création
- [ ] **Modification enregistrée** : changer la couleur, enregistrer → `PUT /cars/:id` → valeur persistée, visible après F5
- [ ] **Annulation** : modifier un champ puis annuler → valeur d'origine restaurée, aucun appel API

### UC-CAR-3 : Statuts et disponibilité
- [ ] **Badge statut coloré** : `dispo` → vert, `loue` → rouge/orange, `maintenance` → jaune, cohérent sur toutes les grilles et widgets
- [ ] **Filtre par statut** : filtrer la colonne "Statut" sur "dispo" → seuls les véhicules disponibles apparaissent
- [ ] **Voiture hors-service invisible au planning** : une voiture `hors-service` n'apparaît pas comme disponible dans le sélecteur de véhicule lors d'une nouvelle réservation/contrat

### UC-CAR-4 : Liens croisés depuis une voiture
- [ ] **Navigation vers les réservations** : depuis la grille Voitures, cliquer sur la plaque d'un véhicule → navigue vers Réservations filtré sur cette plaque (ou comportement documenté équivalent)
- [ ] **Navigation vers les contrats** : depuis une ligne de contrat, cliquer sur la plaque → navigue vers Voitures, voiture surlignée ou filtrée

### UC-CAR-5 : Sélecteur de colonnes dynamique (tous les grids)
**En tant qu'utilisateur**, je veux choisir les colonnes affichées dans chaque liste pour adapter l'affichage à mon besoin.

- [ ] **Ouverture du sélecteur** : cliquer sur ⚙ Colonnes dans un panel → popover s'ouvre avec la liste des colonnes disponibles, cases cochées pour les colonnes actives
- [ ] **Masquer une colonne** : décocher une colonne dans le popover → colonne disparaît immédiatement du header et du body (entête + cellules masqués)
- [ ] **Réafficher une colonne** : cocher une colonne masquée → colonne réapparaît immédiatement
- [ ] **Bouton Défaut** : cliquer Défaut → colonnes reviennent au jeu par défaut défini dans `DEFAULT_COLS`
- [ ] **Bouton Tout** : cliquer Tout → toutes les colonnes disponibles s'affichent
- [ ] **Persistance des préférences** : masquer une colonne, recharger la page (F5) → colonne toujours masquée (prefs dans `localStorage`)
- [ ] **Fermeture popover** : cliquer en dehors du popover ou sur ✕ Fermer → popover se ferme sans erreur
- [ ] **Grids couverts** : véhicules, clients, paiements, réservations, maintenance, assurances, leasing, vignettes — chacun dispose de son bouton ⚙ Colonnes
- [ ] **Colonnes supplémentaires véhicules** : activer Marque, Couleur, VIN → colonnes s'affichent dans la grille véhicules avec les données correctes
- [ ] **Tri/filtre préservé** : masquer une colonne pendant qu'un filtre est actif sur une autre colonne → filtre reste actif, résultats inchangés

---

## 3. Module Clients

### UC-CUST-1 : Créer un client
**En tant qu'agent**, je veux enregistrer un nouveau client.

- [ ] **Formulaire client** : Nom (obligatoire), Téléphone, Email, Adresse, Matricule fiscal, Type
- [ ] **Nom vide → bloqué** : soumettre sans nom → erreur inline
- [ ] **Matricule fiscal** : saisir un MF dans le formulaire → `POST /customers` avec `tax_id` → récupéré après F5
- [ ] **Adresse** : saisir une adresse → persistée et visible dans le détail client
- [ ] **Création et persistance** : créer un client → `POST /customers` → visible dans la grille, persiste après F5
- [ ] **Recherche client** : dans le champ de recherche de la grille, taper une partie du nom → grille filtrée en temps réel

### UC-CUST-2 : Modifier / supprimer
- [ ] **Édition via éditeur générique** : double-clic → modifier le matricule fiscal ou l'adresse → enregistrer → persisté
- [ ] **Suppression** : supprimer un client sans réservations/contrats actifs → `DELETE /customers/:id` → disparaît de la grille après F5
- [ ] **Suppression bloquée (FK)** : tenter de supprimer un client qui a des contrats actifs → erreur de contrainte d'intégrité, message explicite, client non supprimé

### UC-CUST-3 : Matricule fiscal et adresse dans le PDF facture
**En tant qu'agent**, je veux que le PDF de facture affiche les coordonnées complètes du client.

- [ ] **Nominal** : client avec adresse + email + MF → PDF facture affiche les 4 lignes (nom, adresse, tél, e-mail, MF)
- [ ] **Champs vides** : client sans MF → ligne MF absente du PDF (pas de ligne vide)
- [ ] **Persistance** : modifier le MF d'un client → regénérer le PDF → nouveau MF affiché

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
- [ ] **Même jour, horaires différents → aucun conflit** : réservation A finissant le 20/06 à 10:00, réservation B commençant le 20/06 à 14:00 → pas de conflit (fix HH:MM:SS : les colonnes PostgreSQL TIME retournent "HH:MM:SS", la fonction `toReservationDateTime` normalise via `.slice(0, 5)` avant comparaison pour éviter les faux conflits)
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

### UC-CTR-8 : Générer l'échéancier de facturation (BR32)
**En tant que gestionnaire**, je veux planifier la facturation mensuelle d'un contrat long terme sans créer de factures immédiatement.

- [ ] **Section visible uniquement pour contrats long terme** : ouvrir le modal de détail d'un contrat `type=long` → section "Échéancier de facturation" apparaît en bas ; absent pour `type=court`
- [ ] **Générer l'échéancier** : cliquer "Générer l'échéancier" sur un contrat de 12 mois → 12 entrées créées (`status=planifie`), une par mois, avec libellé "Loyer [Mois Année] — [plaques]"
- [ ] **Blocage sans lignes actives** : contrat long terme sans aucune ligne active → message d'erreur "Ce contrat n'a aucune ligne active", aucune entrée créée
- [ ] **Montants corrects** : les montants HT des entrées correspondent à la somme des tarifs des lignes actives du contrat
- [ ] **Cohérence des dates** : les périodes des entrées couvrent exactement la plage start/end du contrat, sans trous ni chevauchements
- [ ] **Régénérer** : après modification du contrat (tarif, dates), cliquer "↺ Régénérer" → confirmation demandée → entrées `planifie` supprimées et recréées ; entrées `brouillon`/`confirme` non touchées
- [ ] **Persistance** : F5 → les entrées d'échéancier sont toujours présentes

### UC-CTR-9 : Générer une facture depuis l'échéancier (BR32)
**En tant que gestionnaire**, je veux transformer une entrée planifiée en facture brouillon au moment de la facturation.

- [ ] **Bouton "Générer facture"** : visible uniquement sur les entrées `planifie` → clic → facture brouillon créée, modal facture s'ouvre
- [ ] **Statut mis à jour** : l'entrée d'échéancier passe de `planifie` à `brouillon`, le bouton "Générer facture" est remplacé par "Voir brouillon →"
- [ ] **Facture sans numéro** : la facture créée s'affiche `FAC-XXXXX (brouillon)` — pas encore de numéro séquentiel
- [ ] **Lignes générées** : la facture brouillon contient les lignes issues des `contract_lines` actives (une par véhicule)
- [ ] **Entrée déjà générée** : tenter de régénérer une entrée `brouillon` → message d'erreur "Cette entrée est au statut brouillon, pas planifie"
- [ ] **Persistance** : F5 → facture brouillon toujours présente, entrée d'échéancier en statut `brouillon`

---

## 6. Module Devis (BR27)

### UC-QUO-1 : Créer un devis
**En tant qu'agent commercial**, je veux préparer un devis pour un client avant de créer le contrat.

- [ ] **Champ Type** : sélecteur "Court terme / Long terme / Autre" présent dans le formulaire de création ; valeur par défaut "Court terme" ; persisté en base dans `quotes.type`
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
- [ ] **Propagation du type** : devis `type = court` → contrat `type = court`, `payment_plan = 'paiement client debut'` ; devis `type = long` → contrat `type = long`, `payment_plan = 'mensualite'`
- [ ] **Réservations créées (BR25)** : pour chaque ligne de contrat créée, une réservation est automatiquement créée/liée
- [ ] **Navigation post-validation** : lien "Voir le contrat {id}" dans l'entête du devis → clic ouvre le détail du contrat créé
- [ ] **Devis validé → lecture seule** : aucun bouton d'édition de lignes ni d'entête
- [ ] **Validation avec conflit BR19** : valider un devis dont une ligne chevauche désormais un contrat actif → erreur rouge inline, rollback complet (aucun contrat créé en base), devis reste `envoye`/`brouillon`

### UC-QUO-6 : Devis long terme → proposition d'échéancier (BR27+BR32)
**En tant qu'agent commercial**, je veux que la validation d'un devis long terme propose directement la génération de l'échéancier.

- [ ] **Déclenchement automatique** : valider un devis `type = long` → modal contrat s'ouvre → une boîte de confirmation "Générer l'échéancier de facturation maintenant ?" apparaît (~300ms après ouverture)
- [ ] **Accepter** : cliquer "OK" → `POST /contracts/:id/generate-schedule` → entrées échéancier créées → section "Échéancier" du modal contrat affiche les lignes générées
- [ ] **Refuser** : cliquer "Annuler" → aucun échéancier créé, section "Échéancier" reste vide (bouton "Générer l'échéancier" disponible manuellement)
- [ ] **Devis court terme** : pas de boîte de confirmation après validation
- [ ] **Persistance** : F5 → échéancier toujours présent dans le détail contrat

---

## 7. Module Factures

### UC-INV-1 : Créer une facture manuelle
**En tant que comptable**, je veux créer une facture pour un client.

- [ ] **Formulaire facture** : Client, Contrat (optionnel), Libellé, Devise, Date d'échéance
- [ ] **Lignes de facturation** : bouton "+ Ajouter une ligne" → ligne avec Véhicule, Période début/fin, Jours, Montant HT
- [ ] **Calcul automatique** (BR15bis) : HT → TVA calculée + taxe journalière (par ligne) + timbre (une fois pour la facture)
- [ ] **Facture sans ligne → bloquée** : tenter d'enregistrer sans aucune ligne → message "Une facture doit contenir au moins une ligne"

### UC-INV-2 : Créer une facture avec lignes relationnelles (BR21)
**En tant que comptable**, je veux que les lignes d'une facture soient stockées en base de façon fiable.

- [ ] **Création avec lignes** : créer une facture avec 2 lignes → `POST /invoices` retourne 201, les lignes sont bien dans la table `invoice_lines` (vérifiable via `GET /invoice-lines?invoice_id=xxx`), plus dans le JSONB
- [ ] **Blocage sans ligne (UI)** : tenter d'enregistrer le formulaire sans aucune ligne → le bouton est bloqué ou un message rouge "Une facture doit contenir au moins une ligne" s'affiche, aucun appel API émis
- [ ] **Blocage sans ligne (backend)** : appel direct `POST /invoices` avec `lines: []` → réponse `400 { success: false, message: "Une facture doit contenir au moins une ligne." }`
- [ ] **Persistance** : F5 → la facture et ses lignes sont toujours présentes, les totaux (HT/TVA/TTC) sont corrects

### UC-INV-3 : Édition des lignes dans le modal (BR21)
**En tant que comptable**, je veux modifier, ajouter ou supprimer des lignes d'une facture existante.

- [ ] **Ouvrir le modal** : double-clic sur une facture → modal "Facture XXX" s'ouvre, lignes affichées avec colonnes Libellé/Contrat, Début période, Jours, HT, TVA, Taxe+Timbre, TTC, Actions (✏ ✕)
- [ ] **Ajouter une ligne** : cliquer "+ Ajouter une ligne" → ligne inline bleue apparaît ; saisir Contrat + Jours + HT → TVA/Taxe/TTC calculés en temps réel → ✓ → ligne sauvegardée via `POST /invoice-lines`, totaux de la facture recalculés, ligne apparaît dans la grille
- [ ] **Modifier une ligne** : cliquer ✏ sur une ligne → ligne passe en mode édition (fond ambré) avec tous les champs éditables ; modifier le montant HT → TTC recalculé ; ✓ → `PUT /invoice-lines/:id`, totaux mis à jour, grille rafraîchie
- [ ] **Supprimer une ligne (non dernière)** : cliquer ✕ sur une ligne quand la facture en a 2+ → confirmation → `DELETE /invoice-lines/:id` → ligne retirée, totaux recalculés
- [ ] **Supprimer la dernière ligne** : cliquer ✕ sur la seule ligne d'une facture → message d'erreur "Une facture doit avoir au moins une ligne.", ligne conservée
- [ ] **Persistance** : fermer le modal, rouvrir → les modifications sont toujours présentes (rechargement API au close du modal)

### UC-INV-4 : Migration automatique des factures existantes (BR21)
**En tant que système**, les anciennes factures (lignes en JSONB) doivent être transparentes pour l'utilisateur.

- [ ] **Facture ancienne lisible** : ouvrir une facture créée avant BR21 (lignes en JSONB, pas encore dans `invoice_lines`) → le modal affiche ses lignes correctement (repli JSONB)
- [ ] **Migration lazy au premier open** : ouvrir une facture ancienne → les lignes sont automatiquement migrées dans `invoice_lines` ; fermer et rouvrir → les lignes s'affichent depuis la table relationnelle (boutons ✏/✕ actifs)
- [ ] **Intégrité après migration** : les montants/périodes après migration sont identiques aux données JSONB d'origine
- [ ] **PDF inchangé** : générer le PDF d'une facture migrée → contenu identique à avant la migration

### UC-INV-5 : Sélection du RIB (BR22)
- [ ] **RIB n°2 configuré** : si 2 RIB sont configurés en Paramètres, le sélecteur "RIB" apparaît dans le formulaire
- [ ] **RIB figé sur la facture** : créer une facture avec RIB n°2, puis modifier les paramètres RIB → régénérer le PDF → le PDF affiche toujours le RIB n°2 initial (non le nouveau RIB)
- [ ] **PDF sans RIB n°2** : avec seulement RIB n°1 configuré → pas de sélecteur, RIB n°1 utilisé implicitement dans le PDF

### UC-INV-6 : Auto-remplissage depuis un contrat (BR21)
**En tant que comptable**, je veux que la sélection d'un contrat pré-remplisse les lignes de facture.

- [ ] **Sélection d'un contrat** : dans le formulaire facture, sélectionner un contrat ayant 2 lignes actives → 2 lignes générées automatiquement (véhicule, période, montant HT repris de chaque `contract_line`)
- [ ] **Lignes modifiables avant enregistrement** : modifier le montant HT d'une ligne générée → calcul TVA/taxe mis à jour
- [ ] **Ligne résiliée au prorata (BR26)** : sélectionner un contrat dont une ligne a été résiliée → la ligne de facture reprend le montant HT **ajusté** (prorata), pas l'original
- [ ] **Changement de contrat** : changer le contrat sélectionné → lignes du premier contrat remplacées par celles du second

### UC-INV-7 : Générer le PDF de la facture
**En tant que comptable**, je veux générer un PDF conforme depuis les lignes relationnelles (BR21).

- [ ] **PDF correct** : toutes les lignes visibles (lues depuis `invoice_lines`, fallback JSONB si ancienne facture), totaux HT/TVA/taxe/timbre/TTC cohérents
- [ ] **Timbre fiscal une seule fois** : pour une facture multi-lignes, le timbre n'apparaît qu'une fois dans les totaux
- [ ] **RIB affiché** : le PDF contient les coordonnées bancaires (RIB figé à la création — UC-INV-5)

### UC-INV-8 : Statuts de facture et recouvrement
- [ ] **Statuts** : `brouillon` → `en_attente` → `partiellement_payee` → `payee` (progression)
- [ ] **Grille Recouvrement** : affiche les factures avec montant dû / payé / restant (les brouillons n'y apparaissent pas)
- [ ] **Navigation dashboard → factures** : KPI factures impayées du dashboard → navigue vers `#invoices` filtré sur statut impayé

### UC-INV-9 : Confirmer une facture brouillon — numérotation séquentielle (BR27)
**En tant que comptable**, je veux confirmer un brouillon pour lui attribuer un numéro officiel chronologique.

- [ ] **Bouton "✓ Confirmer la facture"** : visible dans le modal uniquement pour les factures `brouillon`
- [ ] **Numéro attribué à la confirmation** : après confirmation → statut passe à `en_attente`, numéro `AAAA-NNNN` attribué (ex. `2026-0001`), affiché à la place de l'ID dans la liste et dans le modal
- [ ] **Séquentialité** : confirmer 3 brouillons en janvier → numéros `2026-0001`, `2026-0002`, `2026-0003` dans l'ordre de confirmation, pas dans l'ordre de création
- [ ] **Chronologie respectée** : un brouillon créé en décembre mais confirmé en janvier → numéro de janvier (pas de décembre)
- [ ] **Suppression impossible après confirmation** : tenter `DELETE /invoices/:id` sur une facture `en_attente` → `422 "Seules les factures en brouillon peuvent être supprimées"`
- [ ] **Suppression possible avant confirmation** : `DELETE /invoices/:id` sur un brouillon → succès, entrée d'échéancier repasse à `planifie`
- [ ] **Échéancier mis à jour** : après confirmation, l'entrée d'échéancier correspondante passe à `confirme`, le lien "Voir brouillon →" devient le numéro de facture cliquable
- [ ] **Persistance** : F5 → numéro toujours présent, statut `en_attente`

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

### UC-DASH-4 : Taux d'occupation flotte — vue macro (§9.14)
**En tant que directeur**, je veux voir en un coup d'œil si la flotte est bien utilisée sur les 6 prochains mois.

- [ ] **Scénario nominal** : le graphique affiche 6 barres mensuelles avec un taux d'occupation (%) calculé à partir des réservations et lignes de contrat actives ; les barres sont colorées (vert / orange / rouge) selon les seuils 50 % / 80 %
- [ ] **KPI mois courant** : le span `#homeOccupancyKpi` affiche `X% ce mois (N/M véhicules)` avec la couleur correspondante
- [ ] **Tooltip** : survoler une barre → tooltip `N / M véhicules (X%)` affiché par Chart.js
- [ ] **Navigation** : cliquer sur une barre → onglet Réservations affiché (règle widgets cliquables)
- [ ] **Flotte vide** : aucun véhicule → graphique masqué / pas d'erreur JS
- [ ] **Véhicules indisponibles exclus** : `status='indisponible'` non comptabilisés dans le total
- [ ] **Persistance** : F5 → recalcul depuis API (pas de données figées)

### UC-DASH-5 : Dashboard personnalisable — déplacement, redimensionnement, masquage (§9.15)
**En tant qu'utilisateur**, je veux déplacer, redimensionner et masquer les cartes du dashboard, et retrouver ma configuration à chaque connexion.

**Déplacement**
- [ ] **Glisser une carte** : cliquer-glisser sur `⠿` → relâcher à une nouvelle position → toutes les cartes se réorganisent (KPIs et graphiques dans la même grille unifiée)
- [ ] **Déplacer un KPI sous les graphiques** : KPI déposé après les graphiques → affiché en bas de la grille
- [ ] **Persistance ordre** : F5 / déconnexion-reconnexion → même ordre restauré

**Redimensionnement**
- [ ] **Élargir** `▸` : cliquer `▸` sur une carte span-1 → passe à span-2 (2/3 de largeur) → cliquer à nouveau → span-3 (pleine largeur)
- [ ] **Rétrécir** `◂` : cliquer `◂` sur une carte span-3 → passe à span-2 puis span-1 ; ne peut pas descendre en dessous de span-1
- [ ] **Chart.js recalibré** : après redimensionnement, le graphique occupe tout l'espace de la carte (pas de débordement ni de canvas trop étroit)
- [ ] **Persistance taille** : F5 → taille de chaque carte restaurée

**Masquage / restauration**
- [ ] **Masquer** `✕` : cliquer `✕` → carte disparaît de la grille ; une barre jaune `Masqués :` apparaît au-dessus de la grille avec un chip `👁 Nom de la carte`
- [ ] **Restaurer** : cliquer le chip dans la barre jaune → carte réapparaît dans sa dernière position connue ; barre disparaît si plus aucune carte masquée
- [ ] **Persistance masquage** : F5 → carte toujours masquée / barre jaune toujours visible

**Isolation et cas limites**
- [ ] **Multi-device** : réorganiser sur le navigateur A → même layout sur le navigateur B
- [ ] **Isolation utilisateurs** : layout utilisateur A sans effet sur utilisateur B
- [ ] **Premier accès** : table `user_preferences` vide → ordre/taille/masquage par défaut, aucune erreur JS
- [ ] **Graphiques intacts** : déplacer une carte Chart.js → graphique toujours rendu (canvas préservé dans le DOM)

### UC-DASH-6 : Réinitialisation du layout dashboard (§9.15)
**En tant qu'utilisateur**, je veux remettre le dashboard dans sa disposition d'origine en un clic.

- [ ] **Scénario nominal** : après avoir déplacé, redimensionné ou masqué des cartes → cliquer "↺ Réinitialiser" → confirmation → toutes les cartes reviennent à l'ordre et aux spans par défaut, aucune carte masquée, barre jaune disparaît
- [ ] **Persistance** : F5 après réinitialisation → layout par défaut toujours appliqué (POST /preferences/dashboard-layout mis à jour)
- [ ] **Sans personnalisation** : cliquer "↺ Réinitialiser" sans avoir modifié le layout → aucune erreur, layout inchangé
- [ ] **Annulation** : cliquer "↺ Réinitialiser" puis annuler la confirmation → layout non modifié

### UC-CTR-8 : PDF du contrat (§9.16)
**En tant qu'agent**, je veux générer un PDF imprimable du contrat à remettre au client.

- [ ] **Scénario nominal** : ouvrir le modal de détail d'un contrat avec au moins une ligne → cliquer "🖨 PDF" → une fenêtre d'impression s'ouvre avec le contrat formaté (en-tête agence, infos client, tableau des lignes, totaux, blocs de signatures)
- [ ] **Contenu complet** : le PDF affiche l'ID contrat, le type, la date, le nom client, les lignes (immatriculation, modèle, période, jours, tarif, montant HT, TVA, TTC), les totaux HT/TVA/TTC, le montant en lettres, les blocs de signature
- [ ] **Contrat sans lignes** : ouvrir un contrat à 0 lignes → PDF s'ouvre avec message "Aucune ligne" dans le tableau
- [ ] **Popup bloquée** : si le navigateur bloque la popup → message d'avertissement affiché à l'utilisateur

### UC-CTR-9 : Créer une facture depuis un contrat (§9.16)
**En tant qu'agent**, je veux créer rapidement une facture liée à un contrat sans naviguer manuellement.

- [ ] **Scénario nominal** : ouvrir le modal de détail d'un contrat → cliquer "📄 Créer une facture" → facture créée automatiquement avec les lignes du contrat → modal facture ouvert directement
- [ ] **Contrat verrouillé après facturation** : fermer le modal facture → rouvrir le modal contrat → bouton "📄 Créer une facture" n'est plus visible → bouton "✏ Modifier entête" affiche "🔒 Contrat verrouillé" (désactivé) → aucun bouton d'édition/suppression sur les lignes
- [ ] **Lien vers la facture** : l'entête du contrat verrouillé affiche "Facture : FAC-XXXXX" cliquable → ouvre le modal de la facture liée
- [ ] **Annulation** : si aucune facture n'est créée, le contrat reste modifiable

### UC-CTR-10 : Verrouillage après facturation
**En tant que système**, un contrat facturé ne doit plus être modifiable.

- [ ] **Entête** : bouton "✏ Modifier entête" devient "🔒 Contrat verrouillé" et est désactivé
- [ ] **Lignes** : pas de bouton Modifier, Résilier ou Supprimer sur les lignes
- [ ] **Ajout de ligne** : bouton "+ Ajouter une ligne" masqué
- [ ] **Persistance** : F5 → état verrouillé conservé (basé sur l'existence de la facture en DB)

### UC-QUO-7 : Verrouillage après transformation en contrat
**En tant que système**, un devis transformé en contrat ne doit plus être modifiable.

- [ ] **Entête** : bouton "✏ Modifier entête" devient "🔒 Devis verrouillé" et est désactivé → boutons Envoyer/Refuser/Valider masqués
- [ ] **Lignes** : aucun bouton d'édition ou de suppression sur les lignes
- [ ] **Ajout de ligne** : bouton "+ Ajouter une ligne" masqué
- [ ] **Lien contrat** : l'entête affiche "Contrat : CTR-XXXXX" cliquable → ouvre le modal du contrat correspondant
- [ ] **PDF** : le bouton "🖨 PDF" reste visible et fonctionnel

### UC-QUO-8 : PDF devis (style identique à la facture)
**En tant qu'agent**, je veux imprimer un devis avec le même design que la facture.

- [ ] **En-tête** : logo + nom société + adresse + téléphone + RIB + matricule fiscal (identique à `generateInvoicePdf`)
- [ ] **Titre** : "DEVIS" avec le numéro N° QUO-XXXXX et la date
- [ ] **Bloc client** : même style que la facture (fond #f5f7ff, bordure bleue)
- [ ] **Tableau des lignes** : colonnes Désignation, Immatriculation, DU, AU, Nb.j, Prix HT, TVA, Prix TTC
- [ ] **Totaux** : HT + TVA + TTC (sans taxe journalière ni timbre, propres aux factures)
- [ ] **Montant en lettres** : "Arrêtée le présent devis à la somme de …"
- [ ] **Blocs signature** : Prestataire + Client (mêmes que le contrat)
- [ ] **Pied de page** : nom société + adresse + téléphone + matricule fiscal

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

## 10. Module Gestion des données — Import / Export (DMF)

### UC-DATA-1 : Accéder au catalogue des entités
**En tant qu'administrateur**, je veux voir la liste des entités importables/exportables avec leur nombre d'enregistrements en base.

- [ ] **Onglet "Gestion des données"** : accessible depuis la barre de navigation
- [ ] **Grille de cartes** : une carte par entité (Clients, Véhicules, Assurances, Leasings, Vignettes, Maintenance)
- [ ] **Compteur** : chaque carte affiche le nombre d'enregistrements actuels en base
- [ ] **Persistance** : F5 → onglet toujours présent

### UC-DATA-2 : Exporter une entité en CSV
**En tant qu'administrateur**, je veux exporter la liste complète d'une entité pour la consulter ou la modifier en masse dans Excel.

- [ ] **Bouton "↓ Exporter CSV"** : présent sur chaque carte entité
- [ ] **Téléchargement direct** : clic → fichier `<entité>_export_AAAA-MM-JJ.csv` téléchargé
- [ ] **Format** : séparateur `;`, encodage UTF-8 avec BOM (ouvrable directement dans Excel sans déformation des caractères spéciaux)
- [ ] **En-têtes** : identiques au template import (roundtrip : export → réimporter sans modification = 0 erreur, 0 création, N mises à jour)
- [ ] **Export vide** : entité sans enregistrement → CSV avec seulement la ligne d'en-têtes, pas d'erreur

### UC-DATA-3 : Télécharger le template d'import
**En tant qu'administrateur**, je veux un fichier modèle pré-formaté pour remplir mes données.

- [ ] **Bouton "↓ Télécharger le template CSV"** : présent dans le modal d'import (étape 1)
- [ ] **Contenu** : commentaires `#` (champs obligatoires, format dates, valeurs enum acceptées), ligne d'en-têtes, 1 ligne d'exemple
- [ ] **Format** : séparateur `;`, UTF-8 avec BOM

### UC-DATA-4 : Importer un fichier CSV valide
**En tant qu'administrateur**, je veux importer un fichier CSV pour créer ou mettre à jour des enregistrements en masse.

- [ ] **Modal d'import** : s'ouvre via bouton "↑ Importer CSV" sur la carte entité
- [ ] **Sélection fichier** : champ `<input type="file" accept=".csv">` fonctionnel
- [ ] **Import réussi** : fichier valide → panneau de résultat affiché avec badges "N créés / N mis à jour"
- [ ] **Déduplication** : réimporter le même fichier → 0 créés, N mis à jour (pas de doublons)
- [ ] **Compteur mis à jour** : après import, la carte entité affiche le nouveau nombre d'enregistrements
- [ ] **Persistance** : F5 → enregistrements importés toujours présents

### UC-DATA-5 : Validation et rapport d'erreurs
**En tant qu'administrateur**, je veux que les erreurs dans mon fichier soient détectées et détaillées avant ou pendant l'import.

- [ ] **Champ obligatoire vide** : ligne avec champ requis vide → erreur `"[label] est obligatoire"` avec numéro de ligne
- [ ] **Type invalide** : valeur non numérique dans un champ number → erreur `"valeur numérique attendue"`
- [ ] **Date mal formatée** : `15/01/2024` au lieu de `2024-01-15` → erreur `"format AAAA-MM-JJ attendu"`
- [ ] **Enum invalide** : valeur non reconnue → erreur listant les valeurs acceptées
- [ ] **Tableau d'erreurs** : ligne, champ, message pour chaque erreur
- [ ] **Rapport CSV** : bouton "↓ Télécharger rapport d'erreurs CSV" → fichier avec les mêmes colonnes
- [ ] **Blocage par défaut** : si erreurs présentes et `skip_errors=false` → aucune ligne écrite en base

### UC-DATA-6 : Mode simulation (dry run)
**En tant qu'administrateur**, je veux valider mon fichier sans l'importer pour m'assurer qu'il est correct.

- [ ] **Checkbox "Valider sans importer"** : présente dans le modal, décochée par défaut
- [ ] **Dry run activé** : cliquer "Lancer l'import" avec la case cochée → validation complète mais aucune écriture en base
- [ ] **Notice visible** : panneau de résultat affiche un avertissement jaune "Mode validation uniquement — aucune donnée n'a été écrite"
- [ ] **Compteur inchangé** : nombre d'enregistrements sur la carte entité identique avant/après

### UC-DATA-7 : Import partiel (skip_errors)
**En tant qu'administrateur**, je veux importer les lignes valides d'un fichier même si certaines lignes contiennent des erreurs.

- [ ] **Bouton "Importer les lignes valides quand même"** : visible dans le panneau d'erreurs
- [ ] **Résultat** : lignes valides créées/mises à jour, lignes invalides ignorées et reportées
- [ ] **Rapport** : badges distincts "N créés", "N ignorés", "N erreurs"

### UC-DATA-8 : Résolution automatique des FK véhicule
**En tant qu'administrateur**, je veux importer des assurances/leasings/vignettes/maintenance en utilisant l'immatriculation sans connaître l'ID interne du véhicule.

- [ ] **Colonne `car_plate`** : dans le CSV, saisir l'immatriculation du véhicule (ex. `123TU4567`)
- [ ] **Résolution automatique** : le backend résout `car_plate → car_id` avant INSERT
- [ ] **Erreur si véhicule inconnu** : immatriculation inexistante en base → erreur `"Véhicule X introuvable en base"` sur la ligne concernée, sans bloquer les autres lignes valides (avec skip_errors)

---

## 11. Module Souches de numéros (BR33)

### UC-SEQ-1 : Afficher et configurer une souche
**En tant qu'administrateur**, je veux voir et modifier la configuration de chaque souche depuis l'onglet Paramètres.

- [ ] **Section "Souches de numéros"** : visible dans l'onglet "Actions rapides" après exécution de la migration 009
- [ ] **Cartes souches** : une carte par entité (Factures, Contrats, Devis, Réservations) avec préfixe, séparateur, digits, include_year, reset_annually, et **aperçu du prochain numéro**
- [ ] **Bouton "✏ Configurer"** : ouvre modal d'édition → modifier les champs → "Enregistrer" → carte mise à jour, aperçu recalculé
- [ ] **Validation** : digits < 1 ou > 10 → erreur inline ; préfixe > 20 caractères → erreur inline
- [ ] **Persistance** : F5 → configuration toujours présente

### UC-SEQ-2 : Génération automatique du numéro à la création
**En tant qu'agent**, je veux que le numéro soit attribué automatiquement sans action manuelle.

> **Implémentation actuelle** : le frontend appelle `GET /api/next-sequence/:id` sur `serve.js` (même origine, port 3000). `serve.js` lit la table `number_sequences` via l'API REST Supabase avec la `service_role_key`, calcule le prochain numéro, incrémente le compteur, puis retourne le numéro formaté. Ce n'est **pas** l'endpoint backend Express (`src/backend/`). La souche `invoices` est attribuée lors de la confirmation (bouton "Confirmer") via le même mécanisme + `PUT /invoices/:id` — l'endpoint `POST /invoices/:id/confirm` n'est **plus utilisé** pour l'attribution du numéro.

- [ ] **Nouveau contrat** : créer un contrat → `contract_number` affiché dans la liste et dans le modal (format souche `contracts`)
- [ ] **Nouveau devis** : créer un devis → `quote_number` affiché dans la liste et dans le modal (format souche `quotes`)
- [ ] **Confirmation facture** : cliquer "Confirmer" sur une facture brouillon → `invoice_number` affiché (format souche `invoices`), statut passe à `en_attente`
- [ ] **Format correct** : numéro généré respecte prefix/sep/année/digits configurés (ex. `CTR-2026-0001`)
- [ ] **Séquentiel** : créer 3 contrats d'affilée → numéros consécutifs sans trou ni doublon
- [ ] **Reset annuel** : si `reset_annually=true` et changement d'année → compteur repart à 1
- [ ] **Affichage en liste** : la colonne Contrats/Devis affiche le numéro de souche (pas l'ID interne `CTR-xxxxx`)

### UC-SEQ-3 : Resynchronisation du compteur
**En tant qu'administrateur**, je veux pouvoir recaler le compteur sur la réalité de la base en cas de décalage.

- [ ] **Bouton "↺ Resynchroniser"** : disponible sur chaque carte souche
- [ ] **Confirmation** : boîte de dialogue avant exécution
- [ ] **Résultat** : message "Souche resynchronisée. Dernier numéro en base : N" affiché, carte rafraîchie
- [ ] **Effet** : après resync, le prochain numéro généré = max réel + 1 (pas de saut)

### UC-SEQ-4 : Audit des trous de séquence
**En tant qu'administrateur**, je veux détecter les trous dans la numérotation (factures, contrats, devis).

- [ ] **Bouton "🔍 Audit trous"** : disponible pour Factures, Contrats, Devis
- [ ] **Modal d'audit** : affiche total, min, max, last_number en base
- [ ] **Pas de trou** : message "✅ Aucun trou détecté dans la séquence"
- [ ] **Trous détectés** : liste des numéros manquants affichée (ex. "N°4 · N°7")
- [ ] **Décalage compteur** : si `last_number > max réel` → avertissement jaune "utilisez Resynchroniser"

### UC-SEQ-5 : Remise à zéro des souches lors du reset des données
**En tant qu'administrateur**, je veux que les compteurs de souches soient remis à zéro quand je réinitialise toutes les données, pour que les numéros repartent de 0001 sur une base propre.

> **Implémentation (mise à jour 2026-07-11)** : le bouton "Vider toutes les données" appelle directement `POST /api/v1/demo/clear` sur le backend Express (plus via serve.js). Cet endpoint supprime toutes les tables métier, supprime la ligne `settings` id=1, et exécute un `PATCH /number_sequences?id=not.is.null` avec `{ last_number: 0, last_year: null }`. Les données du portail client (`site_unavailability`) sont supprimées par cascade FK avec les véhicules.

- [ ] **Réinitialisation couplée** : cliquer "Vider toutes les données" → confirmation explicite → bouton passe en "Suppression en cours…" → toutes les données supprimées EN BASE (pas seulement localement)
- [ ] **Souches remises à zéro** : après le reset, l'aperçu dans les cartes de souches indique `0001` (last_number = 0)
- [ ] **Paramètres remis aux défauts** : après le reset + F5, la modale Paramètres affiche les valeurs par défaut (TVA 19 %, taux 3.4, RIBs vides)
- [ ] **Prochain numéro = 0001** : après reset, créer un contrat → numéro `CTR-XXXX-0001` (ou format configuré) — pas de résidu de l'ancienne séquence
- [ ] **Persistance** : F5 après reset → tous les écrans sont vides (aucune donnée rechargée depuis Supabase)
- [ ] **Erreur réseau** : si le backend est injoignable, le reset local (état JS + localStorage) s'exécute quand même et un message d'erreur console est affiché

---

## 12. Module Sauvegarde & Restauration

### UC-BAK-1 : Télécharger une sauvegarde complète
**En tant qu'administrateur**, je veux exporter toutes les données en un fichier JSON pour pouvoir les restaurer plus tard ou dans un autre environnement.

- [ ] **Bouton "📥 Télécharger sauvegarde"** : visible dans l'onglet "Actions rapides"
- [ ] **Téléchargement** : cliquer → fichier `locarcar_backup_AAAA-MM-JJ.json` téléchargé automatiquement
- [ ] **Contenu** : le fichier contient les champs `version`, `created_at`, `data` (toutes les tables métier) et `config` (souches + paramètres)
- [ ] **Données complètes** : un environnement avec 50 véhicules, 100 contrats → le fichier contient bien 50 véhicules et 100 contrats
- [ ] **Erreur réseau** : bouton "Téléchargement…" reste désactivé le temps du téléchargement, repasse à l'état initial en cas d'erreur avec message d'alerte

### UC-BAK-2 : Restaurer une sauvegarde
**En tant qu'administrateur**, je veux importer un fichier de sauvegarde JSON pour restaurer toutes les données (même scénario de migration ou de sinistre).

- [ ] **Bouton "📤 Restaurer depuis fichier"** : visible dans l'onglet "Actions rapides" → ouvre le sélecteur de fichier (`.json` uniquement)
- [ ] **Confirmation** : boîte de dialogue avertissant que toutes les données actuelles seront remplacées
- [ ] **Restauration** : sélectionner un fichier de sauvegarde valide → bouton "Restauration…" désactivé → rechargement automatique de la page après succès
- [ ] **Données restaurées** : après rechargement, tous les écrans affichent les données du fichier (véhicules, clients, contrats, etc.)
- [ ] **Souches restaurées** : après restauration, les souches reprennent à partir du dernier numéro du fichier (pas de recomencement à 0001)
- [ ] **Paramètres restaurés** : les paramètres d'agence du fichier sont restaurés (nom, RIBs, TVA…)
- [ ] **Fichier invalide** : sélectionner un fichier non-JSON ou un JSON sans champ `version` → message d'erreur, pas de modification en base
- [ ] **Migration d'environnement** : exporter depuis Railway → importer sur localhost (ou inversement) → données identiques dans les deux environnements

---

## 13. Module Paramètres — Capital

### UC-SET-1 : Saisir le Capital de départ
**En tant qu'administrateur**, je veux saisir un montant de capital global afin que la trésorerie actuelle du dashboard parte de ce montant.

- [ ] **Scénario nominal** : ouvrir Paramètres → champ "Capital (TND)" éditable → saisir 50 000 → Enregistrer → le dashboard affiche une trésorerie actuelle cohérente avec ce capital
- [ ] **Validation UI** : saisir une valeur négative → le champ l'accepte (capital négatif autorisé) ; saisir une valeur non numérique → le navigateur bloque (type="number")
- [ ] **Persistance** : F5 après enregistrement → le champ Capital affiche toujours 50 000
- [ ] **Dashboard** : trésorerie actuelle = Capital + encaissements réalisés − dépenses réalisées (plus de lien avec les trésoreries initiales des véhicules)
- [ ] **Indépendance véhicules** : modifier la trésorerie initiale d'un véhicule → la trésorerie globale dans le dashboard n'est PAS impactée
- [ ] **Rétro-compatibilité** : les champs "Trésorerie initiale" par véhicule restent affichés dans la fiche véhicule à titre informatif (non supprimés)

---

## 14. Module Contrats — Lignes modifiables + entête complet

### UC-CTR-10 : Modifier les dates d'une ligne de contrat
**En tant que gestionnaire**, je veux pouvoir modifier les dates d'une ligne de contrat existante afin de corriger une période ou de régénérer un échéancier cohérent.

- [ ] **Scénario nominal** : ouvrir la fiche d'un contrat → cliquer ✎ sur une ligne active → modifier `periodStart`/`periodEnd` → ✓ → dates mises à jour, entête rafraîchi
- [ ] **Ligne "terminée"** : une ligne dont `periodEnd < aujourd'hui` affiche bien le bouton ✎ (même si expirée par date) → modification possible
- [ ] **Contrat avec facture brouillon** : si le contrat a uniquement des factures en statut "brouillon", les lignes restent éditables (le cadenas ne se déclenche que sur une facture non-brouillon)
- [ ] **Contrat facturé (non-brouillon)** : si une facture confirmée existe, toutes les lignes sont verrouillées (pas de bouton ✎)
- [ ] **Chevauchement BR19** : changer les dates vers une période déjà prise par un autre contrat → erreur 409 affichée sous la ligne
- [ ] **Sync réservation** : après modification des dates, la réservation liée a ses `startDate`/`endDate` mis à jour en base et en mémoire
- [ ] **Persistance** : F5 → les nouvelles dates sont toujours affichées

### UC-CTR-11 : Régénérer l'échéancier après modification des dates
**En tant que gestionnaire**, je veux régénérer l'échéancier d'un contrat long terme après avoir changé les dates d'une ligne pour que les mois de l'échéancier correspondent à la nouvelle période.

- [ ] **Scénario nominal** : modifier les dates d'une ligne → cliquer "↺ Régénérer" → confirmer → l'échéancier affiche les mois correspondant aux nouvelles dates
- [ ] **Entrées planifiées supprimées** : après régénération, les anciennes entrées "planifié" sont supprimées et remplacées par les nouvelles
- [ ] **Entrées facturées conservées** : les entrées au statut "brouillon" ou "confirmé" (déjà facturées) ne sont PAS supprimées par la régénération
- [ ] **Erreur : pas de lignes actives** : si toutes les lignes sont annulées → erreur 422 affichée

### UC-CTR-12 : Modifier l'entête d'un contrat (tous les champs)
**En tant que gestionnaire**, je veux modifier tous les champs de l'entête d'un contrat (client, type, date signature, paiement, statut, tarif, caution) depuis la modale de détail.

- [ ] **Scénario nominal** : ouvrir fiche contrat → "✏ Modifier entête" → modifier le tarif et la devise → "✓ Enregistrer" → la vue lecture affiche les nouvelles valeurs
- [ ] **Champs présents** : Client, Type, Date signature, Paiement, Statut, Tarif + Devise, Caution + Devise
- [ ] **Vue lecture** : affiche Tarif et Caution avec leur devise respective
- [ ] **Persistance** : F5 → les valeurs modifiées sont toujours affichées (sauvegardées via `PUT /contracts/:id`)
- [ ] **Annuler** : cliquer "✗ Annuler" → les anciennes valeurs sont rétablies sans appel API

---

### UC-CTR-13 : Supprimer un contrat
**En tant que gestionnaire**, je veux pouvoir supprimer définitivement un contrat sans factures confirmées ni paiements.

- [ ] **Scénario nominal** : ouvrir fiche contrat sans facture confirmée → "🗑 Supprimer le contrat" → confirmer la boîte de dialogue → contrat disparaît de la liste
- [ ] **Persistance** : F5 → le contrat n'est plus présent (supprimé en base via `DELETE /contracts/:id`)
- [ ] **Lignes supprimées** : les `contract_lines` associées sont supprimées en cascade (FK `ON DELETE CASCADE`)
- [ ] **Réservations conservées** : les réservations liées voient leur `contractLineId` mis à `null` mais ne sont pas supprimées
- [ ] **Erreur backend — facture confirmée** : si une facture au statut `confirmée` existe → message "Impossible de supprimer : il possède des factures confirmées" affiché dans le modal
- [ ] **Erreur backend — paiements** : si un paiement existe → message "Impossible de supprimer : des paiements y sont associés" affiché dans le modal
- [ ] **Annuler** : cliquer "Annuler" dans la boîte de dialogue → aucune action

---

### UC-DASH-7 : Diagramme de Gantt des réservations sur le dashboard
**En tant que gestionnaire**, je veux voir le planning des véhicules (type Gantt) directement sur la page d'accueil sans naviguer vers l'onglet Réservations.

- [ ] **Scénario nominal** : se connecter → page d'accueil → carte "Planning véhicules" visible en pleine largeur avec les réservations en cours
- [ ] **Zoom** : cliquer "Jour" / "Semaine" / "Mois" → la vue se met à jour immédiatement
- [ ] **Navigation** : cliquer ◀ / ▶ → le mois (ou la période) change et la carte se rafraîchit
- [ ] **Filtre véhicule** : sélectionner un véhicule dans le menu déroulant → seul ce véhicule est affiché
- [ ] **Indépendance** : les contrôles du Gantt du dashboard sont indépendants de ceux de l'onglet Réservations (état séparé)
- [ ] **Masquage/redimensionnement** : la carte répond aux boutons ✕ / ◂ / ▸ du toolbar comme les autres cartes

---

### UC-SEQ-6 : Remettre à zéro une souche manuellement
**En tant qu'administrateur**, je veux pouvoir réinitialiser le compteur d'une souche à 1 pour commencer un nouvel exercice ou corriger une erreur de paramétrage.

- [ ] **Scénario nominal** : Paramètres → Souches → cliquer "🔄 Remettre à 0" sur une souche → confirmer → compteur repart à 1 (prochain document = numéro 1 du format configuré)
- [ ] **Confirmation obligatoire** : la boîte de dialogue doit apparaître avant toute action ; cliquer "Annuler" → aucune modification
- [ ] **Persistance** : F5 → la liste des souches affiche `Dernier n° : 0` (ou équivalent) et `Prochain : 1`
- [ ] **Prochain document** : créer un document du type remis à zéro → son numéro commence bien à 1
- [ ] **Erreur backend** : souche introuvable → 404 + message affiché

---

### UC-SEQ-7 : Libération automatique de la souche à la suppression
**En tant qu'utilisateur**, je veux que la suppression d'un contrat ou d'un devis libère son numéro de souche, afin que le prochain enregistrement créé réutilise ce numéro plutôt qu'en consommer un nouveau.

- [ ] **Scénario nominal** : créer un contrat (n° CTR-2026-0003) → le supprimer → créer un nouveau contrat → son numéro est CTR-2026-0003 (réutilisé)
- [ ] **Dernier enregistrement supprimé** : si le seul contrat existant est supprimé → créer un contrat → numéro repart à 0001
- [ ] **Suppression non-terminale** : CTR-0001, CTR-0002, CTR-0003 → supprimer CTR-0003 → créer → CTR-0003 réutilisé ; CTR-0001 et CTR-0002 toujours présents et intacts
- [ ] **Devis** : même comportement pour les devis (QUO-*)
- [ ] **Persistance** : F5 après la suppression → l'onglet Paramètres/Souches affiche le `last_number` mis à jour
- [ ] **Erreur backend** : si la resynchronisation échoue (RPC et fallback REST), la suppression réussit quand même (`.catch(() => {})` non bloquant)

---

### UC-CUST-5 : Créer un client sans téléphone
**En tant que commercial**, je veux créer une fiche client avec uniquement le nom, sans être bloqué par l'absence de numéro de téléphone.

- [ ] **Scénario nominal** : formulaire client → remplir uniquement le champ Nom → cliquer "Ajouter" → client créé sans erreur
- [ ] **Validation UI** : laisser le Nom vide → message "Le nom du client est obligatoire." ; téléphone vide → aucune erreur
- [ ] **Persistance** : F5 → le client sans téléphone apparaît toujours dans la liste
- [ ] **Édition ultérieure** : ouvrir la fiche client → pouvoir ajouter/modifier le téléphone via l'éditeur générique

---

### UC-UX-1 : Fermeture du formulaire inline après ajout
**En tant qu'utilisateur**, je veux que le formulaire de création se referme automatiquement après avoir cliqué "Ajouter" pour ne pas avoir à le fermer manuellement.

- [ ] **Client** : Ajouter un client → formulaire `#customerLegacyForm` se cache automatiquement
- [ ] **Contrat** : Ajouter un contrat → formulaire `#contractLegacyForm` se cache automatiquement
- [ ] **Réservation** : Ajouter une réservation → formulaire `#reservationLegacyForm` se cache automatiquement
- [ ] **Données conservées** : la fermeture ne supprime pas l'enregistrement créé (déjà persisté)

---

### UC-UX-2 : Sélection de texte dans un modal sans fermeture accidentelle
**En tant qu'utilisateur**, je veux pouvoir sélectionner du texte dans un modal (copier-coller) sans risquer de fermer le modal si ma souris sort du cadre.

- [ ] **Scénario nominal** : cliquer dans un champ texte du modal → glisser la souris en dehors du `.modal-card` pour sélectionner → relâcher la souris → le modal reste ouvert
- [ ] **Fermeture volontaire** : cliquer directement sur le fond sombre (sans sélection préalable) → le modal se ferme normalement

---

### UC-UX-3 : Voir le brouillon depuis l'échéancier d'un contrat
**En tant que gestionnaire**, je veux que le lien "Voir brouillon →" dans l'échéancier d'un contrat ouvre la facture brouillon par-dessus le modal contrat.

- [ ] **Scénario nominal** : ouvrir un contrat → onglet Échéancier → cliquer "Voir brouillon →" sur une ligne au statut `brouillon` → le modal facture s'ouvre et est visible (pas masqué derrière le modal contrat)
- [ ] **Fermeture** : fermer le modal facture → le modal contrat est toujours visible en arrière-plan

---

### UC-DASH-8 : Gantt en tête de page d'accueil
**En tant qu'utilisateur**, je veux voir le planning des véhicules en premier sur la page d'accueil, sans scroller.

- [ ] **Position** : à l'ouverture de l'accueil, la carte Gantt est la première carte visible (avant les KPIs)
- [ ] **Pleine largeur** : la carte occupe les 3 colonnes de la grille (`dash-span-3`)
- [ ] **Indépendance** : les contrôles du Gantt de l'accueil (zoom, navigation, filtre véhicule) n'affectent pas le Gantt de l'onglet Réservations

---

---

### UC-RSV-10 : Créer une réservation rapide depuis le Gantt de l'accueil
**En tant qu'opérateur**, je veux cliquer sur la piste d'un véhicule dans le Gantt pour créer une réservation en quelques secondes sans quitter la page d'accueil.

- [ ] **Scénario nominal** : cliquer sur une zone vide de la piste d'un véhicule → popover s'ouvre avec le véhicule pré-rempli, date = date cliquée + 1 jour, heures 09h-18h → modifier si besoin → "⚡ Créer" → réservation créée et Gantt mis à jour
- [ ] **Pré-remplissage date** : la date de début dans le popover correspond bien à la position du clic dans la timeline (ex. cliquer sur le 15 du mois → gqpStartDate = 15)
- [ ] **Clic sur une barre existante** : le popover ne s'ouvre PAS quand on clique sur une réservation déjà affichée
- [ ] **Validation UI** : date fin ≤ date début → message d'erreur inline dans le popover sans fermer celui-ci
- [ ] **Conflit** : le véhicule est déjà réservé sur la période → message de conflit affiché dans le popover
- [ ] **Client facultatif** : la réservation est créée sans client (champ absent du popover)
- [ ] **Note** : renseigner une note → elle est enregistrée en base et visible dans la fiche réservation
- [ ] **Fermeture** : cliquer en dehors du popover → il se ferme sans créer de réservation
- [ ] **Tous les véhicules** : même les véhicules sans réservation dans la période affichent une piste cliquable
- [ ] **Persistance** : F5 après création → la réservation est présente dans le Gantt et dans l'onglet Réservations

---

*Document généré le 2026-06-24 — mis à jour le 2026-07-13 (Capital, UC-SET-1 ; lignes contrat, UC-CTR-10/11/12 ; Gantt dashboard UC-DASH-7 ; suppression contrat UC-CTR-13 ; corrections UX UC-UX-1/2/3, UC-CUST-5, UC-SEQ-6, UC-DASH-8 ; création rapide depuis Gantt UC-RSV-10 ; libération souche à suppression UC-SEQ-7).*  
*Pour les tests exhaustifs BR18-BR27, voir `docs/06-tests/V2_TEST_PLAN.md`.*
