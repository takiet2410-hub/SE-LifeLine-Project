# Implementation Tasks: Article Management (BC-Article-management)

**Feature IDs**: BC-UC-08, BC-UC-09

---

## Phase 1 – Data & Foundation

- [ ] Extend / verify `Article` entity schema and TypeScript types matching `DatabaseSchema.md` §2.13 (status enum: `Draft | Published`). [BC-UC-08][BC-UC-09]
- [ ] Define Zod validation schemas for `CreateArticleDto` and `UpdateArticleDto`. [BC-UC-08][BC-UC-09]
- [ ] Register routes under `/api/v1/articles`. [BC-UC-08][BC-UC-09]

---

## Phase 2 – Backend Endpoints & Logic

### Create & Publish (BC-UC-08)
- [ ] Implement `POST /api/v1/articles` controller & service. [BC-UC-08]
- [ ] Add validation rule: Title required (`"Title is required"` error). [BC-UC-08]
- [ ] Add validation rule: At least one Target Audience (`Donors`, `Staff`, `Hospitals`) required for `Published` status. [BC-UC-08]
- [ ] Implement immediate publishing logic (`status = Published`). [BC-UC-08]
- [ ] Implement auto-save draft endpoint `POST /api/v1/articles/auto-save`. [BC-UC-08]
- [ ] Install `cloudinary`, `multer`, `@types/multer` dependencies (Article module only, do not modify campaign-management). [BC-UC-08]
- [ ] Configure Cloudinary client using env vars `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. [BC-UC-08]
- [ ] Implement `POST /api/v1/articles/upload-media` controller & service, validating file type/size (PNG/JPG, max 5MB) and uploading to Cloudinary folder `lifeline/articles`. [BC-UC-08]
- [ ] Add Swagger documentation for the upload endpoint (`@ApiConsumes('multipart/form-data')`, `@ApiBody` binary schema, all response codes). [BC-UC-08]

### View, Edit & Delete (BC-UC-09)
- [ ] Implement `GET /api/v1/articles` for paginated list and filter by category/status. [BC-UC-09]
- [ ] Implement pagination support in `GET /api/v1/articles` (query params: `page`, `limit`, default `limit=12`), returning total count and total pages in the response metadata. [BC-UC-09]
- [ ] Implement `GET /api/v1/articles/stats` for dashboard metrics (Total Articles, Public Reach, Active Alerts). [BC-UC-09]
- [ ] Implement `GET /api/v1/articles/:id` for pre-filling edit form. [BC-UC-09]
- [ ] Implement `PATCH /api/v1/articles/:id` for editing existing records and toggling status (`Draft` ↔ `Published`). [BC-UC-09]
- [ ] Implement direct unpublishing logic: setting status back to Draft immediately removes article from live listings without extra approval. [BC-UC-09]
- [ ] Implement `DELETE /api/v1/articles/:id` soft deletion (`deletedAt` set). [BC-UC-09]

---

## Phase 3 – Frontend Component & UI Integration

- [ ] Build Article List page with dashboard stat cards (Total Articles, Public Reach, Active Alerts). [BC-UC-09]
- [ ] Render article cards with color-coded Category badges, Author info, Status pills (`Published`, `Draft`), View counts, and `⋮` action menu. [BC-UC-09]
- [ ] Build numbered Pagination component (12 items/page) and wire it to the Article List query, syncing with URL `?page=` param. [BC-UC-09]
- [ ] Implement Delete confirmation modal overlay ("Are you sure you want to delete this article?"). [BC-UC-09]
- [ ] Build Article Create / Edit form with Title, Content editor, Category dropdown, Target Audience checkboxes, and Status toggle (`Draft` / `Published`). [BC-UC-08][BC-UC-09]
- [ ] Implement drag-and-drop Featured Media uploader with resolution (1200x630px) and file size (5MB) guidelines. [BC-UC-08]
- [ ] Wire Featured Media drag-and-drop uploader in ArticleForm to call the upload endpoint and populate `featuredMediaUrl` with the returned URL. [BC-UC-08]
- [ ] Implement auto-save periodic hook (30s) displaying "Auto-saved X minutes ago". [BC-UC-08]
- [ ] Display Editor Tip info card. [BC-UC-08]

---

## Phase 4 – Security, Audit Logging & Testing

- [ ] Apply RBAC middleware restricting article endpoints to `Staff` and `Admin`. [BC-UC-08][BC-UC-09]
- [ ] Emit audit log entries for `ARTICLE_CREATED`, `ARTICLE_UPDATED`, `ARTICLE_UNPUBLISHED`, and `ARTICLE_DELETED`. [BC-UC-08][BC-UC-09]
- [ ] Add unit tests for Zod schemas, service logic, pagination logic, and status transition rules. [BC-UC-08][BC-UC-09]
- [ ] Add unit/integration tests for upload endpoint: valid image success, invalid file type rejection, oversized file rejection. [BC-UC-08]
- [ ] Add integration tests for API endpoints, pagination, and soft deletion stat recalculation. [BC-UC-08][BC-UC-09]
