# API Contracts: Donation Booking & Location

## Authentication

All endpoints require a valid JWT access token.

```
Authorization: Bearer <access_token>
```

---

# 1. Browse Donation Locations

## Endpoint

GET `/api/v1/bookings/locations`

### Description

Retrieve nearby active donation campaigns and permanent donation locations.

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| lat | number | No | Current latitude |
| lng | number | No | Current longitude |
| radius | number | No | Search radius (km) |
| date | string | No | Donation date |
| bloodType | string | No | Required blood type |
| crowdingLevel | string | No | Low / Medium / High |

### Success Response

**200 OK**

```json
[
  {
    "id": "...",
    "name": "...",
    "location": { "lat": 10.0, "lng": 106.0 },
    "startDateTime": "...",
    "endDateTime": "..."
  }
]
```

### Error Responses

- 400 Invalid query parameters
- 401 Unauthorized

---

# 2. Create Appointment

## Endpoint

POST `/api/v1/bookings/appointments`

### Description

Create a new donation appointment.

### Request Body

```json
{
  "campaignId": "...",
  "appointmentDate": "2026-08-01",
  "timeSlot": "09:00-09:30",
  "answers": {
    "responses": [
      {
        "questionId": "1",
        "selectedOptions": ["Không"]
      }
    ]
  }
}
```

### Business Validation

- Donor authenticated
- Campaign is Active
- Capacity available
- 84-day donation rule
- No overlapping appointments

### Success Response

**201 Created**

```json
{
  "appointmentId": "...",
  "status": "Scheduled",
  "eTicketId": "...",
  "qrCode": "..."
}
```

### Error Responses

- 400 Invalid request
- 401 Unauthorized
- 403 Donor not eligible
- 404 Campaign not found
- 409 Slot unavailable

---

# 3. View Appointment Details

## Endpoint

GET `/api/v1/bookings/appointments/{id}`

### Description

Retrieve appointment details.

### Success Response

**200 OK**

```json
{
  "appointmentId": "...",
  "campaign": {},
  "status": "Scheduled",
  "screeningForm": {},
  "eTicket": {}
}
```

### Error Responses

- 401 Unauthorized
- 404 Appointment not found

---

# 4. Cancel Appointment

## Endpoint

PATCH `/api/v1/bookings/appointments/{id}/cancel`

### Description

Cancel a future appointment.

### Business Validation

- Appointment exists
- Appointment belongs to donor
- Cancellation deadline not exceeded

### Success Response

**200 OK**

```json
{
  "status": "Cancelled"
}
```

### Error Responses

- 401 Unauthorized
- 403 Cancellation deadline exceeded
- 404 Appointment not found

---

# 5. Download E-ticket

## Endpoint

GET `/api/v1/bookings/appointments/{id}/e-ticket`

### Description

Download appointment E-ticket.

### Success Response

**200 OK**

PDF file

or

Signed download URL

### Error Responses

- 401 Unauthorized
- 404 Ticket not found