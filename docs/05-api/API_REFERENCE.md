# API Documentation
## LocaCar REST API Reference

**Version**: 1.0.0  
**Base URL**: `https://api.locacar.com/api/v1`  
**Authentication**: JWT Bearer Token

**📚 Related Documentation**:
- [Database Schema Reference](../03-data-model/SCHEMA_REFERENCE.md) - Details on all tables and fields
- [Database Setup Guide](../03-data-model/DATABASE_SETUP.md) - Connection and deployment instructions

---

## 1. API Overview

### 1.1 Response Format

All API responses follow a consistent JSON structure:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2026-05-05T10:30:00Z",
    "requestId": "req_abc123def456"
  }
}
```

### 1.2 Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2026-05-05T10:30:00Z",
    "requestId": "req_abc123def456"
  }
}
```

### 1.3 Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate/conflict error |
| 500 | Server Error | Unhandled error |

---

## 2. Authentication

### 2.1 Login Endpoint

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "agency_id": "uuid",
      "roles": ["rental_agent"]
    }
  }
}
```

### 2.2 Token Refresh

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer {refresh_token}

{}
```

### 2.3 Logout

```http
POST /auth/logout
Authorization: Bearer {access_token}

{}
```

### 2.4 Request Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: unique-request-id (optional)
```

---

## 3. Vehicles Endpoints

### 3.1 Create Vehicle

```http
POST /vehicles
Content-Type: application/json
Authorization: Bearer {token}

{
  "registration_number": "ABC-123",
  "vin": "WBADT43452G915688",
  "license_plate": "ABC123DE",
  "vehicle_type_id": "uuid",
  "agency_id": "uuid",
  "color": "Blue",
  "year_manufactured": 2023,
  "insurance_provider": "ABC Insurance",
  "insurance_policy_number": "POL-123456",
  "insurance_expiry": "2027-05-05"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "vehicle_id": "uuid",
    "registration_number": "ABC-123",
    "status": "available",
    "created_at": "2026-05-05T10:30:00Z"
  }
}
```

### 3.2 List Vehicles

```http
GET /vehicles?page=1&limit=20&status=available&agency_id=uuid
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "success": true,
  "data": [
    {
      "vehicle_id": "uuid",
      "registration_number": "ABC-123",
      "vehicle_type": "Sedan",
      "status": "available",
      "current_location": "Downtown Agency",
      "gps_latitude": 37.7749,
      "gps_longitude": -122.4194,
      "gps_last_update": "2026-05-05T10:29:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "pages": 5,
    "timestamp": "2026-05-05T10:30:00Z"
  }
}
```

### 3.3 Get Vehicle Details

```http
GET /vehicles/{vehicle_id}
Authorization: Bearer {token}
```

### 3.4 Update Vehicle

```http
PUT /vehicles/{vehicle_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "color": "Red",
  "insurance_expiry": "2027-06-05"
}
```

### 3.5 Change Vehicle Status

```http
POST /vehicles/{vehicle_id}/status-change
Content-Type: application/json
Authorization: Bearer {token}

{
  "new_status": "maintenance",
  "reason": "Oil change service",
  "scheduled_return_date": "2026-05-10T10:30:00Z"
}
```

### 3.6 Get GPS Location

```http
GET /vehicles/{vehicle_id}/gps-location
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "vehicle_id": "uuid",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy_meters": 25,
    "speed_kmh": 45,
    "heading": 180,
    "timestamp": "2026-05-05T10:28:00Z"
  }
}
```

### 3.7 Get GPS History

```http
GET /vehicles/{vehicle_id}/gps-history?start_date=2026-05-01&end_date=2026-05-05&contract_id=uuid
Authorization: Bearer {token}
```

---

## 4. Customers Endpoints

### 4.1 Create Customer

```http
POST /customers
Content-Type: application/json
Authorization: Bearer {token}

