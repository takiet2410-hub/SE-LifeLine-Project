# Implementation Plan: Campaign Management Module (BC-UC-01, BC-UC-02, BC-UC-03)

**Branch**: `feature/BC-UC-01-to-03-campaign-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](file:///D:/HK3/CNPM/Code/LamLai/HyVongLamDc/SE-LifeLine-Project/src/specs/BC-UC-01-to-03-campaign-management/spec.md)

**Input**: Feature specification for BC-UC-01 (View Campaign List), BC-UC-02 (Create Donation Campaign), and BC-UC-03 (View/Edit Campaign Details + Registrations Sub-Resource).

## Summary

Implement the Campaign Management module in `backend-core` to provide RESTful endpoints for Blood Center Staff and Admin users to list, create, view, and update blood donation campaigns, as well as view campaign registrations. The module follows the project's established controller/service/model layering pattern using Express, TypeScript, Mongoose (MongoDB), Zod input validation, JWT authentication middleware, and structured error handling.

## Technical Context

**Language/Version**: Node.js Core, TypeScript 5.5 (strict mode enabled)

**Primary Dependencies**: Express 5.2, Mongoose 9.7, Zod 4.4, jsonwebtoken, swagger-jsdoc

**Storage**: MongoDB Atlas (`campaigns` collection with 2dsphere index)

**Testing**: Jest + ts-jest

**Target Platform**: Node.js REST API service (`/api/v1/campaigns`)

**Project Type**: Web service (Modular Monolith Node.js backend)

**Performance Goals**: Campaign list responses <500ms; creation/update <2s

**Constraints**: Strict additive-only design; no breaking changes or modifications to existing modules; minimum append-only wire-up in shared router (`app.ts`); capacity reduction guard (cannot reduce capacity below current registered donor count).

**Scale/Scope**: 5 endpoints (`GET /`, `POST /`, `GET /:id`, `PUT /:id`, `GET /:id/registrations`)

## Constitution Check

*GATE: All checks PASSED.*

1. **Architecture & Module Boundaries**: Additive feature placed in `src/backend-core/src/modules/campaign`. No cross-module entity mutations.
2. **Security & Compliance**: Standard JWT authentication (`authenticateJWT`) applied to creation, modification, and sub-resource endpoints.
3. **Code Quality & Maintainability**: TypeScript strict mode, Zod validation schemas (`validateRequest`), standard error format `{ code, message, details }`.
4. **Testing & Definition of Done**: Unit tests for campaign service business rules and validation logic.

## Project Structure

### Documentation (this feature)

```text
specs/BC-UC-01-to-03-campaign-management/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 technical research & decisions
├── data-model.md        # Phase 1 Mongoose schema & entity definitions
├── quickstart.md        # Phase 1 runnable validation guide
└── contracts/
    └── campaign-api-contract.md # API contract specification for all 5 endpoints
```

### Source Code (repository root)

```text
src/backend-core/src/
├── app.ts                                      # Shared express app (APPEND ONLY: import & app.use('/api/v1/campaigns', campaignRoutes))
└── modules/
    └── campaign/
        ├── __tests__/
        │   └── campaign.test.ts                # Unit tests for campaign service & validations
        ├── controllers/
        │   └── campaign.controller.ts          # Express HTTP request handlers
        ├── models/
        │   └── campaign.model.ts               # Mongoose ICampaign interface & Schema
        ├── routes/
        │   └── campaign.routes.ts              # Express router & OpenAPI annotations
        ├── schemas/
        │   └── campaign.schema.ts              # Zod validation schemas
        ├── services/
        │   └── campaign.service.ts             # Business logic, auto-generation & capacity guard
        └── index.ts                            # Barrel export file
```

**Structure Decision**: Placed inside `backend-core/src/modules/campaign`, mirroring the exact structure of existing modules (`auth-account`, `booking`).

## Complexity Tracking

*No violations. All additions follow established codebase patterns.*
