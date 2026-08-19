# API Contracts: Donation Booking & Location

## Authentication

All protected endpoints require a valid JWT access token.

```
Authorization: Bearer <access_token>
```

---

# 1. Browse Donation Locations

## Endpoint

GET `/api/v1/bookings/locations`

### Description

Retrieve nearby active and upcoming donation campaigns and permanent donation locations.

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| lat | number | No | Current latitude |
| lng | number | No | Current longitude |
| radius | number | No | Search radius in km (default: 15) |
| date | string | No | Donation date (YYYY-MM-DD) |
| bloodType | string | No | Filter blood type (A+, B+, O+, AB+, ALL, etc.) |
| crowdingLevel | string | No | Low / Moderate / High |

### Success Response

**200 OK**

```json
[
  {
    "id": "673f123456789abcdef01234",
    "name": "Chiến dịch Hiến Máu Nhân Đạo - Bệnh viện Chợ Rẫy",
    "venue": "Bệnh viện Chợ Rẫy",
    "address": "201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM",
    "targetBloodGroups": ["A+", "B+", "O+", "ALL TYPES"],
    "timeSlots": [
      { "startTime": "07:30", "endTime": "09:00", "capacity": 20, "registeredCount": 5 },
      { "startTime": "09:00", "endTime": "10:30", "capacity": 20, "registeredCount": 12 }
    ]
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

Create a new donation appointment with pre-donation screening responses.

### Request Body

```json
{
  "campaignId": "673f123456789abcdef01234",
  "appointmentDate": "2026-08-10",
  "timeSlot": "07:30 - 09:00",
  "answers": {
    "responses": [
      {
        "questionId": "q1",
        "selectedOptions": ["Không"]
      }
    ]
  }
}
```

### Business Validation

- Donor authenticated
- Campaign is Active or Upcoming
- Capacity available
- 84-day minimum donation interval rule
- No overlapping appointments
- Timeslot has not expired on selected date

### Success Response

**201 Created**

```json
{
  "success": true,
  "data": {
    "appointmentId": "673f987654321fedcba43210",
    "status": "Scheduled",
    "screeningFormId": "673f987654321fedcba43211",
    "eTicketId": "673f987654321fedcba43212",
    "qrCode": "data:image/png;base64,..."
  }
}
```

### Error Responses

- 400 Invalid request payload
- 401 Unauthorized
- 403 Donor not eligible (84-day rule or screening REJECT)
- 404 Campaign not found
- 409 Slot unavailable or duplicate appointment

---

# 3. List Donor Appointments

## Endpoint

GET `/api/v1/bookings/appointments`

### Description

Retrieve appointment history for the authenticated donor.

### Success Response

**200 OK**

```json
[
  {
    "appointmentId": "673f987654321fedcba43210",
    "campaignName": "Chiến dịch Bệnh viện Chợ Rẫy",
    "appointmentDate": "2026-08-10",
    "timeSlot": "07:30 - 09:00",
    "status": "Scheduled",
    "createdAt": "2026-08-05T12:00:00.000Z"
  }
]
```

---

# 4. View Appointment Details

## Endpoint

GET `/api/v1/bookings/appointments/{id}`

### Description

Retrieve comprehensive appointment details including campaign, screening form, and E-ticket.

### Success Response

**200 OK**

```json
{
  "appointmentId": "673f987654321fedcba43210",
  "campaign": {
    "name": "Chiến dịch Bệnh viện Chợ Rẫy",
    "venue": "Bệnh viện Chợ Rẫy",
    "address": "201B Nguyễn Chí Thanh, Quận 5"
  },
  "appointmentDate": "2026-08-10",
  "timeSlot": "07:30 - 09:00",
  "status": "Scheduled",
  "screeningForm": {
    "outcome": "PASS"
  },
  "eTicket": {
    "ticketCode": "TK-20260810-8910",
    "qrPayloadSigned": "LL-TICKET-673f987654321fedcba43210"
  }
}
```

### Error Responses

- 401 Unauthorized
- 404 Appointment not found

---

# 5. Cancel Appointment

## Endpoint

PATCH `/api/v1/bookings/appointments/{id}/cancel`

### Description

Cancel a scheduled future appointment.

### Request Body

```json
{
  "reason": "Bận việc đột xuất"
}
```

### Business Validation

- Appointment belongs to authenticated donor
- Cancellation deadline (24 hours prior) not exceeded

### Success Response

**200 OK**

```json
{
  "success": true,
  "message": "Hủy lịch hẹn thành công",
  "data": {
    "status": "Cancelled"
  }
}
```

### Error Responses

- 401 Unauthorized
- 403 Cancellation deadline exceeded
- 404 Appointment not found

---

# 6. Download E-ticket

## Endpoint

GET `/api/v1/bookings/appointments/{id}/e-ticket`

### Description

Download appointment E-ticket PDF or retrieve QR payload.

### Success Response

**200 OK**

PDF File Stream / JSON E-ticket object.

---

# 7. Sync Appointment to BloodCenter

## Endpoint

POST `/api/v1/bookings/appointments/{id}/sync-bloodcenter`

### Description

Gửi thông tin lịch hẹn và phiếu khảo sát sức khỏe sang hệ thống quản lý Kho máu.

---

# 8. Confirm Appointment (BloodCenter Staff)

## Endpoint

POST `/api/v1/bookings/appointments/{id}/confirm`

### Description

Xác nhận đơn đăng ký hiến máu và phát hành E-ticket chính thức.

---

# 9. Reject / Defer Appointment (BloodCenter Staff)

## Endpoint

POST `/api/v1/bookings/appointments/{id}/reject`

### Description

Từ chối hoặc tạm hoãn đơn đăng ký hiến máu và gửi email tự động giải thích lý do tới người hiến máu.