{
  "customer_type": "individual",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-15",
  "id_type": "passport",
  "id_number": "AB123456",
  "id_expiry": "2030-01-15",
  "driving_license_number": "DL123456",
  "driving_license_expiry": "2028-05-05",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postal_code": "10001"
}
```

### 4.2 List Customers

```http
GET /customers?page=1&limit=20&risk_classification=standard
Authorization: Bearer {token}
```

### 4.3 Get Customer

```http
GET /customers/{customer_id}
Authorization: Bearer {token}
```

### 4.4 Update Customer

```http
PUT /customers/{customer_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "phone": "+1234567890"
}
```

### 4.5 Get Customer Rental History

```http
GET /customers/{customer_id}/rental-history?start_date=2026-01-01&end_date=2026-05-05
Authorization: Bearer {token}
```

---

## 5. Contracts Endpoints

### 5.1 Create Contract

```http
POST /contracts
Content-Type: application/json
Authorization: Bearer {token}

{
  "customer_id": "uuid",
  "vehicle_id": "uuid",
  "rental_start_date": "2026-05-10T10:00:00Z",
  "rental_end_date": "2026-05-15T10:00:00Z",
  "insurance_type": "comprehensive",
  "gps_rental": true,
  "additional_driver_count": 1,
  "damage_waiver_insurance": true
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "contract_id": "uuid",
    "contract_number": "CNT-2026-001",
    "total_amount": 450.00,
    "contract_status": "draft"
  }
}
```

### 5.2 List Contracts

```http
GET /contracts?page=1&status=active&agency_id=uuid
Authorization: Bearer {token}
```

### 5.3 Get Contract

```http
GET /contracts/{contract_id}
Authorization: Bearer {token}
```

### 5.4 Confirm Contract

```http
POST /contracts/{contract_id}/confirm
Content-Type: application/json
Authorization: Bearer {token}

{}
```

### 5.5 Complete Contract

```http
POST /contracts/{contract_id}/complete
Content-Type: application/json
Authorization: Bearer {token}

{}
```

### 5.6 Download Contract PDF

```http
GET /contracts/{contract_id}/pdf
Authorization: Bearer {token}
```

**Response**: PDF file (application/pdf)

---

## 6. Vehicle Checks Endpoints

### 6.1 Create Vehicle Check

```http
POST /vehicle-checks
Content-Type: application/json
Authorization: Bearer {token}

{
  "contract_id": "uuid",
  "vehicle_id": "uuid",
  "check_type": "check_out",
  "gps_latitude": 37.7749,
  "gps_longitude": -122.4194,
  "mileage_start": 15000,
  "fuel_level_start": 100,
  "exterior_condition": "good",
  "interior_condition": "excellent",
  "damage_description": null,
  "checked_by": "uuid"
}
```

### 6.2 Upload Check Photos

```http
POST /vehicle-checks/{check_id}/photos
Content-Type: multipart/form-data
Authorization: Bearer {token}

[Binary image data]
- photo1.jpg (photo_type: exterior_front)
- photo2.jpg (photo_type: exterior_rear)
- photo3.jpg (photo_type: interior)
```

### 6.3 Submit Check

```http
POST /vehicle-checks/{check_id}/submit
Content-Type: application/json
Authorization: Bearer {token}

{
  "signature_url": "s3://bucket/signatures/abc.png"
}
```

---

## 7. Invoices Endpoints

### 7.1 Create Invoice

```http
POST /invoices
Content-Type: application/json
Authorization: Bearer {token}

{
  "contract_id": "uuid"
}
```

### 7.2 List Invoices

```http
GET /invoices?page=1&status=issued&date_from=2026-05-01&date_to=2026-05-31
Authorization: Bearer {token}
```

### 7.3 Get Invoice

```http
GET /invoices/{invoice_id}
Authorization: Bearer {token}
```

### 7.4 Issue Invoice

```http
POST /invoices/{invoice_id}/issue
Content-Type: application/json
Authorization: Bearer {token}

