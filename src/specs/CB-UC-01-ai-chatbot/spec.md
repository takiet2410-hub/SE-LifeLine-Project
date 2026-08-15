# Feature Specification: AI Chatbot (CB-UC-01)

**Feature ID:** CB-UC-01  
**Covered Use Cases:** CB-UC-01  
**Created:** 2026-08-09  
**Updated:** 2026-08-10 (Synchronized with codebase)  
**Status:** Approved & Implemented

---

# Summary

The AI Chatbot feature provides an intelligent, highly responsive conversational interface for both anonymous guests and authenticated donors. It leverages a Database-Grounded Retrieval-Augmented Generation (RAG) Architecture combined with Semantic Caching to deliver accurate, localized medical information. The chatbot automatically routes basic intents (like greetings) to a lightweight model for sub-second responses, while complex queries are grounded in medical guidelines and personalized donor context.

---

# Scope

This specification covers the following use cases:

- Anonymous Blood Donation Inquiry (Knowledge Retrieval)
- Authenticated Donor Context Injection (Campaigns & Eligibility)
- Medical Eligibility Verification & Safe Fallbacks
- In-Memory Semantic Caching for ultra-fast generic responses
- Fast Intent Routing via `gemini-2.0-flash-lite`

This feature belongs to **Functional Group CB – Chatbot Capabilities**.

---

# Actors

## Primary Actor

- Anonymous Guest
- Authenticated Donor

## Supporting Actors

- AI Service Backend (FastAPI)
- Vector Search Engine (FAISS)
- Semantic Cache (In-Memory JSON + FAISS)

---

# Business Value

This feature dramatically reduces the burden on blood center support staff by automatically answering 90% of common medical and procedural questions. By using Semantic Caching and Intent Routing, it ensures near-instant responses, keeping donors engaged while preventing medical misinformation through strict grounding rules.

---

# User Stories

## User Story 1 – Anonymous Blood Donation Inquiry (Priority: P1)

As an anonymous guest, I want to ask basic questions about blood donation requirements so that I can prepare properly before visiting a blood center.

## User Story 2 – Authenticated Campaign Search (Priority: P2)

As an authenticated donor, I want to find upcoming campaigns near me and check if my blood type is needed, so I can schedule my next donation based on real-time needs.

## User Story 3 – Instant Response for Common Questions (Priority: P1)

As a donor, I want the chatbot to answer my common questions instantly without waiting for long AI generation times, so I can quickly get the information I need.

---

# Functional Requirements

## CB-FR-001 – Fast Intent Routing
The system MUST parse incoming queries to detect simple intents (e.g., greetings, small talk). If detected, the query MUST bypass RAG and be routed to a lightweight model (`flash-lite`) for rapid response.

## CB-FR-002 – Semantic Caching
The system MUST implement an in-memory Semantic Cache using FAISS and a local JSON store for non-authenticated (generic) queries.
- **CB-FR-002a**: If a query has an L2 semantic distance < 0.25 compared to a cached query, the system MUST return the cached response immediately.
- **CB-FR-002b**: Semantic Caching MUST be bypassed for authenticated donors to prevent leaking personalized context or incorrect eligibility answers.

## CB-FR-003 – RAG Knowledge Retrieval
The system MUST combine keyword and semantic search via FAISS to retrieve the top-K relevant documents from the `knowledge_base_docs` collection for complex queries.

## CB-FR-004 – Context Injection
The system MUST inject personalized donor context (active campaigns, donor profile, next eligible date) into the System Prompt for authenticated sessions.

## CB-FR-005 – Streaming Output
The system MUST stream AI responses to the frontend using Server-Sent Events (SSE) to ensure a perceived low-latency experience.

## CB-FR-006 – Medical Fallback
The system MUST refuse to provide medical diagnoses or ungrounded medical advice, responding with a standardized disclaimer if the knowledge base lacks information.

---

# Business Rules

### BR-001
Anonymous conversation history MUST NOT merge into authenticated accounts upon login, maintaining strict medical privacy.

### BR-002
Real-time blood bag inventory queries are strictly restricted to authorized staff and MUST NOT be exposed by the chatbot to general donors.

### BR-003
The minimum blood donation interval (84 days for whole blood, 21 days for platelets) MUST be respected when the AI advises on eligibility.

---

# Acceptance Criteria

## Scenario 1 – Cached Generic Query
**Given** an unauthenticated guest session.
**When** the guest asks "Điều kiện để hiến máu là gì?" which was asked previously.
**Then** the system detects a Semantic Cache hit and streams the cached answer instantly.

## Scenario 2 – Authenticated Personal Query
**Given** an authenticated donor who donated 30 days ago.
**When** the donor asks "Tôi có thể hiến máu tiếp không?".
**Then** the system bypasses Semantic Cache, injects donor context, and informs them they must wait, calculating the exact wait time based on the 84-day rule.

## Scenario 3 – Medical Out-of-Domain Query
**Given** any user session.
**When** the user asks "Tôi bị đau đầu thì uống Paracetamol được không?".
**Then** the system refuses to provide medical advice and returns a safe fallback disclaimer.

---

# Non-Functional Requirements

## Performance
- **NFR-001**: Intent Routed queries (Greetings) must return the first token within **1 second**.
- **NFR-002**: Semantic Cache hit queries must return the complete response within **0.5 seconds**.
- **NFR-003**: Full RAG retrieval queries must stream the first token within **3 seconds**.

## Reliability
- **NFR-004**: If the LLM API throws a Quota Exceeded (429) error, the system MUST fallback immediately to `flash-lite` without retrying 60 seconds.

---

# Data Objects

- **KnowledgeBaseDoc**: Static handbook content (Deferrals, Components, FAQ).
- **SemanticCacheEntry**: Key-value pair mapping query vectors to response text.
- **DonorContext**: Ephemeral state containing `daysUntilEligible`, `bloodType`, and `isEligibleNow`.

---

# Out of Scope
- Voice input / output.
- Direct appointment booking via Chat UI (users are redirected to the booking page instead).
