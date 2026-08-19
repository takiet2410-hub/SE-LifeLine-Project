# Implementation Plan: Article Management (BC-UC-08, BC-UC-09, Delete Article)

**Feature Path**: `specs/BC-UC-08-09-content-management`

**Reference Specs**:
- [spec.md](spec.md)
- [research.md](research.md)
- [data-model.md](data-model.md)
- [contracts/content-api.md](contracts/content-api.md)
- [quickstart.md](quickstart.md)

---

## 1. Technical Context

- **Backend**: Node.js + Express (TypeScript strict mode) under `src/backend-core/src/modules/content/`
- **Frontend**: React + TypeScript + React Query under `src/frontend/src/modules/content-mgmt/`
- **Database**: MongoDB Atlas (`Article` entity under `articles` collection)
- **Asset Storage**: Cloudinary via Multer backend integration
- **Auth/RBAC**: JWT `authenticateJWT` + `BloodCenterStaff`/`Administrator` role check

---

## 2. Architecture & Module Structure

### 2.1 Backend Module (`src/backend-core/src/modules/content/`)
```text
src/backend-core/src/modules/content/
├── index.ts
├── controllers/
│   └── article.controller.ts
├── models/
│   └── article.model.ts
├── routes/
│   └── article.routes.ts
├── schemas/
│   └── article.schema.ts
└── services/
    └── article.service.ts
```

### 2.2 Frontend Module (`src/frontend/src/modules/content-mgmt/`)
```text
src/frontend/src/modules/content-mgmt/
├── pages/
│   ├── ArticleListPage.tsx
│   ├── CreateArticlePage.tsx
│   └── ArticleDetailPage.tsx
├── components/
│   ├── ArticleCard.tsx
│   ├── ArticleForm.tsx
│   ├── PerformancePanel.tsx
│   ├── DeleteConfirmationModal.tsx
│   ├── TargetAudienceSelector.tsx
│   └── PublishingSchedulePicker.tsx
├── services/
│   └── articleApi.ts
├── hooks/
│   └── useArticles.ts
└── types/
    └── article.types.ts
```

---

## 3. Constitution Check & Compliance

- **Module Boundaries**: All article entities and endpoints are encapsulated in `content` backend module and `content-mgmt` frontend module. Read-only imports used for user/staff profile relations.
- **Security & RBAC**: `BloodCenterStaff` or `Administrator` authorization required for create/edit/delete routes. AuditLog created on mutations.
- **Naming Conventions**: PascalCase models/interfaces, camelCase services/controllers, kebab-case file paths.
- **Validation**: Zod runtime validation at route boundaries.
- **Testing**: Jest unit tests for `ArticleService` CRUD business logic and state transitions.

---

## 4. Phase Summary & Artifact Status

| Artifact | Location | Status |
| :--- | :--- | :--- |
| **Research** | [`research.md`](research.md) | Completed |
| **Data Model** | [`data-model.md`](data-model.md) | Completed |
| **API Contract** | [`contracts/content-api.md`](contracts/content-api.md) | Completed |
| **Quickstart** | [`quickstart.md`](quickstart.md) | Completed |
