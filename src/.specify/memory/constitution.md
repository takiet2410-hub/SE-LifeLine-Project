<!--
Sync Impact Report:
- Version change: 1.0.0 → 2.0.0
- List of modified principles: 
  - 1. Architecture & Module Boundaries (Added TS strict mode, internal service token, high-priority queue lane)
  - 2. Security & Compliance (Added QR e-ticket cryptographic signing, JWT token details)
  - 3. Code Quality & Maintainability (Redefined to require TypeScript strict mode, z.infer, tsc --noEmit, Pydantic)
  - 4. Testing & Definition of Done (Added ts-jest)
  - 5. Team Collaboration Process (Added tsc --noEmit to CI checks, explicit team setup constraints)
  - 6. Spec-Kit Traceability (Clarified UC-ID prefixes)
  - 7. Always-Applicable Non-Functional Constraints (No major changes)
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (⚠ pending)
  - .specify/templates/spec-template.md (⚠ pending)
  - .specify/templates/tasks-template.md (⚠ pending)
  - .specify/templates/commands/*.md (⚠ pending)
- Follow-up TODOs: None.
-->

# LifeLine Constitution

## Core Principles

### 1. Architecture & Module Boundaries
LifeLine MUST be built as a Modular Monolith (Node.js Core, TypeScript strict mode) with one companion Python AI/ML service (FastAPI). The two services MUST communicate internally via API only (internal service token / mTLS). The AI service MUST NEVER be exposed directly to the public internet. Each Functional Group (FG) owns its own module (routes/controllers/services/models) and MUST NEVER write directly cross-module into another module's entities. MongoDB Atlas MUST be the single system of record, utilizing a 2dsphere geo-index for map/SOS capabilities and Atlas Vector Search for the RAG chatbot. Any latency-sensitive flow (especially SOS requests) MUST go through an asynchronous job queue (BullMQ/Redis) to decouple acceptance (≤5s), evaluation (≤30s), and notification (≤1min) into independent, distinctly-timed pipeline stages. SOS notifications MUST use a separate high-priority queue lane that bypasses standard rate limits rather than a duplicated code path.
*(Citations: SystemArchitecture.md §1, §2, §4, §5; ProjectPlan.md §4.4)*

### 2. Security & Compliance
The platform MUST enforce HTTPS/TLS system-wide (NFR-STD-02). Role-Based Access Control (RBAC) MUST be implemented for Donor, Blood Center Staff, Hospital Staff, and Administrator roles. All passwords MUST be hashed using bcrypt, with JWT (access + refresh) sessions expiring after 30 minutes of inactivity. QR e-tickets MUST be cryptographically signed (Ed25519/ECDSA) to prevent forgery. CCCD (Citizen ID) and medical/screening data MUST be accessible only to authorized users, MUST comply with Vietnam's Personal Data Protection Decree (NFR-STD-01), and MUST NEVER be logged in plaintext (including raw QR payloads). Every SOS request, account change, permission update, and system-configuration action MUST be written to an immutable, append-only audit log. Secrets MUST NEVER be committed to the repository (`.env.example` checked in, real `.env` gitignored) and MUST be managed via the hosting provider's environment variables (adhering to the zero-budget constraint precluding a dedicated secrets manager).
*(Citations: SystemArchitecture.md §3.2, §3.5; CodingConventions.md §5; vision.md §6)*

### 3. Code Quality & Maintainability
Code MUST adhere strictly to the naming conventions per language and artifact type specified in CodingConventions.md §2 (e.g., camelCase/snake_case/PascalCase/UPPER_SNAKE_CASE/kebab-case). Developers MUST use the exact original business terminology from the Use-Case Spec (e.g., SOSRequest, ETicket, ScreeningForm, DigitalDonorRecord, bloodType) and MUST NEVER invent synonyms. Commits MUST follow Conventional Commits and reference the UC-ID. ESLint (+@typescript-eslint) + Prettier (JS/TS, via Husky pre-commit hook) and Ruff/Black (Python) are MANDATORY. The confirmed stack is TypeScript (strict: true) on both the Node.js core and React frontend, with shared types living in a common `types/` package, and `tsc --noEmit` as a required CI check. Runtime input validation via Zod/Joi at every route boundary is complementary to (not a substitute for) TypeScript, and TypeScript types MUST be derived from Zod schemas via `z.infer` so compile-time types and runtime validators never drift apart. Pydantic models MUST be used on the FastAPI AI service. Centralized error handling MUST return a consistent JSON error shape (`{ code, message, details }`), with NO silent catch blocks. Structured logging (pino/logging) MUST be used, and passwords, full CCCD numbers, or raw QR payloads MUST NEVER be logged.
*(Citations: CodingConventions.md §2, §5)*

### 4. Testing & Definition of Done
The Node.js Core MUST be tested using Jest + ts-jest, with at least 1 unit test per module's core business rule (e.g., the 84-day rule, duplicate-booking prevention). The AI service MUST be tested using Pytest. A use case is ONLY considered "Done" when: (1) it lives in the correct module location with correct naming conventions, (2) the Basic Flow AND documented Alternative Flows are implemented (or explicitly deferred with a linked issue), (3) unit tests cover the rules referenced in Special Requirements, (4) the PR has been approved by ≥1 reviewer and merged into develop, and (5) the corresponding Spec-Kit spec.md/tasks.md artifact has been updated or regenerated.
*(Citations: CodingConventions.md §5, §6)*

### 5. Team Collaboration Process
As a 5-person full-stack team with no dedicated DevOps role (QA/testing is a named responsibility of one lead but all members contribute across every phase), a 13-week/5-sprint timeline (25 May–23 Aug 2026), and zero budget, the team MUST use free-tier/open-source tools only. A simplified Git Flow MUST be followed (`main`/`develop`/`feature`/`bugfix`/`hotfix`/`docs`), with feature branches named `feature/<UC-ID>-<short-desc>`. PRs MUST require a passing build, passing CI (lint+test+tsc --noEmit), and ≥1 reviewer approval before merge. Cross-module PRs MUST require review from the owner of each affected module. As a monorepo (frontend/backend-core/ai-service share one repo), CI MUST use path filters so the Python job only runs when files under `src/ai-service/**` change.
*(Citations: CodingConventions.md §1, §3, §4, §7; ProjectPlan.md team roles table, §2.2, §4.1)*

### 6. Spec-Kit Traceability
Every module, branch, commit, and PR MUST be traceable back to the correct UC-ID in UseCaseSpec.md (across all prefixes: LL, BC, NF, HS, SYS, NT, DN, AD, CB, CM, SOS). Spec-Kit-generated artifacts (spec.md/plan.md/tasks.md) MUST live under `src/specs/<UC-ID>/`, kept separate from the `docs/` folder. Furthermore, this constitution file (`.specify/memory/constitution.md`) is strictly Spec-Kit-managed—humans edit `SystemArchitecture.md` and `CodingConventions.md` and then regenerate the constitution via Spec-Kit, rather than hand-editing constitution.md directly.
*(Citations: CodingConventions.md §1, §3)*

### 7. Always-Applicable Non-Functional Constraints
The platform MUST adhere to the following non-negotiable NFRs from vision.md:
- **Performance**: SOS requests MUST be accepted within ≤5s (NFR-P-01), evaluated within ≤30s (NFR-P-02), and notifications delivered within ≤1 minute (NFR-P-03). The system MUST support 10,000 registered users and 10 concurrent users (NFR-P-04). Pages MUST load within ≤3s for 95% of requests (NFR-P-05).
- **Reliability**: Uptime MUST be ≥99.5% (NFR-R-01). Automated daily backups MUST be configured (NFR-R-02). Recovery from failure MUST occur within ≤30 minutes (NFR-R-03). SOS records MUST NEVER be lost (NFR-R-04).
- **Usability**: The application MUST be responsive on desktop/tablet/mobile (NFR-U-01), bilingual (English-Vietnamese, NFR-U-02), and ensure emergency alerts are visually distinguishable from routine notifications (NFR-U-03). It MUST support Chrome, Edge, Firefox, and Safari (NFR-U-04).
- **Applicable Standards**: Compliance with the Personal Data Protection Decree for CCCD/medical data (NFR-STD-01), HTTPS/TLS system-wide (NFR-STD-02), ISO 8601 date/time formats (NFR-STD-03), versioned REST API at `/api/v1` (NFR-STD-04), and WCAG 2.1 Level AA (NFR-STD-05).
*(Citations: vision.md §6; SystemArchitecture.md §1, §5)*

## Governance
The LifeLine Constitution supersedes all other undocumented practices. Amendments to project governance require updating the foundational stakeholder documents (`SystemArchitecture.md`, `CodingConventions.md`) and subsequently regenerating this constitution using Spec-Kit. All PRs and reviews MUST verify compliance with these core principles. Any deviation or added complexity MUST be explicitly justified in PR descriptions.

**Version**: 2.0.0 | **Ratified**: 2026-07-11 | **Last Amended**: 2026-07-17
