# Implementation Plan: Auth & Account Management

### Architecture overview
The `auth-account` module is a core component within the Node.js modular monolith backend (`backend-core`). It handles identity verification and session management independently. 
1. **Routes Layer**: Incoming HTTP requests hit `auth-account.routes.ts`, defining endpoints like `/api/v1/users/register` and `/api/v1/users/login`.
2. **Validation Layer**: Requests are intercepted by Zod schemas to ensure type-safety and structural validity before reaching the controller.
3. **Controller Layer**: `auth-account.controller.ts` orchestrates the HTTP response, delegates business logic to the service layer, and centrally catches any errors.
4. **Service Layer**: `auth-account.service.ts` contains the core business rules: password hashing via `bcrypt`, JWT signing/verification, OTP generation, Brevo API integration for emails, and orchestrating database interactions.
5. **Data Access Layer**: Mongoose models (`User`, `DonorProfile`) define the schema mapping to MongoDB collections, interacting directly with the database.

### Technology stack and key decisions
* **Runtime/Framework:** Node.js + Express with TypeScript (`strict: true`) for robust, type-safe development.
* **Data storage:** MongoDB with Mongoose ODM to enforce schema constraints at the application level.
* **Validation:** Zod for runtime HTTP request validation, ensuring strict parsing of payloads and automatic TypeScript type inference (`z.infer`).
* **Security & Auth:** `bcrypt` for secure password hashing. JWT for stateless session management with a strict 30-minute expiry for access tokens.
* **Email Service:** Brevo API service is selected for dispatching account verification and time-limited OTP emails.
* **Secrets Management:** A `.env` file is utilized to securely inject critical keys (e.g., `MONGODB_URI`, `BREVO_API_KEY`, `JWT_SECRET`) preventing hardcoded credentials in the codebase.
* **API Documentation:** `swagger-ui-express` and `swagger-jsdoc` for generating and serving interactive REST API documentation, accessible directly from the backend.

### Implementation sequence
1. **Environment Setup**: Define environment variables in `.env` (`MONGODB_URI`, `BREVO_API_KEY`, `JWT_SECRET`, etc.) and create a robust configuration wrapper (e.g., `config.ts`) to load and validate them on startup.
2. **Data Modeling**: Define Mongoose schemas and models for `User` and `DonorProfile` in `models/`, extracting shared TypeScript interfaces.
3. **Validation Schemas**: Define Zod validation schemas for all incoming HTTP payloads (e.g., register, login, reset-password, update-profile) in `schemas/`.
4. **Core Services**: Implement business logic in `auth-account.service.ts`, handling JWT generation, `bcrypt` password hashing, Brevo API integration for email dispatch, and database transactions.
5. **Controllers**: Implement HTTP handlers in `auth-account.controller.ts`, consuming the service methods and integrating centralized error handling.
6. **Routes & Documentation**: Define Express endpoints using `kebab-case` plural nouns (e.g., `/api/v1/users`) in `auth-account.routes.ts` and write Swagger JSDoc comments for each route.
7. **Swagger Integration**: Integrate `swagger-ui-express` and `swagger-jsdoc` in the main application entry point to expose the `/api-docs` endpoint.

### Constitution verification
* **Naming Conventions**: Variables use `camelCase` and Mongoose models use `PascalCase` (`User`, `DonorProfile`). REST endpoints strictly follow the `/api/v1/users` format using plural nouns and `kebab-case`.
* **Security**: No secrets (MongoDB URL, Brevo API key) are hardcoded; all sensitive data is exclusively sourced from the `.env` configuration.
* **Architecture**: The module remains highly isolated within `src/backend-core/src/modules/auth-account/`, adhering to the modular monolith boundaries and preventing merge conflicts. Only backend-specific logic is implemented, explicitly ignoring any React frontend tasks.

### Assumptions and open questions
* **Assumptions**: 
  - The Brevo API free-tier limits are sufficient for the development and testing phases.
  - The domain associated with the sender email address in Brevo has been fully verified.
* **Open questions**:
  - What is the preferred strategy for injecting the `JWT_SECRET` and `BREVO_API_KEY` in the CI/CD pipeline for staging/production deployments?
  - Will there be a need for refresh tokens in the future, or is the 30-minute access token sufficient for all client types?
