# Quickstart & Validation Guide: Campaign Management Module

## Prerequisites

- Node.js >= 18
- Running MongoDB instance or local memory server
- `backend-core` environment variables initialized (`.env` file)

## Verification Scenarios

### Scenario 1: Create a New Donation Campaign (BC-UC-02)

Execute HTTP POST to create a campaign:

```bash
curl -X POST http://localhost:3000/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VALID_JWT>" \
  -d '{
    "name": "District 1 Blood Drive",
    "venue": "Hospital A",
    "fullAddress": "123 Main St, Ward 1, District 1, HCMC",
    "startDateTime": "2026-09-01T08:00:00.000Z",
    "endDateTime": "2026-09-01T17:00:00.000Z",
    "targetBloodGroups": ["A+", "O-"],
    "capacity": 150,
    "targetUnitsGoal": 100,
    "contactPerson": {
      "name": "Staff Lead",
      "phone": "0987654321"
    }
  }'
```

**Expected Outcome**: Returns HTTP 201 Created with auto-generated `campaignCode` (e.g. `CMP-2026-001`) and initial `status: "Upcoming"`.

---

### Scenario 2: Retrieve Filtered Campaign List (BC-UC-01)

Execute HTTP GET with query filters:

```bash
curl -X GET "http://localhost:3000/api/v1/campaigns?page=1&limit=10&location=Hospital&status=Upcoming"
```

**Expected Outcome**: Returns HTTP 200 OK with `data` array containing matching campaigns, including `capacityProgress` object (`registered`, `total`, `percentage`), and `pagination` metrics.

---

### Scenario 3: View Campaign Details & Validation Guard (BC-UC-03)

1. View campaign details:
```bash
curl -X GET http://localhost:3000/api/v1/campaigns/<CAMPAIGN_ID>
```
**Expected Outcome**: Returns HTTP 200 OK with full campaign details, `capacityProgress`, and `registrationPerformance`.

2. Attempt invalid capacity reduction (below registered donors):
```bash
curl -X PUT http://localhost:3000/api/v1/campaigns/<CAMPAIGN_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <VALID_JWT>" \
  -d '{
    "capacity": 0
  }'
```
**Expected Outcome**: Returns HTTP 400 Bad Request with error code `VALIDATION_ERROR` and message indicating capacity cannot be reduced below current registered donors.
