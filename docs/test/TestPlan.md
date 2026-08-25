# LifeLine — Test Plan
> **Document**: Test Plan  
> **Course**: CSC13002 - Introduction to Software Engineering
> **Team**: Sanguine (Team 05)  
> **Version**: 1.0 | **Date**: 10/08/2026  

*Author: Trịnh Khánh Linh | Reviewer: Trần Anh Kiệt | Editor: Trịnh Khánh Linh*

## Table of Contents

- [Revision History](#revision-history)
- [1. Introduction](#1-introduction)
  - [1.1 Purpose](#11-purpose)
  - [1.2 Scope](#12-scope)
- [2. Target Test Items](#2-target-test-items)
- [3. Environmental Needs](#3-environmental-needs)
  - [3.1 Hardware Requirements](#31-hardware-requirements)
  - [3.2 Software in the Test Environment](#32-software-in-the-test-environment)
  - [3.3 Productivity and Support Tools](#33-productivity-and-support-tools)
- [4. Responsibilities and Test Schedule](#4-responsibilities-and-test-schedule)
  - [4.1 People and Roles](#41-people-and-roles)
  - [4.2 Test Schedule](#42-test-schedule)
- [5. Entry and Exit Criteria](#5-entry-and-exit-criteria)
  - [5.1 Entry Criteria](#51-entry-criteria)
  - [5.2 Exit Criteria](#52-exit-criteria)

---


## Revision History

| Date       | Version | Description                                                   | Author           |
| :--------- | :------ | :------------------------------------------------------------ | :--------------- |
| 10/08/2026 | 1.0     | Initial draft of Test Plan, Detailed scheduling, environment versions, assignment updates                                  | Trịnh Khánh Linh |
---

## 1. Introduction

### 1.1 Purpose

This Test Plan serves as the central guiding document for the testing activities of the LifeLine platform. It defines the testing scope, approach, environment, and responsibilities to ensure that the selected core workflows operate correctly and reliably under various conditions.

The primary objective is to validate the functional correctness, reliability, and usability of the LifeLine platform across selected core features representing its main business workflows. This document establishes the test items, environmental requirements, testing responsibilities, and execution schedule that will guide the team's testing activities.

### 1.2 Scope

This Test Plan focuses on manual functional testing of at least five selected features that represent important workflows of the system. The selected features provide broad functional coverage of the application's core business workflows. Each feature may encompass multiple related use cases, which are used to define and trace the detailed functional test scenarios.

**In Scope**

* Manual functional testing of the five selected major features.
* Validation of normal and valid user scenarios.
* Validation of invalid and negative scenarios.
* Boundary and relevant edge-case testing.
* Validation of data processing and persistence where applicable.
* Functional correctness testing of the AI-powered chatbot feature.
* Review and refinement of previously generated Spec Kit test cases.
* Addition of test cases for scenarios that are not sufficiently covered.
* Execution of the final test cases with documented results.
* Identification, documentation, and reporting of defects discovered during testing.
* Re-testing of defects after they have been fixed.

**Out of Scope**

* Comprehensive functional testing of LifeLine features outside the selected testing scope.
* Automated testing.
* Performance, load, and stress testing.
* Penetration testing and security vulnerability assessment.
* Testing of third-party services beyond their functional interaction with the LifeLine application.

---

## 2. Target Test Items


The testing scope focuses on five major functional features of the LifeLine platform. These features were selected to provide broad coverage of the application's core business workflows. Each feature encompasses multiple related use cases, which are used to define and trace the detailed functional test scenarios. The final test case set will contain a minimum of 50 test cases overall.

| Feature | Main Business Workflow Covered | Related Use Cases | Testing Focus |
| ----- | --------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **User Account Management** | User registration, authentication, and profile access | LL-UC-01 to LL-UC-05 | Registration validation, credentials, authentication state, password constraints, profile updates, role-based access. |
| **Donation Booking & Location Services** | Donor finds a campaign and books an appointment | LL-UC-06 to LL-UC-10 | Map search, appointment availability, input validation, booking rules, booking confirmation, cancellation. |
| **Blood Donation Campaign and Management** | Blood center creates and manages campaigns | BC-UC-01 to BC-UC-07 | Required fields, input validation, date and capacity constraints, campaign visibility, donor registration, QR verification. |
| **Emergency Blood SOS Request Management** | Hospital creates and manages emergency blood requests | HS-UC-01 to HS-UC-03 | Request validation, successful creation, data persistence, asynchronous processing, monitoring, reporting. |
| **AI-Powered Conversational Support & Guidance** | Donor interacts with AI assistance | CB-UC-01 | Input handling, response generation, knowledge retrieval, multi-turn interaction, and appropriate fallback behavior. |

---

## 3. Environmental Needs

Testing will be conducted in an environment that supports the LifeLine frontend, backend, AI service, database, and supporting services required by the selected features.

### 3.1 Hardware Requirements

The testing activities require a desktop or laptop computer capable of running the LifeLine development environment and accessing the required external services.

| Requirement         | Description                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Test machine        | Desktop or laptop computer capable of running the frontend and required backend services.                                                  |
| Processing capacity | Sufficient CPU and memory to run the Node.js backend, frontend development server, and Python AI service when local execution is required. |
| Network             | Stable Internet connection for communication with MongoDB Atlas and external services.                                                     |
| Peripherals         | Standard keyboard, mouse, and display for browser-based manual testing.                                                                    |

Specific hardware specifications are not imposed by the project and may be confirmed based on the actual testing machine.

### 3.2 Software in the Test Environment

The test environment is based on the technology stack currently used by the LifeLine project.

| Software / Component | Purpose                             | Notes                                                                         |
| -------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| **React**            | Frontend user interface             | Used to implement the LifeLine web interface.                                 |
| **Vite**             | Frontend development and build tool | Used to run and build the frontend application.                               |
| **Tailwind CSS**     | Frontend styling                    | Used for the application's user interface styling.                            |
| **Node.js**          | Backend runtime                     | Runs the core backend service.                                                |
| **Express**          | Backend framework                   | Handles HTTP requests and backend APIs.                                       |
| **TypeScript**       | Backend programming language        | Used in the core backend service.                                             |
| **Python**           | AI service runtime                  | Runs the AI service.                                                          |
| **FastAPI**          | AI service framework                | Provides the AI service API.                                                  |
| **MongoDB Atlas**    | Database service                    | Stores application data and supports geospatial queries where required.       |
| **Mongoose**         | MongoDB object modeling library     | Used by the backend to interact with MongoDB.                                 |
| **Redis**            | In-memory data store                | Supports asynchronous background processing.                                  |
| **BullMQ**           | Job queue                           | Used for background tasks such as SOS evaluation and notification processing. |
| **Cloudinary**       | External media service              | Used for image and media management.                                          |
| **Maps API**         | External location service           | Supports map and location-related functionality.                              |
| **Web Browser**      | Manual testing client               | Used to interact with the LifeLine web application.                           |


### 3.3 Productivity and Support Tools

The following tools support development, testing, documentation, and defect investigation.

| Tool Category               | Tool                    | Purpose                                                                           |
| --------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| **Version Control**         | Git / GitHub            | Manage source code and document revisions.                                        |
| **Development Environment** | Visual Studio Code      | Inspect source code, edit test documents, and run development services.           |
| **Documentation**           | Markdown                | Create and maintain the Test Plan, Test Cases, and other testing documents.       |
| **Browser Inspection**      | Browser Developer Tools | Inspect network requests, console messages, and frontend behavior during testing. |
| **Test Documentation**      | Markdown files          | Record test cases, execution results, and defect-related information.             |

---

## 4. Responsibilities and Test Schedule


### 4.1 People and Roles

The testing activities will involve team members responsible for test preparation, review, execution, defect handling, and re-testing.

| Role              | Responsibility                                                                                                          | Assigned To         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **Test Planner**  | Prepare and maintain the Test Plan and define the testing scope, environment, responsibilities, and schedule.           | Trịnh Khánh Linh    |
| **Test Designer** | Review existing generated test cases, refine them where necessary, and prepare additional functional test cases.        | Trịnh Khánh Linh    |
| **Test Reviewer** | Review the Test Plan and test cases and provide feedback before the documents are finalized.                            | Trần Anh Kiệt       |
| **Test Executor** | Execute the final test cases and record execution date, Pass/Fail status, and Actual Result.                            | Sanguine Developers |
| **Bug Reporter**  | Document defects found during testing, including reproduction steps, expected and actual results, severity, and status. | Trịnh Khánh Linh  |
| **Developer**     | Investigate and fix defects identified during testing and provide the updated implementation for re-testing.            | Sanguine Developers |
| **Re-tester**     | Re-test resolved defects and verify whether the reported issue has been successfully fixed.                             | Trịnh Khánh Linh   |

### 4.2 Test Schedule

The testing activities will be conducted according to the following schedule:

| Step   | Activity                                                        | Schedule                    |
| ------ | --------------------------------------------------------------- | --------------------------- |
| **1**  | Finalize Test Plan and prepare the testing environment.         | **10/08/2026**              |
| **2**  | Review previously generated Spec Kit test cases.                | **11/08/2026**              |
| **3**  | Refine incorrect or incomplete generated test cases.            | **12/08/2026**              |
| **4**  | Add missing test cases for insufficiently covered scenarios.    | **13/08/2026**              |
| **5**  | Review and finalize the complete test case set.                 | **14/08/2026**              |
| **6**  | Execute all final functional test cases.                        | **15/08/2026 – 16/08/2026** |
| **7**  | Record execution dates, Pass/Fail statuses, and Actual Results. | **15/08/2026 – 16/08/2026** |
| **8**  | Document and report identified defects.                         | **During test execution**   |
| **9**  | Fix and re-test reported defects where applicable.              | **17/08/2026**              |
| **10** | Prepare the final test summary and testing documentation.       | **18/08/2026**              |

The schedule may be adjusted if unexpected defects, implementation issues, or other testing constraints affect the planned activities.


---

## 5. Entry and Exit Criteria


### 5.1 Entry Criteria

Manual test execution can begin when the following conditions are satisfied:

* The five selected features are implemented and accessible in the current testing environment.
* The frontend application is available for testing.
* Required backend services are running and accessible.
* The AI service is available for testing the chatbot functionality.
* The database and other required supporting services are accessible.
* Required test accounts and test data are available.
* Previously generated Spec Kit test cases have been reviewed and understood.
* The final test cases have been reviewed and refined or newly created where necessary.
* The testing environment is sufficiently stable to begin functional test execution.

### 5.2 Exit Criteria

The testing phase will be considered complete when all of the following exit and acceptance criteria are satisfied:

* **Test Execution Completeness**:
  * 100% of planned functional test cases across the five selected features are executed (with a minimum of 50 test cases; 73 test cases executed in total).
  * Each executed test case contains its Test Case ID, Execution Date, Pass/Fail/Warning status, and documented Actual Result.
* **Defect Resolution & Re-testing Requirements**:
  * **100% of Critical (Severity 1) and High (Severity 2) defects** must be resolved by the development team and **formally re-tested and verified** by the QA team (Zero open Critical or High defects allowed upon completion).
  * All fixed defects must undergo regression testing on affected modules to ensure fixes do not introduce secondary issues.
  * Medium and Low severity defects must be resolved or have documented workarounds accepted by the team.
* **Defect Traceability**:
  * Every failed test case is explicitly linked to at least one corresponding bug report.
  * Each reported bug contains complete details: Bug ID, description, steps to reproduce, expected result, actual result, severity, and resolution/retest status.
* **Explicit Acceptance Criteria**:
  * **Overall Pass Rate**: The final test pass rate reaches at least **90%** across all executed test cases after re-testing.
  * **Core Workflow Validation**: All critical business workflows (Account Authentication, Appointment Booking & Cancellation Rules, Campaign Creation & QR Verification, SOS Request Lifecycle, AI Chatbot Assistance) operate reliably without blocking issues.
* **Test Documentation & Reporting**:
  * The final test summary records the number of features tested, total test cases, passed/failed test cases, and defect metrics for each tested feature.
  * Complete testing documentation (Test Plan, Test Cases, and Test Execution & Bug Reports) is reviewed, finalized, and signed off.
