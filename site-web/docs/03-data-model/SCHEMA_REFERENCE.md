# Schéma de données — Portail Client LocaCar · site-web

Ce document décrit uniquement la **vue publique** des données exposées par l'endpoint
`GET /api/v1/public/cars`. Le schéma complet de la base se trouve dans
`../App_locaCar/docs/03-data-model/SCHEMA_REFERENCE.md`.

---

## Réponse API — `/api/v1/public/cars`

### Succès

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "brand": "Renault",
      "model": "Clio 5",
      "fuel_type": "essence",
      "color": "Blanc",
      "location": "Tunis Centre",
      "status": "disponible",
      "odometer_km": 23500
    }
  ],
  "meta": {
    "from": "2025-08-01",
    "to": "2025-08-07",
    "total": 4
  }
}
```

### Champs exposés

| Champ         | Type     | Nullable | Valeurs possibles                                  |
|---------------|----------|----------|----------------------------------------------------|
| `id`          | string   | Non      | UUID                                               |
| `brand`       | string   | Oui      | Ex. "Renault", "Peugeot", "Toyota"                 |
| `model`       | string   | Non      | Ex. "Clio 5", "308 SW"                             |
| `fuel_type`   | string   | Oui      | `essence`, `diesel`, `électrique`, `hybride`, `gpl` |
| `color`       | string   | Oui      | Texte libre en français (ex. "Blanc", "Bleu nuit") |
| `location`    | string   | Oui      | Nom de l'agence ou ville                           |
| `status`      | string   | Non      | `disponible` ou `reserve` (seuls statuts retournés)|
| `odometer_km` | integer  | Oui      | Kilométrage courant                                |

### Champs NON exposés (volontairement exclus)

Les champs suivants de la table `cars` ne sont pas retournés par l'endpoint public :
- `plate`, `vin`, `registration_number`, `registration_date` — données sensibles
- `purchase_price`, `purchase_date` — données financières internes
- `owner_name`, `leasing_status` — données internes
- `notes`, `gps_lat`, `gps_lng`, `gps_speed` — données opérationnelles
- `created_by`, `updated_by`, `created_at`, `updated_at` — données d'audit

---

## Paramètres de la requête

| Paramètre | Type   | Obligatoire | Format       | Description                                   |
|-----------|--------|-------------|--------------|-----------------------------------------------|
| `from`    | string | Non         | `YYYY-MM-DD` | Date de début de la période recherchée        |
| `to`      | string | Non         | `YYYY-MM-DD` | Date de fin de la période recherchée          |

**Règle** : `from` et `to` sont soit tous les deux présents, soit tous les deux absents.
Si absents : retourne tous les véhicules avec statut `disponible` ou `reserve`.

---

## Logique de disponibilité (backend)

Un véhicule `C` est retourné pour la période `[from, to]` si :

1. `cars.status IN ('disponible', 'reserve')`, ET
2. Il n'existe pas de `contract_lines` avec `status = 'active'` ET `period_start < to` ET `period_end > from` pour ce véhicule, ET
3. Il n'existe pas de `reservations` avec `status NOT IN ('annulee', 'completee')` ET `start_date < to` ET `end_date > from` pour ce véhicule.

---

## Évolutions Lot 2

### Nouveaux champs prévus (migration SQL nécessaire)

```sql
ALTER TABLE cars ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_day DECIMAL(10,2);
```

Ces champs seront ajoutés à la sélection de `/api/v1/public/cars` en Lot 2.

### Nouvelle table prévue

```sql
CREATE TABLE reservation_requests (
  id            VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id        VARCHAR(50) REFERENCES cars(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(30),
  customer_email VARCHAR(255),
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        VARCHAR(20) DEFAULT 'en_attente',  -- en_attente, confirmee, annulee
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);
```
