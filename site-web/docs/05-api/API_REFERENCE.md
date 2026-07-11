# Référence API — Portail Client LocaCar · site-web

L'API est fournie par le backend LocaCar (`src/backend/`).
Les endpoints `/public/` ne nécessitent **aucune authentification JWT**.

---

## GET /api/v1/public/cars

Retourne les véhicules disponibles pour une période optionnelle.

### Paramètres

| Paramètre | Emplacement | Type   | Obligatoire | Description                                   |
|-----------|-------------|--------|-------------|-----------------------------------------------|
| `from`    | query       | string | Non         | Date début période — format `YYYY-MM-DD`       |
| `to`      | query       | string | Non         | Date fin période   — format `YYYY-MM-DD`       |

**Règle** : `from` et `to` sont soit tous les deux présents, soit tous les deux absents.

### Exemples

```
# Sans filtre de dates (tous les véhicules disponibles/réservés)
GET /api/v1/public/cars

# Avec filtre de dates
GET /api/v1/public/cars?from=2025-08-01&to=2025-08-07
```

### Réponse 200 — Succès

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
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "brand": "Peugeot",
      "model": "208",
      "fuel_type": "diesel",
      "color": "Gris",
      "location": "Sfax",
      "status": "disponible",
      "odometer_km": 47800
    }
  ],
  "meta": {
    "from": "2025-08-01",
    "to": "2025-08-07",
    "total": 2
  }
}
```

### Réponse 400 — Dates invalides

```json
{
  "success": false,
  "message": "Dates invalides. Format attendu : YYYY-MM-DD"
}
```

```json
{
  "success": false,
  "message": "La date de retour doit être strictement après la date de départ."
}
```

### Réponse 500 — Erreur serveur

```json
{
  "success": false,
  "error": "Erreur serveur"
}
```

---

## [Lot 2] POST /api/v1/public/reservations

Crée une demande de réservation (pas encore implémenté).

### Body prévu

```json
{
  "car_id": "550e8400-e29b-41d4-a716-446655440000",
  "start_date": "2025-08-01",
  "end_date": "2025-08-07",
  "customer_name": "Ahmed Ben Ali",
  "customer_phone": "+21620000000",
  "customer_email": "ahmed@example.com",
  "notes": ""
}
```

### Réponse 201 prévue

```json
{
  "success": true,
  "data": {
    "id": "new-reservation-id",
    "status": "en_attente",
    "message": "Votre demande a bien été enregistrée. Nous vous confirmons votre réservation sous 24h."
  }
}
```

---

## Notes CORS

Le backend LocaCar applique `app.use(cors())` qui autorise toutes les origines.
En production, il est recommandé de restreindre à l'URL du portail client :

```typescript
// src/backend/index.ts — à configurer en production
app.use(cors({ origin: 'https://votre-portail.netlify.app' }));
```
