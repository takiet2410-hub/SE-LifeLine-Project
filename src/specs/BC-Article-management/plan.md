# Implementation Plan: Article Management (BC-Article-management)

**Feature**: Article Management  
**Feature Branch**: `feature/BC-UC-08-09-article-management`  
**Feature IDs**: BC-UC-08, BC-UC-09  
**Status**: Draft Implementation Plan  

---

## 1. Implementation Goal

Deliver the complete feature implementation for **Article Management** covering article creation, drafting, publishing, unpublishing, listing with dashboard metrics and numbered pagination (12 articles/page), pre-filled editing, direct status toggling (`Draft` ↔ `Published`), and soft deletion.

---

## 2. Architecture Alignment

- **Module**: `src/backend-core/src/modules/content-news` (or `article-management`)
- **Shared Packages**: `src/backend-core/src/shared` (Zod schemas, response formatters, RBAC middleware, audit logger)
- **Frontend Pages**: `src/frontend/src/pages/content-management/ArticleList.tsx`, `ArticleForm.tsx`
- **Traceability**: BC-UC-08, BC-UC-09

---

## 3. Implementation Phases

### Phase 1 — Data Model & Validation
1. Verify / register Zod schema for `Article` entity in shared validation packages.
2. Implement backend DTOs and types for `CreateArticleDto`, `UpdateArticleDto`, `ArticleFilterDto` (including `page`, `limit`).
3. Support fields: `title`, `bodyContent`, `category`, `status` (`Draft | Published`), `targetAudience`, `featuredMediaUrl`.

### Phase 2 — Backend APIs & Service Layer
1. Implement route handlers under `/api/v1/articles`:
   - `POST /api/v1/articles` (Create / Publish)
   - `GET /api/v1/articles` (List with stats, pagination `page`, `limit` [default 12])
   - `GET /api/v1/articles/stats` (Dashboard metric summary)
   - `GET /api/v1/articles/:id` (Retrieve single article)
   - `PATCH /api/v1/articles/:id` (Edit / Toggle status)
   - `DELETE /api/v1/articles/:id` (Soft delete)
2. Enforce RBAC middleware for `Staff` and `Admin` roles.
3. Integrate audit logger for all write and delete actions (`ARTICLE_CREATED`, `ARTICLE_UPDATED`, `ARTICLE_UNPUBLISHED`, `ARTICLE_DELETED`).
4. Implement `POST /api/v1/articles/upload-media` (multipart/form-data, Cloudinary integration, folder `lifeline/articles`), scoped exclusively to the Article module — do not extract into a shared module at this time.

### Phase 3 — Frontend Dashboard & Forms
1. Build `ArticleList` screen:
   - Dashboard stat widgets (`Total Articles`, `Public Reach`, `Active Alerts`).
   - Category color badges, status pills (`Published`, `Draft`), author info, view counts.
   - Action dropdown menu (`Edit`, `Delete`) and confirm deletion modal.
   - Implement numbered pagination component (page size: 12) below the article grid, syncing page state with URL query params (`?page=`) and preserving active filters.
2. Build `ArticleForm` screen:
   - Form controls for Title, Content, Category, Target Audience multi-select, Status toggle (`Draft` / `Published`).
   - Image drag-and-drop file uploader (recommended 1200x630px, PNG/JPG, <=5MB).
   - Wire the Featured Media drag-and-drop uploader to call `POST /api/v1/articles/upload-media`, then set the returned `url` as `featuredMediaUrl` in the form state.
   - Auto-save timer hook for `Draft` status (every 30s).
   - Editor Tip guide card.

### Phase 4 — Testing & Verification
1. Unit tests for Zod validation, service business logic (audience requirements for Published, direct status toggle, pagination limit/page calculations, soft delete).
2. Component tests for Article Form validation, status toggling, and Pagination component.
3. End-to-end flow verification from Creation to Unpublishing, Page Navigation, and Deletion.

---

## 4. Review Checklist

- [ ] All inputs validated via Zod at controller boundary.
- [ ] At least 1 target audience required when status is `Published`.
- [ ] Direct status toggle (Published ↔ Draft) immediately updates visibility without separate approval step.
- [ ] Numbered pagination works at 12 items/page and preserves filter state across page changes.
- [ ] Soft deletion updates dashboard stats in real-time and handles page redirection if current page becomes empty.
- [ ] Audit logs captured for creation, status toggle, edit, and soft delete events (`ARTICLE_CREATED`, `ARTICLE_UPDATED`, `ARTICLE_UNPUBLISHED`, `ARTICLE_DELETED`).
