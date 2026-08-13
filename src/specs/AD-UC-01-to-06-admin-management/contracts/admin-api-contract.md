# API Contract: Admin Management System (AD-UC-01 → AD-UC-06)

**Feature Branch**: `AD-UC-01-to-06-admin-management`  
**Spec**: [spec.md](../spec.md)

---

## Security Requirement
All endpoints below require header: `Authorization: Bearer <JWT>`  
Authenticated user role MUST be `Administrator`. Non-admin requests return `403 Forbidden`.

---

## 1. User Management Endpoints (AD-UC-01, AD-UC-02)

### 1.1 List Users
- **Method**: `GET`
- **Path**: `/api/admin/users`
- **Query Params**: `page`, `limit`, `role`, `search`, `status`
- **Response (200 OK)**:
```json
{
  "users": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c001",
      "email": "staff@hospital.org",
      "fullName": "Le Van B",
      "role": "HospitalStaff",
      "phone": "0912345678",
      "hospitalId": "65f1a2b3c4d5e6f7a8b9c099",
      "isDeleted": false,
      "createdAt": "2026-08-01T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

### 1.2 Create User
- **Method**: `POST`
- **Path**: `/api/admin/users`
- **Request Body**:
```json
{
  "email": "newadmin@lifeline.org",
  "fullName": "Tran Van C",
  "role": "Administrator",
  "phone": "0988776655"
}
```
- **Response (201 Created)**: User object

### 1.3 Soft Delete User
- **Method**: `DELETE`
- **Path**: `/api/admin/users/:userId`
- **Response (200 OK)**: `{"message": "User soft deleted successfully"}`

---

## 2. Roles & Permissions (AD-UC-03)

### 2.1 Update Role Permissions
- **Method**: `PUT`
- **Path**: `/api/admin/roles/:roleId/permissions`
- **Request Body**:
```json
{
  "permissions": ["user:read", "user:write", "event:read"]
}
```
- **Response (200 OK)**: Updated role document

---

## 3. Monitoring & Logs (AD-UC-04)

### 3.1 Get Dashboard Metrics
- **Method**: `GET`
- **Path**: `/api/admin/dashboard`
- **Response (200 OK)**:
```json
{
  "totalUsers": 1250,
  "activeDrives": 8,
  "urgentRequests": 3,
  "systemStatus": "Healthy"
}
```

---

## 4. System Config & Feature Toggles (AD-UC-05, AD-UC-06)

### 4.1 Update Toggle
- **Method**: `PUT`
- **Path**: `/api/admin/toggles/:key`
- **Request Body**: `{"enabled": true}`
- **Response (200 OK)**: Updated toggle object
