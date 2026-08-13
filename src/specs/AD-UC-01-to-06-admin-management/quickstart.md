# Quickstart Validation Guide: Admin Management System

## Prerequisites
1. Node.js v18+ and MongoDB running locally or via `MONGODB_URI`.
2. Admin account seeded or existing (Role: `Administrator`).

## Setup & Running
1. Backend: `cd src/backend-core && npm run dev`
2. Frontend: `cd src/frontend && npm run dev`

---

## Validation Scenarios & cURL Commands

### 1. Get Admin Dashboard Metrics
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```
*Expected: 200 OK with total users, active drives, and metrics summary.*

### 2. List Users with Role Filter
```bash
curl -X GET "http://localhost:3000/api/admin/users?role=HospitalStaff&page=1&limit=10" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```
*Expected: 200 OK with paginated user list.*

### 3. Update Feature Toggle
```bash
curl -X PUT http://localhost:3000/api/admin/toggles/enable_ai_matching \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```
*Expected: 200 OK with updated toggle state.*

### 4. Fetch System Audit Logs
```bash
curl -X GET "http://localhost:3000/api/admin/logs?page=1&limit=20" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```
*Expected: 200 OK with log entries.*
