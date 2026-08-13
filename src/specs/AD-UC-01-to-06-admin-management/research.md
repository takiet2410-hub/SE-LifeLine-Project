# Technical Research: Admin Management System (AD-UC-01 → AD-UC-06)

## 1. Architectural & Security Strategy

### 1.1 Role-Based Access Control (RBAC) Enforcement
All `/api/admin/*` endpoints must be strictly guarded by two Express middlewares:
1. `authenticateJWT`: Validates Bearer tokens and attaches the authenticated `user` object to the request.
2. `authorizeRoles('Administrator')`: Verifies that `req.user.role === 'Administrator'`. Rejects all unauthorized role requests with `403 Forbidden`.

### 1.2 Audit Interceptors & Compliance Logging
Administrative actions (user provisioning, role edits, configuration updates, toggle switches) MUST write an `ActivityLog` document storing:
- `actorId`: ID of the acting administrator
- `actorEmail`: Email of the administrator
- `action`: E.g., `USER_CREATE`, `USER_UPDATE`, `USER_SOFT_DELETE`, `ROLE_PERMISSIONS_UPDATE`, `SYSTEM_CONFIG_UPDATE`, `FEATURE_TOGGLE_UPDATE`
- `targetEntity`: Target collection name (`User`, `Role`, `SystemConfig`, `FeatureToggle`)
- `ipAddress`: Request IP address
- `timestamp`: UTC ISO timestamp

---

## 2. Technical Decisions

### 2.1 Soft Deletion vs Hard Deletion
- **Decision**: Soft deletion (`isDeleted: true`).
- **Rationale**: Hard deleting users destroys historical blood donation records, campaign attendance, and audit trails. Soft deletion revokes access immediately (`accountStatus: Locked` or `isDeleted: true`) while preserving relational integrity.

### 2.2 CSV Export Strategy
- **Decision**: Streamed CSV response using standard headers (`Content-Type: text/csv`, `Content-Disposition: attachment; filename="..."`).
- **Rationale**: Streaming avoids allocating huge arrays in memory for large user databases.

### 2.3 Feature Toggle Evaluation & Fallbacks
- **Decision**: In-memory caching with MongoDB backing + hardcoded fallback defaults (`false`).
- **Rationale**: Ensures feature flag lookup adds sub-millisecond overhead to endpoint execution.