{}
```

### 7.5 Email Invoice

```http
POST /invoices/{invoice_id}/email
Content-Type: application/json
Authorization: Bearer {token}

{
  "recipient_email": "customer@example.com",
  "message": "Please find attached your invoice"
}
```

### 7.6 Download Invoice PDF

```http
GET /invoices/{invoice_id}/pdf
Authorization: Bearer {token}
```

---

## 8. Payments Endpoints

### 8.1 Record Payment

```http
POST /payments
Content-Type: application/json
Authorization: Bearer {token}

{
  "invoice_id": "uuid",
  "amount": 450.00,
  "payment_method": "credit_card",
  "transaction_id": "txn_abc123",
  "card_last_four": "4242",
  "notes": "Payment received"
}
```

### 8.2 List Payments

```http
GET /payments?invoice_id=uuid&date_from=2026-05-01
Authorization: Bearer {token}
```

### 8.3 Get Payment

```http
GET /payments/{payment_id}
Authorization: Bearer {token}
```

---

## 9. Reports Endpoints

### 9.1 Revenue Report

```http
GET /reports/revenue?start_date=2026-05-01&end_date=2026-05-31&agency_id=uuid
Authorization: Bearer {token}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2026-05-01",
      "end_date": "2026-05-31"
    },
    "summary": {
      "total_invoiced": 45000.00,
      "total_collected": 42500.00,
      "outstanding": 2500.00,
      "collection_rate": 94.44
    },
    "by_vehicle_type": [
      {
        "vehicle_type": "Sedan",
        "revenue": 20000.00,
        "percentage": 44.44
      }
    ]
  }
}
```

### 9.2 Outstanding Invoices Report

```http
GET /reports/outstanding-invoices?agency_id=uuid
Authorization: Bearer {token}
```

### 9.3 Fleet Utilization Report

```http
GET /reports/fleet-utilization?start_date=2026-05-01&end_date=2026-05-31
Authorization: Bearer {token}
```

---

## 10. WebSocket Events

### 10.1 Connect to Real-time Updates

```javascript
const ws = new WebSocket('wss://api.locacar.com/ws?token=<jwt_token>');

ws.onopen = () => {
  // Subscribe to vehicle location updates
  ws.send(JSON.stringify({
    action: 'subscribe',
    type: 'vehicle_location',
    vehicle_id: 'uuid'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'vehicle_location_updated') {
    console.log(message.data);
  }
};
```

### 10.2 Event Types

| Event | Data | Frequency |
|-------|------|-----------|
| vehicle_location_updated | GPS coordinates, speed | Every 30 seconds |
| vehicle_status_changed | New status, reason | On change |
| contract_completed | Contract details | On completion |
| invoice_created | Invoice details | On creation |
| payment_received | Payment details | On recording |

---

## 11. Rate Limiting

API requests are rate-limited per user/agency:

- **Standard Users**: 100 requests/minute
- **Premium Users**: 1000 requests/minute
- **Admin**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1620000000
```

---

## 12. Error Codes

| Code | Meaning | HTTP Status |
|------|---------|------------|
| INVALID_CREDENTIALS | Login failed | 401 |
| TOKEN_EXPIRED | JWT token expired | 401 |
| INVALID_TOKEN | Malformed JWT | 401 |
| PERMISSION_DENIED | User lacks permission | 403 |
| NOT_FOUND | Resource not found | 404 |
| DUPLICATE_ENTRY | Duplicate record | 409 |
| VALIDATION_ERROR | Input validation failed | 400 |
| INSUFFICIENT_FUNDS | Not enough balance | 400 |
| VEHICLE_NOT_AVAILABLE | Vehicle is rented/maintenance | 400 |
| SERVER_ERROR | Internal error | 500 |

---

**Document Version**: 1.0.0  
**Last Updated**: May 2026  
**Next Review**: June 2026
