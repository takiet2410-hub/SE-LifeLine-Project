# LifeLine — Software Architecture Document

> **Document:** Software Architecture (PA4-2026, Section B & C & D)
> **Course:** CSC13002 – Introduction to Software Engineering
> **Team:** Sanguine (Group 05)
> **Version:** 1.2

---

## Revision History

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| 27/07/2026 | 1.0 | Initial Software Architecture document for PA4: tech stack, C4 Level 1–3 diagrams, deployment diagram. | Trần Anh Kiệt |
| 07/08/2026 | 1.1 | Complete rewrite of architecture based on C4 Model standards, aligning strictly with `UseCaseSpec.md`, separating Subsystems from Core components, and refining the tech stack. | Trần Anh Kiệt |
| 26/08/2026 | 1.2 | Refined C4 components based on feedback: isolated RAG AI Service (4.4), unified Google Gemini provider, corrected SOS/Notification worker mappings, standardized terminology, and appended detailed folder structure. | Trần Anh Kiệt |

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [C4 Model – Level 1: System Context Diagram](#2-c4-model--level-1-system-context-diagram)
3. [C4 Model – Level 2: Container Diagram](#3-c4-model--level-2-container-diagram)
4. [C4 Model – Level 3: Component Diagrams](#4-c4-model--level-3-component-diagrams)
   - [4.1 Component Diagram — Frontend (React SPA)](#41-component-diagram--frontend-react-spa)
   - [4.2 Component Diagram — Backend Core Business](#42-component-diagram--backend-core-business)
   - [4.3 Component Diagram — Subsystems (SOS, Notifications)](#43-component-diagram--subsystems-sos-notifications)
   - [4.4 Component Diagram — Python AI Service (RAG Pipeline)](#44-component-diagram--python-ai-service-rag-pipeline)
5. [Deployment Diagram](#5-deployment-diagram)
6. [Project Folder Structure](#6-project-folder-structure)

---

## 1. Technology Stack

*Author: Trần Anh Kiệt | Reviewer: Nguyễn Quốc Dương | Editor: Trần Anh Kiệt*

The technology stack is carefully selected to support the **Modular Monolith + Companion AI Service** architecture, ensuring it aligns with the 5-person team constraint and zero-budget requirements.

| Layer / Domain | Technology | Rationale & Usage |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 (Vite) + TypeScript** | Enables rapid parallel development of user interfaces. TypeScript ensures type safety and shared interfaces with the backend. |
| **Frontend Styling** | **Tailwind CSS** | Utility-first CSS for fast, responsive web design adapting to mobile and desktop seamlessly (`NFR-U-01`). |
| **Frontend Libraries** | **React Query, i18next, jsQR, html2canvas** | Handles API caching, bilingual support (English/Vietnamese), client-side Citizen ID QR/file scanning, and e-ticket PDF generation. |
| **Backend Core** | **Node.js, Express 5, TypeScript** | A modular monolith for all CRUD operations, booking, and campaign management. Zod handles runtime validation. |
| **Database & ORM** | **MongoDB Atlas & Mongoose** | Document model fits varying entities. Provides `2dsphere` geospatial indexing for map/radius features. |
| **AI / ML Service** | **Python, FastAPI, LangChain** | Dedicated isolated service for intensive AI algorithms (RAG chatbot). |
| **Vector Store** | **MongoDB Atlas Vector Search** | Stores knowledge base embeddings for the AI Chatbot natively within the same database cluster. |
| **Background Jobs** | **Redis Cloud (Upstash) & BullMQ** | Handles asynchronous, high-priority SOS evaluation and notification dispatch decoupled from HTTP requests. |
| **Authentication** | **JWT & bcrypt** | Secures access with role-based JWTs and safely hashes user passwords. |
| **External APIs** | **Goong API, Cloudinary** | Map tiles and routing for donation centers. Cloudinary stores user avatars, campaign banners, QR images and general images. |
| **Notifications** | **Brevo (Email), FireBase (FCM)** | Free-tier services for delivering critical SOS alerts and routine transactional messages. |

---

## 2. C4 Model – Level 1: System Context Diagram

*Author: Trần Anh Kiệt | Reviewer: Nguyễn Quốc Dương | Editor: Trần Anh Kiệt*

### Main Flow
Users (Donors, Staff, and Administrators) interact with the LifeLine platform through a responsive web application to perform blood donation lifecycle activities—ranging from registration and booking to managing emergency SOS requests. LifeLine coordinates these activities by utilizing external providers for map data, email and push notifications, media storage, and Large Language Model (LLM) completions.

```mermaid
graph TB
    Donor(["Donor<br/>[Person]<br/>Registers, books appointments, chats with AI, receives alerts"])
    BCS(["Blood Center Staff<br/>[Person]<br/>Manages campaigns, inventory, verifies e-tickets"])
    HS(["Hospital Staff<br/>[Person]<br/>Requests emergency blood (SOS), monitors status"])
    Admin(["Administrator<br/>[Person]<br/>Manages users, permissions, system config"])

    LifeLine["LifeLine System<br/>[Software System]<br/>Blood donation platform handling bookings, SOS alerts, inventory, and AI assistance"]

    Maps["Maps & Geocoding API<br/>[External Software System]<br/>Provides map tiles and geocoding"]
    Email["Email Delivery Service<br/>[External Software System]<br/>Delivers transactional emails"]
    Push["Web Push Service<br/>[External Software System]<br/>Delivers browser push notifications"]
    LLM["LLM Provider API<br/>[External System: Google Gemini API]<br/>Generates natural language completions"]
    Media["Media Storage<br/>[External Software System]<br/>Stores and serves images/avatars"]

    Donor -->|"Uses system for donation features"| LifeLine
    BCS -->|"Uses system for blood center operations"| LifeLine
    HS -->|"Uses system for emergency SOS requests"| LifeLine
    Admin -->|"Uses system for administration"| LifeLine

    LifeLine -->|"Requests map data from"| Maps
    LifeLine -->|"Sends transactional emails via"| Email
    LifeLine -->|"Dispatches push notifications via"| Push
    LifeLine -->|"Requests AI completions from"| LLM
    LifeLine -->|"Uploads and loads media from"| Media
```

### System Context Descriptions

| System / Actor | Responsibility and services provided |
| :--- | :--- |
| **Donor** | Registers via Citizen ID, books appointments, downloads e-tickets, interacts with AI support, and responds to SOS alerts. |
| **Blood Center Staff** | Manages blood donation campaigns, verifies donor tickets, manages blood bag inventory, and publishes news. |
| **Hospital Staff** | Submits urgent SOS blood requests and monitors real-time matching and dispatch status. |
| **Administrator** | Oversees platform operation, manages user roles, monitors activity logs, and configures feature toggles. |
| **LifeLine System** | Core platform facilitating all interactions, matching, scheduling, and AI guidance for blood donation. |
| **Maps & Geocoding API** | Supplies map tiles and location geocoding for interactive maps (e.g., Goong). |
| **Email Delivery Service** | Third-party service (Brevo) that delivers transactional emails. |
| **Web Push Service** | Third-party service (Firebase Cloud Messaging) that delivers browser push notifications for emergency alerts. |
| **LLM Provider API** | Provides the AI reasoning engine (Google Gemini) for conversational support and RAG pipelines. |
| **Media Storage** | Cloud-based CDN (Cloudinary) for securely storing and serving images like avatars and campaign banners. |

---

## 3. C4 Model – Level 2: Container Diagram

*Author: Trần Anh Kiệt & Nguyễn Quốc Dương | Reviewer: Trần Minh Triết | Editor: Trần Anh Kiệt*

### Main Flow
The user navigates the React Single-Page Application (SPA), which routes API requests through an Edge Proxy to the backend. The Node.js Core handles standard CRUD operations, JWT authentication, and queues intensive asynchronous tasks. The Python AI Service acts as a dedicated worker for semantic search directly querying the shared MongoDB Atlas database. Background processors handle BullMQ jobs via Redis to guarantee non-blocking SOS alerts.

```mermaid
flowchart TB
    %% ==========================================
    %% ACTORS / USERS
    %% ==========================================
    subgraph Users ["Actors & Users"]
        U_Donor["Donor<br/>[Person]<br/>Registers, books campaigns, views timeline, chats with AI"]
        U_Hospital["Hospital Staff<br/>[Person]<br/>Submits & monitors emergency blood SOS requests"]
        U_Center["Blood Center Staff<br/>[Person]<br/>Manages campaigns, inventory stock-in, & verifies QR tickets"]
        U_Admin["System Admin<br/>[Person]<br/>Manages users, RBAC roles, audit logs, & system configs"]
    end

    %% ==========================================
    %% SYSTEM BOUNDARY
    %% ==========================================
    subgraph LifeLineSystem ["LifeLine Software System Boundary"]
        
        %% Frontend Container
        C_SPA["Single-Page Application (SPA)<br/>[Container: React, Vite, TypeScript, Tailwind CSS]<br/>Universal responsive web client for all 4 user roles"]

        %% Edge / Gateway Container
        C_GW["API Gateway / Edge Proxy<br/>[Container: Nginx / Vercel Edge Router]<br/>Handles TLS termination, CORS, rate limiting, & routing"]

        %% Backend Core Container
        C_Core["Node.js Core Service<br/>[Container: Node.js, Express.js, TypeScript]<br/>Modular Monolith: 11 Domain Modules & RESTful API"]

        %% AI Companion Container
        C_AI["Python AI/ML Companion Service<br/>[Container: Python 3.11, FastAPI, LangChain]<br/>RAG Chatbot Engine"]

        %% Database Container
        C_DB[("Primary Database<br/>[Container: MongoDB Atlas]<br/>Stores Documents, 2dsphere Geo Indices, & Vector Embeddings")]

        %% Cache & Queue Container
        C_Queue[("Cache & Message Broker<br/>[Container: Redis Cloud & BullMQ]<br/>Manages async job queues & high-priority SOS alerts")]
    end

    %% ==========================================
    %% EXTERNAL SYSTEMS
    %% ==========================================
    subgraph ExternalSystems ["External Systems & Third-Party Services"]
        E_Maps["Maps & Geocoding API<br/>[External Service: Goong Maps]<br/>Map tiles & server-side geocoding"]
        E_Email["Email Delivery Service<br/>[External Service: Brevo]<br/>Transactional email dispatch"]
        E_Push["Web Push Service<br/>[External Service: Firebase Cloud Messaging - FCM]<br/>Browser push notifications"]
        E_LLM["LLM Provider API<br/>[External System: Google Gemini API]<br/>LLM vector embeddings & completions"]
        E_Media["Media & Blob Storage<br/>[External Service: Cloudinary]<br/>Cloud media storage & image CDN"]
    end

    %% ==========================================
    %% RELATIONSHIPS & COMMUNICATIONS
    %% ==========================================
    U_Donor -->|"Uses features via Web UI [HTTPS]"| C_SPA
    U_Hospital -->|"Uses features via Web UI [HTTPS]"| C_SPA
    U_Center -->|"Uses features via Web UI [HTTPS]"| C_SPA
    U_Admin -->|"Uses features via Web UI [HTTPS]"| C_SPA

    C_SPA -->|"Calls REST APIs [HTTPS / JSON]"| C_GW
    C_SPA -->|"Loads map tiles & geocodes [HTTPS]"| E_Maps
    C_SPA -->|"Loads optimized images & avatars [HTTPS / CDN]"| E_Media

    C_GW -->|"Proxies core requests /api/v1/* [HTTP/HTTPS]"| C_Core
    C_GW -.->|"Proxies AI requests /api/v1/ai/* [HTTP/HTTPS]"| C_AI

    C_Core <-->|"Reads from and writes to [MongoDB Wire / TLS]"| C_DB
    C_Core <-->|"Enqueues and consumes jobs [Redis RESP / TLS]"| C_Queue
    C_Core -->|"Uploads media assets [HTTPS REST]"| E_Media
    C_Core -->|"Geocodes addresses [HTTPS REST]"| E_Maps
    C_Core -->|"Dispatches transactional emails [HTTPS REST]"| E_Email
    C_Core -->|"Dispatches push alerts [HTTPS REST]"| E_Push
    C_Core -->|"Calls internal AI APIs [Internal HTTP/REST]"| C_AI

    C_Queue -->|"Triggers background workers [BullMQ Processors]"| C_Core
    
    C_AI <-->|"Reads from and writes to [MongoDB Wire / TLS]"| C_DB
    C_AI -->|"Calls for embeddings & completions [HTTPS REST]"| E_LLM
```

### Container Descriptions

| Container | Responsibility and services provided | Technology/framework | Communication |
| :--- | :--- | :--- | :--- |
| **Single-Page Application (SPA)** | Universal responsive web client delivering role-based UIs for all 4 user roles. Manages local state, maps, and client-side QR scanning. | React, Vite, TypeScript, Tailwind CSS | Calls REST APIs `[HTTPS / JSON]` via API Gateway; Loads map tiles & geocodes `[HTTPS]` from Maps API; Loads optimized images & avatars `[HTTPS / CDN]` from Media Storage. |
| **API Gateway / Edge Proxy** | Central reverse proxy handling TLS termination, CORS, rate limiting, and routing. | Nginx / Vercel Edge Router | Proxies core requests `/api/v1/* [HTTP/HTTPS]` to Node.js Core; Proxies AI requests `/api/v1/ai/* [HTTP/HTTPS]` to AI Companion Service. |
| **Node.js Core Service** | Modular monolith with 11 domain modules handling core business logic, REST APIs, and integrations. | Node.js, Express.js, TypeScript | Reads from and writes to `[MongoDB Wire / TLS]` Primary Database; Enqueues and consumes jobs `[Redis RESP / TLS]` with Cache & Queue; Uploads media assets `[HTTPS REST]` to Media Storage; Geocodes addresses `[HTTPS REST]` to Maps API; Dispatches transactional emails `[HTTPS REST]` to Email Delivery Service; Dispatches push alerts `[HTTPS REST]` to Web Push Service; Calls internal AI APIs `[Internal HTTP/REST]` to AI Companion Service. |
| **Python AI/ML Companion Service** | RAG Chatbot Engine dedicated microservice. | Python 3.11, FastAPI, LangChain | Reads from and writes to `[MongoDB Wire / TLS]` Primary Database; Calls for embeddings & completions `[HTTPS REST]` to LLM Provider API. |
| **Primary Database** | Stores Documents, 2dsphere Geo Indices, & Vector Embeddings. | MongoDB Atlas | Persists data for Node.js Core and Python AI/ML Service `[MongoDB Wire / TLS]`. |
| **Cache & Message Broker** | Manages async job queues & high-priority SOS alerts. | Redis Cloud & BullMQ | Triggers background workers `[BullMQ Processors]` in Node.js Core; Exchanges job data `[Redis RESP / TLS]`. |

---

## 4. C4 Model – Level 3: Component Diagrams

### 4.1 Component Diagram — Frontend (React SPA)

*Author: Trịnh Khánh Linh | Reviewer: Trần Minh Triết | Editor: Trịnh Khánh Linh*

#### Main Flow
A user loads the application and authenticates via the Auth & Profile component, storing a JWT session. They can then navigate to features based on their role: Donors browse the Booking & Map components, Center Staff access Campaign & Inventory, Hospital Staff monitor the SOS Dashboard, and Admins manage the system. All API interactions are routed through a centralized API Service Layer for caching and state consistency to the API Gateway. The SPA also directly connects to external services to load map tiles and media assets.

```mermaid
flowchart TB
    %% ==========================================
    %% ACTORS / USERS
    %% ==========================================
    Donor(["Donor<br/>[Person]"])
    Staff(["Hospital & Center Staff<br/>[Person]"])
    Admin(["System Admin<br/>[Person]"])

    %% ==========================================
    %% FRONTEND CONTAINER
    %% ==========================================
    subgraph SPA ["Browser Web Application (React / TypeScript)"]
        Router["App Router & Session<br/>[Component]<br/>Handles role-based routing and session state"]
        AuthProfile["Auth & Profile<br/>[Component]<br/>Registration, login, Citizen ID QR scanning, profile mgmt"]
        BookingMap["Booking & Interactive Map<br/>[Component]<br/>Map discovery, scheduling, e-ticket viewing"]
        CampaignInventory["Campaign & Inventory<br/>[Component]<br/>Campaign creation, donor list, stock in/out"]
        SOSDash["SOS Emergency Dashboard<br/>[Component]<br/>SOS creation, status monitoring, reports"]
        AIChat["AI Chatbot Interface<br/>[Component]<br/>Multi-turn chat widget for donor guidance"]
        APILayer["API Service Layer<br/>[Component]<br/>Centralized data fetching and caching"]
    end

    %% ==========================================
    %% EXTERNAL CONTAINERS / SYSTEMS
    %% ==========================================
    Gateway["API Gateway / Edge Proxy<br/>[Container]<br/>Handles routing to Core & AI"]
    Media["Media & Blob Storage<br/>[External System]<br/>Cloudinary"]
    Maps["Maps & Geocoding API<br/>[External System]<br/>Goong Maps"]

    %% ==========================================
    %% RELATIONSHIPS
    %% ==========================================
    Donor -->|"Uses features in"| Router
    Staff -->|"Uses features in"| Router
    Admin -->|"Uses features in"| Router

    Router --> AuthProfile
    Router --> BookingMap
    Router --> CampaignInventory
    Router --> SOSDash
    Router --> AIChat

    AuthProfile -->|"Calls APIs via"| APILayer
    BookingMap -->|"Calls APIs via"| APILayer
    CampaignInventory -->|"Calls APIs via"| APILayer
    SOSDash -->|"Calls APIs via"| APILayer
    AIChat -->|"Calls APIs via"| APILayer

    APILayer -->|"Calls REST APIs [HTTPS / JSON]"| Gateway
    BookingMap -->|"Loads map tiles & geocodes [HTTPS]"| Maps
    AuthProfile -->|"Loads optimized images & avatars [HTTPS / CDN]"| Media
    BookingMap -->|"Loads optimized images & avatars [HTTPS / CDN]"| Media
```

#### Frontend Component Descriptions

| Component | Responsibility and services provided | Representative code/modules | Relationships |
| :--- | :--- | :--- | :--- |
| **App Router & Session** | Mounts role-specific layouts, enforces protected routes, and holds JWT state. | `App.tsx`, `shared/contexts/AuthContext.tsx` | Validates roles; routes to specific feature portals. |
| **Auth & Profile** | User registration flows, file/camera QR Citizen ID parsing, and profile edits. | `modules/auth-account/components/LoginForm.tsx`, `RegisterCitizenIdPage.tsx` | Calls APIs via API Layer; Loads optimized images & avatars. |
| **Booking & Interactive Map** | Discovers donation points via maps, manages appointments, and displays e-tickets. | `modules/booking-location/pages/InteractiveMapPage.tsx`, `MyAppointmentPage.tsx` | Calls APIs via API Layer; Loads map tiles & geocodes; Loads optimized images. |
| **Campaign & Inventory** | Blood center tools to manage drives, verify donor tickets, and track blood bag lifecycle. | `modules/campaign-mgmt/pages/CampaignListPage.tsx`, `modules/blood-inventory/pages/StockInPage.tsx` | Calls APIs via API Layer. |
| **SOS Emergency Dashboard** | Hospital interface to trigger urgent blood requests and watch live dispatch status. | `modules/sos-requests/pages/CreateSOSRequestPage.tsx`, `SOSDashboardPage.tsx` | Calls APIs via API Layer. |
| **AI Chatbot Interface** | Persistent UI widget providing context-aware donation guidance via RAG. | `ChatbotWidget.tsx`, `MessageBubble.tsx` | Calls APIs via API Layer. |
| **API Service Layer** | Wraps `fetch` requests, handles JWT injection, caching (React Query), and error toasts. | `shared/api/apiClient.ts` | Calls REST APIs via API Gateway. |

---

### 4.2 Component Diagram — Backend Core Business

*Author: Trần Minh Triết | Reviewer: Nguyễn Quốc Dương | Editor: Trần Minh Triết*

#### Main Flow
Incoming requests from the API Gateway pass through the API & Routing layer, which initializes the Express application, parses payloads, and routes to appropriate domain modules. Standard core business actions—such as managing accounts, booking appointments, organizing campaigns, tracking inventory, handling registrations, and publishing content—are executed by their respective dedicated domain components. These components then read from and write to the shared MongoDB database to persist state, and upload assets to external media storage.

```mermaid
flowchart TB
    %% ==========================================
    %% EXTERNAL CONTAINERS
    %% ==========================================
    Gateway["API Gateway / Edge Proxy<br/>[Container]<br/>Proxies core requests"]

    %% ==========================================
    %% BACKEND CORE CONTAINER
    %% ==========================================
    subgraph Core ["Node.js Core Service - Core Business"]
        API["API & Routing<br/>[Component]<br/>Express app routing and validation"]
        Auth["Auth & Account<br/>[Component]<br/>User management, profiles, gamification"]
        Booking["Booking<br/>[Component]<br/>Appointment logic, map search, e-tickets"]
        Campaign["Campaign Management<br/>[Component]<br/>Blood drives, donor lists"]
        Inventory["Blood Inventory<br/>[Component]<br/>Stock tracking, bag status"]
        Registration["Registration<br/>[Component]<br/>Digital donor records, roles"]
        Content["Content Management<br/>[Component]<br/>Articles, public news, media uploads"]
    end

    %% ==========================================
    %% PERSISTENCE & EXTERNAL
    %% ==========================================
    DB[("Primary Database<br/>[Container]<br/>MongoDB Atlas")]
    Media["Media & Blob Storage<br/>[External System]<br/>Cloudinary"]

    %% ==========================================
    %% RELATIONSHIPS
    %% ==========================================
    Gateway -->|"Proxies core requests /api/v1/* [HTTP/HTTPS]"| API

    API -->|"Routes requests to"| Auth
    API -->|"Routes requests to"| Booking
    API -->|"Routes requests to"| Campaign
    API -->|"Routes requests to"| Inventory
    API -->|"Routes requests to"| Registration
    API -->|"Routes requests to"| Content

    Auth <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB
    Booking <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB
    Campaign <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB
    Inventory <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB
    Registration <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB
    Content <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB

    Auth -->|"Uploads media assets [HTTPS REST]"| Media
    Campaign -->|"Uploads media assets [HTTPS REST]"| Media
    Content -->|"Uploads media assets [HTTPS REST]"| Media
```

#### Backend Core Component Descriptions

| Component | Responsibility and services provided | Representative code/modules | Relationships |
| :--- | :--- | :--- | :--- |
| **API & Routing** | Express routers and initialization to parse bodies, and route to internal domains. | `app.ts`, `server.ts` | Entry point receiving proxy requests from API Gateway. |
| **Auth & Account** | Handles account state, profiles, login logic, and user gamification (badges, XP). | `modules/auth-account/auth-account.controller.ts`, `gamification.service.ts` | Reads from and writes to DB; Uploads media assets. |
| **Booking** | Manages donation scheduling, capacity checks, and e-tickets. | `modules/booking/controllers/booking.controller.ts`, `booking.service.ts` | Reads from and writes to DB. |
| **Campaign Management** | Oversees blood drives, participant rosters, and center operations. | `modules/campaign/controllers/campaign.controller.ts`, `campaign.service.ts` | Reads from and writes to DB; Uploads media assets. |
| **Blood Inventory** | Tracks blood bag lifecycle (Stock In/Out) and computes hospital availability. | `modules/blood-inventory/controllers/blood-inventory.controller.ts`, `blood-inventory.service.ts` | Reads from and writes to DB. |
| **Registration** | Manages digital donor records, role enforcements, and audit logs. | `modules/registration/controllers/registration.controller.ts`, `registration.service.ts` | Reads from and writes to DB. |
| **Content Management** | Oversees published articles, news, and direct image/media uploads. | `modules/content/controllers/article.controller.ts`, `upload.controller.ts` | Reads from and writes to DB; Uploads media assets. |

---

### 4.3 Component Diagram — Subsystems (SOS, Notifications)

*Author: Trần Anh Kiệt | Reviewer: Trần Đức Quý | Editor: Trần Anh Kiệt*

#### Main Flow
When a Hospital creates an SOS request, it is routed via the API Gateway to the SOS Request Orchestrator, which persists the request in MongoDB and enqueues an evaluation job in Redis. The Node.js Background Job Worker processes this queue and triggers the Node.js SOS Evaluation Engine, which computes geographic proximity and inventory to rank potential centers and donors. Once evaluated, broadcast jobs are enqueued for the Notification Engine to dispatch emergency alerts via external email and push providers.

```mermaid
flowchart TB
    %% ==========================================
    %% CONTAINERS & EXTERNAL DEPENDENCIES
    %% ==========================================
    Gateway["API Gateway / Edge Proxy<br/>[Container]<br/>Proxies requests"]
    DB[("Primary Database<br/>[Container]<br/>MongoDB Atlas")]
    Redis[("Cache & Message Broker<br/>[Container]<br/>Redis Cloud & BullMQ")]
    EmailPush["Email & Push Services<br/>[External System]<br/>Brevo / FCM"]

    %% ==========================================
    %% SUBSYSTEM COMPONENTS
    %% ==========================================
    subgraph Subsystems ["Subsystem Components (Node.js Core)"]
        SOSOrch["SOS Request Orchestrator<br/>[Component: Node.js]<br/>Manages SOS lifecycle, enqueues jobs"]
        SOSEval["SOS Evaluation Engine<br/>[Component: Node.js]<br/>Scores and ranks centers & donors"]
        JobWorker["Background Job Worker<br/>[Component: Node.js]<br/>Processes async BullMQ queues"]
        NotifEngine["Notification Engine<br/>[Component: Node.js]<br/>Dispatches routine and emergency alerts"]
    end

    %% ==========================================
    %% RELATIONSHIPS
    %% ==========================================
    Gateway -->|"Proxies core requests [HTTP/HTTPS]"| SOSOrch

    SOSOrch <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB
    SOSOrch -->|"Enqueues jobs [Redis RESP / TLS]"| Redis

    Redis -->|"Triggers background workers [BullMQ Processors]"| JobWorker
    JobWorker -->|"Triggers evaluation in"| SOSEval
    JobWorker -->|"Triggers dispatch in"| NotifEngine
    
    SOSEval <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB
    SOSEval -->|"Enqueues broadcast jobs [Redis RESP / TLS]"| Redis

    NotifEngine -->|"Dispatches alerts [HTTPS REST]"| EmailPush
    NotifEngine <-->|"Reads from and writes to [MongoDB Wire / TLS]"| DB
```

#### Subsystem Component Descriptions

| Component | Responsibility and services provided | Representative code/modules | Relationships |
| :--- | :--- | :--- | :--- |
| **SOS Request Orchestrator** | Node.js entry point for SOS creation. Ensures request durability before passing off to queue. | `modules/sos-request/controllers/sos-request.controller.ts`, `sos-request.service.ts` | Reads from and writes to DB; Enqueues jobs. |
| **SOS Evaluation Engine** | Node.js logic computing composite scores based on geospatial distance, blood type, and inventory. | `modules/sos-request/services/sos-evaluation.service.ts` | Reads from and writes to DB; Enqueues jobs. |
| **Background Job Worker** | BullMQ processor consuming queue messages asynchronously for evaluation and notifications. | `modules/sos-request/jobs/sos-evaluation.processor.ts`, `modules/notification/jobs/notification.processor.ts` | Triggers background workers; Calls internal evaluation logic. |
| **Notification Engine** | Handles multi-channel dispatch (email, push) bypassing rate limits for urgent SOS alerts. | `modules/notification/services/notification.service.ts`, `email.service.ts`, `push.service.ts` | Reads from and writes to DB; Dispatches alerts. |

---

### 4.4 Component Diagram — Python AI Service (RAG Pipeline)

*Author: Trần Anh Kiệt | Reviewer: Trần Minh Triết | Editor: Trần Anh Kiệt*

#### Main Flow
The AI Service isolates the RAG (Retrieval-Augmented Generation) workflow. The data ingestion process starts with the **Knowledge Base (Documents)**, which is processed via **Chunking into Chunks**, followed by an **Embedding Model** to generate vectors, which are then stored into the **Vector Database**. At runtime, the workflow is: **1) User enters a query** -> **2) Retriever fetches information relevant to the query** (via embedding the query and searching the Vector Database) -> **3) relevant information is augmented to the prompt as context** -> **4) LLM generates a response to the prompt** -> **5) Streamed responses to the user**.

```mermaid
flowchart TB
    %% ==========================================
    %% EXTERNAL & INFRASTRUCTURE
    %% ==========================================
    User(["User<br/>[Person]"])
    Gateway["Application / Gateway<br/>[Container]"]
    VectorDB[("Vector Database<br/>[Container: MongoDB & FAISS]")]
    LLM["LLM Provider API<br/>[External System: Google Gemini API]"]
    EmbedModel["Embedding Model<br/>[External System: Google Gemini Embeddings API]"]
    KB["Knowledge Base (Documents)<br/>[Filesystem: Markdown]"]

    %% ==========================================
    %% AI SERVICE COMPONENTS
    %% ==========================================
    subgraph AIService ["Python AI Service Container"]
        
        Chunking["Chunking into Chunks<br/>[Component: Ingest Script]"]
        
        API["API Routes<br/>[Component: FastAPI]"]
        
        Retriever["Retriever<br/>[Component: FAISS/LangChain]"]
        
        PromptBuilder["Prompt Builder<br/>[Component: Generation Pipeline]"]
    end

    %% ==========================================
    %% 1) INGESTION WORKFLOW
    %% ==========================================
    KB -->|"1. Read raw documents"| Chunking
    Chunking -->|"2. Send chunks to"| EmbedModel
    EmbedModel -.->|"3. Return embeddings"| Chunking
    Chunking -->|"4. Store embeddings in"| VectorDB

    %% ==========================================
    %% 2) RAG RUNTIME WORKFLOW
    %% ==========================================
    User -->|"1. Enters a query"| Gateway
    Gateway -->|"Routes query"| API
    API -->|"Passes query"| Retriever
    
    Retriever -->|"2. Embeds query & searches"| VectorDB
    VectorDB -.->|"Fetches information relevant to the query"| Retriever
    
    Retriever -->|"Passes context & query"| PromptBuilder
    PromptBuilder -->|"3. Augments relevant information to the prompt as context"| LLM
    
    LLM -.->|"4. Generates a response to the prompt"| API
    API -.->|"5. Streamed responses to the user"| User
```

#### AI Service Component Descriptions

| Component | Responsibility and services provided | Representative code/modules | Relationships |
| :--- | :--- | :--- | :--- |
| **Ingestion Script** | Reads the raw `LifeLine_Knowledge_Base_Detailed.md`, processes the text into chunks, calls the embedding model, and stores the vectors into MongoDB. | `scripts/ingest_md.py` | Reads filesystem; Calls LLM for embeddings; Writes to DB. |
| **FastAPI Routes** | Exposes HTTP endpoints for chat completions, handling authentication middleware and asynchronous streaming responses. | `app/api/routes.py`, `app/middleware/auth.py` | Receives proxy traffic from Gateway; Invokes Pipeline. |
| **Generation Pipeline** | Orchestrates the agent workflow: checks semantic cache for common FAQs, builds the system prompt with context, and routes to the LLM. | `app/generation/pipeline.py` | Calls FAISS Retriever; Calls LLM for completions. |
| **FAISS Builder / Retriever** | Syncs vector embeddings from MongoDB into an optimized in-memory FAISS index to perform fast similarity searches for the RAG pipeline. | `app/services/faiss_builder.py`, `app/services/embeddings.py` | Reads from DB; Provides context chunks to Pipeline. |

---

## 5. Deployment Diagram

*Author: Trần Anh Kiệt | Reviewer: Trần Đức Quý | Editor: Trần Anh Kiệt*

```mermaid
flowchart TB
    %% ==========================================
    %% CLIENT & CDN TIER
    %% ==========================================
    subgraph Client ["Client Devices"]
        Browser["Web Browser<br/>(Chrome / Edge / Safari)"]
    end

    subgraph Vercel ["Vercel Edge Network"]
        SPAInst["React SPA<br/>[Static Site]"]
        EdgeProxy["Vercel Edge Router<br/>[API Gateway]"]
    end

    %% ==========================================
    %% APPLICATION HOSTING TIER
    %% ==========================================
    subgraph Render ["Render (Web Service)"]
        CoreInst["Node.js Core API<br/>[Docker Container]"]
        WorkerInst["Job Workers<br/>[BullMQ Processor]"]
    end

    subgraph HF ["Hugging Face Spaces"]
        AIInst["Python AI Service<br/>[Docker Space]"]
    end

    %% ==========================================
    %% MANAGED DATA TIER
    %% ==========================================
    subgraph Data ["Managed Data Tier"]
        MongoInst[("MongoDB Atlas<br/>[M0 Cluster]")]
        RedisInst[("Upstash Redis<br/>[Serverless]")]
    end

    %% ==========================================
    %% EXTERNAL SAAS
    %% ==========================================
    subgraph SaaS ["External SaaS Providers"]
        Cloudinary[("Cloudinary<br/>[Media CDN]")]
        ThirdPartyAPI["Email / Push / Gemini<br/>[External APIs]"]
    end

    %% ==========================================
    %% RELATIONSHIPS
    %% ==========================================
    Browser -->|"HTTPS"| SPAInst
    Browser -->|"HTTPS"| EdgeProxy
    
    EdgeProxy -->|"Proxies /api/v1 [HTTPS]"| CoreInst
    EdgeProxy -->|"Proxies /api/ai [HTTPS]"| AIInst
    
    CoreInst <-->|"MongoDB Wire Protocol / TLS"| MongoInst
    WorkerInst <-->|"MongoDB Wire Protocol / TLS"| MongoInst
    AIInst <-->|"MongoDB Wire Protocol / TLS"| MongoInst
    
    CoreInst <-->|"Redis RESP / TLS"| RedisInst
    WorkerInst <-->|"Redis RESP / TLS"| RedisInst
    
    CoreInst -->|"HTTPS REST"| Cloudinary
    CoreInst -->|"HTTPS REST"| ThirdPartyAPI
    AIInst -->|"HTTPS REST"| ThirdPartyAPI
    
    %% Aligning components to reduce overlap
    Client ~~~ Vercel
    Vercel ~~~ Render
    Render ~~~ Data
```

### Node Descriptions

| Node | Hardware / Cloud Service | Container(s) Running | Communication Protocols |
| :--- | :--- | :--- | :--- |
| **Client Device** | End-user mobile or desktop hardware | Runs static SPA files | Connects to Vercel/CDN over HTTPS. |
| **Vercel Edge Network** | Vercel Free Tier (Global CDN & Edge Functions) | React SPA (Static) & Edge Router | Serves assets via HTTPS; Proxies API requests to Render & Hugging Face. |
| **Render Web Service** | Render Cloud (Container Hosting) | Node.js Core API & Job Workers | HTTPS from Vercel; TLS to MongoDB & Redis; HTTPS to External SaaS. |
| **Hugging Face Spaces** | Hugging Face (Docker Space Hosting) | Python AI/ML Service | HTTPS from Vercel; TLS to MongoDB; HTTPS to LLM APIs. |
| **MongoDB Atlas** | Managed MongoDB Cloud (M0 Free Tier) | Primary Database (Documents + Vectors) | Encrypted TCP (MongoDB Wire Protocol) from Render and Hugging Face. |
| **Upstash Redis** | Managed Serverless Redis | Redis (BullMQ Storage) | Encrypted TCP (Redis RESP) from Render Node.js instances. |
| **External Cloud SaaS** | Cloudinary, Brevo, Firebase, Google Gemini API | Media and Third-party systems | HTTPS from backend services. |

---


## 6. Project Folder Structure

*Author: Trần Anh Kiệt | Reviewer: Nguyễn Quốc Dương | Editor: Trần Anh Kiệt*

The LifeLine monorepo is organized to clearly separate the frontend React application, the Node.js core backend, and the Python AI service.

```text
SE-LifeLine-Project/
├── docs/                              # Project documentation
│   ├── requirements/                  # Vision document, use cases
│   ├── analysis-and-design/           # Software architecture, diagrams, UI design
│   ├── management/                    # Planning docs & reports
│   └── test/                          # Test plan, test cases, test reports
│
├── src/                               # All source code
│   ├── frontend/                      # React + Tailwind CSS SPA
│   │   ├── src/
│   │   │   ├── components/            # Global UI components
│   │   │   ├── data/                  # Static data or mocks
│   │   │   ├── i18n/                  # Internationalization (En/Vi)
│   │   │   ├── modules/               # Feature-based modules
│   │   │   │   ├── admin/
│   │   │   │   ├── auth-account/
│   │   │   │   ├── blood-inventory/
│   │   │   │   ├── booking-location/
│   │   │   │   ├── campaign-mgmt/
│   │   │   │   ├── chatbot/
│   │   │   │   ├── content-mgmt/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── impact-tracking/
│   │   │   │   ├── landing-page/
│   │   │   │   ├── notifications/
│   │   │   │   └── sos-requests/
│   │   │   ├── routes/                # Route definitions per role
│   │   │   ├── services/              # API integration layer
│   │   │   ├── shared/                # Cross-module UI kit, shared hooks, utils
│   │   │   ├── types/                 # TypeScript interfaces
│   │   │   ├── utils/                 # Helper functions
│   │   │   ├── App.tsx                # Root application component
│   │   │   ├── index.css              # Global styles
│   │   │   └── main.tsx               # Application entry point
│   │   ├── index.html                 # HTML template
│   │   └── package.json
│   │
│   ├── backend-core/                  # Node.js modular monolith
│   │   ├── src/
│   │   │   ├── config/                # Environment and DB config
│   │   │   ├── modules/               # Domain modules
│   │   │   │   ├── admin/
│   │   │   │   ├── auth-account/
│   │   │   │   ├── blood-inventory/
│   │   │   │   ├── booking/
│   │   │   │   ├── campaign/
│   │   │   │   ├── chatbot/
│   │   │   │   ├── content/
│   │   │   │   ├── notification/
│   │   │   │   ├── registration/
│   │   │   │   └── sos-request/
│   │   │   ├── scripts/               # Setup scripts
│   │   │   ├── shared/                # Middleware, error handlers, validators
│   │   │   ├── utils/                 # Helper functions
│   │   │   ├── app.ts                 # Express App setup
│   │   │   ├── seed-accounts.ts       # Database seeder
│   │   │   └── server.ts              # Server entry point
│   │   ├── replace-health-tips.js     # Script utility
│   │   └── package.json
│   │
│   ├── ai-service/                    # Python FastAPI AI/ML service
│   │   ├── app/
│   │   │   ├── api/                   # API routes
│   │   │   ├── generation/            # RAG and LLM logic
│   │   │   ├── middleware/            # HTTP Middlewares
│   │   │   └── services/              # Core business logic for AI
│   │   ├── scripts/                   # Utility scripts
│   │   ├── main.py                    # Application entry point
│   │   ├── test_router.py             # Router tests
│   │   └── requirements.txt           # Python dependencies
│   │
│   └── specs/                         # Spec-Kit generated artifacts, one folder per feature
│       ├── LL-UC-01-register-cccd/
│       ├── HS-UC-01-create-sos-request/
│       └── ...                        # 1 subfolder per Spec-Kit feature run
│
├── .specify/                          # Spec-Kit internal state
├── .github/workflows/                 # CI pipelines (lint, test, build)
├── .gitignore
└── README.md
```