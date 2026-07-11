<!--
Sync Impact Report:
- Version change: [None] → 1.0.0
- List of modified principles: Initialized Principles 1 through 7 based on user specifications and stakeholder documents.
- Added sections: 
  - 1. Architecture & Module Boundaries
  - 2. Security & Compliance
  - 3. Code Quality & Maintainability
  - 4. Testing & Definition of Done
  - 5. Team Collaboration Process
  - 6. Spec-Kit Traceability
  - 7. Always-Applicable Non-Functional Constraints
- Removed sections: Placeholder sections from the template.
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
LifeLine MUST be built as a Modular Monolith (Node.js Core) with one companion Python AI/ML service (FastAPI). The two services MUST communicate internally via API only. The AI service MUST NEVER be exposed directly to the public internet. Each Functional Group (FG) owns its own module (routes/controllers/services/models) and MUST NEVER write directly cross-module into another module's entities. MongoDB Atlas MUST be the single system of record, utilizing a 2dsphere geo-index for map/SOS capabilities and Atlas Vector Search for the RAG chatbot. Any latency-sensitive flow (especially SOS requests) MUST go through an asynchronous job queue (BullMQ/Redis) to decouple acceptance (≤5s), evaluation (≤30s), and notification (≤1min) into independent pipeline stages.
*(Citations: SystemArchitecture.md §1, §2, §4, §5; ProjectPlan.md §4.4)*

### 2. Security & Compliance
The platform MUST enforce HTTPS/TLS system-wide (NFR-STD-02). Role-Based Access Control (RBAC) MUST be implemented for Donor, Blood Center Staff, Hospital Staff, and Administrator roles. All passwords MUST be hashed using bcrypt. JWT sessions MUST expire after 30 minutes of inactivity (NFR-S-05). CCCD (Citizen ID) and medical/screening data MUST be accessible only to authorized users, MUST comply with Vietnam's Personal Data Protection Decree (NFR-STD-01), and MUST NEVER be logged in plaintext (including raw QR payloads). Every SOS request, account change, permission update, and system-configuration action MUST be written to an immutable, append-only audit log (NFR-S-04). Secrets MUST NEVER be committed to the repository and MUST be managed via the hosting provider's environment variables (adhering to the zero-budget constraint).
*(Citations: SystemArchitecture.md §3.2, §3.5; CodingConventions.md §5; vision.md §6)*

### 3. Code Quality & Maintainability
Code MUST adhere strictly to the naming conventions per language and artifact type specified in CodingConventions.md §2 (e.g., camelCase for JS, snake_case for Python, PascalCase for classes/React/Mongoose, UPPER_SNAKE_CASE for constants, kebab-case for REST endpoints). Developers MUST use the exact original business terminology from the Use-Case Spec (e.g., SOSRequest, ETicket, ScreeningForm, DigitalDonorRecord, bloodType) and MUST NEVER invent synonyms. Commits MUST follow Conventional Commits and reference the UC-ID. ESLint/Prettier (JS, via Husky pre-commit hook) and Ruff/Black (Python) are MANDATORY. Runtime data validation MUST be implemented via Zod/Joi at every route in place of static typing. Centralized error handling MUST return a consistent JSON error shape (`{ code, message, details }`), with NO silent catch blocks. Structured logging (pino/logging) MUST be used, and passwords, full CCCD numbers, or raw QR payloads MUST NEVER be logged.
*(Citations: CodingConventions.md §2, §5)*

### 4. Testing & Definition of Done
The Node.js Core MUST be tested using Jest, with at least 1 unit test per module's core business rule (e.g., the 84-day rule, duplicate-booking prevention). The AI service MUST be tested using Pytest. A use case is ONLY considered "Done" when: (1) it lives in the correct module location with correct naming conventions, (2) the Basic Flow AND documented Alternative Flows are implemented (or explicitly deferred with a linked issue), (3) unit tests cover the rules referenced in Special Requirements, (4) the PR has been approved by ≥1 reviewer and merged into develop, and (5) the corresponding Spec-Kit spec.md/tasks.md artifact has been updated.
*(Citations: CodingConventions.md §5, §6)*

### 5. Team Collaboration Process
As a 5-person full-stack team with no dedicated DevOps/QA role, a 13-week timeline, and zero budget, the team MUST use free-tier/open-source tools only. A simplified Git Flow MUST be followed (`main`/`develop`/`feature`/`bugfix`/`hotfix`/`docs`), with feature branches named `feature/<UC-ID>-<short-desc>`. PRs MUST require a passing build, passing CI (lint+test), and ≥1 reviewer approval before merge. Cross-module PRs MUST require review from the owner of each affected module. As a monorepo, CI MUST use path filters so the Python job only runs when files under `src/ai-service/**` change.
*(Citations: CodingConventions.md §1, §3, §4, §7; ProjectPlan.md §2.2, §4.1)*

### 6. Spec-Kit Traceability
Every module, branch, commit, and PR MUST be traceable back to the correct UC-ID defined in UseCaseSpec.md. Spec-Kit-generated artifacts (spec.md/plan.md/tasks.md) MUST live under `src/specs/<UC-ID>/` and be kept separate from the `docs/` folder. Furthermore, this constitution file (`.specify/memory/constitution.md`) is strictly Spec-Kit-managed—developers MUST edit `SystemArchitecture.md` and `CodingConventions.md` and then regenerate the constitution via Spec-Kit, rather than hand-editing constitution.md directly.
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

**Version**: 1.0.0 | **Ratified**: 2026-07-11 | **Last Amended**: 2026-07-11
