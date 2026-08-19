# Technical Research: Article Management (BC-UC-08, BC-UC-09, Delete Article)

**Feature Path**: `specs/BC-UC-08-09-content-management`

---

## 1. Rich Text Content & Image Storage Strategy

### Decision
- **Content Storage**: Store body content as sanitized HTML string (`string` type in MongoDB).
- **Featured Image Upload**: Use Multer on Node.js backend to upload PNG/JPG cover images (max 5MB) directly to Cloudinary storage, returning a secure HTTPS Cloudinary URL stored in `coverImageUrl`.

### Rationale
- Storing sanitized HTML allows seamless rendering in React frontend and API responses while maintaining rich-text formatting (bold, italic, headers, bullet lists).
- Reuses existing Cloudinary utility pattern (`src/backend-core/src/utils/cloudinary.util.ts`) already used across the codebase for asset uploads.

---

## 2. Autosave & Publishing Schedule Mechanics

### Decision
- **Autosave**: Client-side debounced save (3 seconds after last keystroke or every 60s) calling `PUT /api/v1/bc/articles/:articleId` with status `'Draft'`.
- **Publishing Schedule**: If `scheduledAt` is provided in a `Scheduled` article, a lightweight background job (or query middleware check on GET public endpoints) transitions articles whose `scheduledAt <= now()` from `Scheduled` to `Published`.

### Rationale
- Debounced auto-save prevents lost draft work while avoiding database spam.
- Simple date-comparison query middleware ensures scheduled articles become visible immediately when their scheduled time passes without requiring external heavy cron dependencies.

---

## 3. Analytics & Performance Tracking

### Decision
- Store performance metrics directly on the `Article` document (`viewsCount`, `publicReachCount`, `sharesCount`).
- `GET /api/v1/bc/articles/:articleId` increments `viewsCount` (when called by public actors) and returns computed engagement comparisons (e.g. comparing view count against average views of articles created in the last 30 days).

### Rationale
- Direct metric fields on `Article` enable fast read queries for the Content Management dashboard and Performance Panel without complex aggregation pipelines on every request.

---

## 4. Delete & Un-publish Atomicity

### Decision
- When an article is deleted (`DELETE /api/v1/bc/articles/:articleId`), the document is removed from MongoDB, an immutable `AuditLog` entry (`action: "DELETE_ARTICLE"`) is created, and any public caching indexes are invalidated immediately.

### Rationale
- Guarantees immediate un-publishing so deleted articles return HTTP 404 across all public donor/hospital endpoints instantly.
