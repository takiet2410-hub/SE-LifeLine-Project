# Data Model: Admin Management System (AD-UC-01 → AD-UC-06)

## 1. Mongoose Schemas & Collections

### 1.1 User Entity (`users` collection)
- `_id`: ObjectId
- `email`: String (Unique, Indexed)
- `fullName`: String
- `role`: Enum (`Administrator`, `HospitalStaff`, `Donor`, `Volunteer`)
- `phone`: String
- `hospitalId`: ObjectId (Ref `Hospital`, Optional)
- `isDeleted`: Boolean (Default `false`, Indexed)
- `createdAt`: Date
- `updatedAt`: Date

### 1.2 Role Entity (`roles` collection)
- `_id`: ObjectId
- `name`: Enum (`Administrator`, `HospitalStaff`, `Donor`, `Volunteer`) (Unique)
- `description`: String
- `permissions`: Array of Strings (e.g., `["user:read", "user:write", "config:manage"]`)
- `updatedAt`: Date

### 1.3 ActivityLog Entity (`activity_logs` collection)
- `_id`: ObjectId
- `actorId`: ObjectId (Ref `User`, Indexed)
- `actorEmail`: String
- `action`: String (Indexed)
- `targetEntity`: String
- `targetId`: String (Optional)
- `details`: Object / Mixed
- `ipAddress`: String
- `timestamp`: Date (Default `Date.now`, Indexed)

### 1.4 SystemConfig Entity (`system_configs` collection)
- `_id`: ObjectId
- `key`: String (Unique, Indexed)
- `value`: Mixed (String, Number, Boolean, Object)
- `category`: String (`SLA`, `Notification`, `Limits`, `General`)
- `description`: String
- `updatedBy`: ObjectId (Ref `User`)
- `updatedAt`: Date

### 1.5 FeatureToggle Entity (`feature_toggles` collection)
- `_id`: ObjectId
- `key`: String (Unique, Indexed)
- `name`: String
- `description`: String
- `enabled`: Boolean (Default `false`, Indexed)
- `targetedRoles`: Array of Strings
- `updatedBy`: ObjectId (Ref `User`)
- `updatedAt`: Date

---

## 2. Validation & Indexing Rules
- Unique composite index on `(email, isDeleted)` to prevent duplicate active users.
- Compound index on `(actorId, timestamp)` in `activity_logs` for quick audit trail lookup.
- Fast key lookup index on `system_configs.key` and `feature_toggles.key`.
