# Reflective Report - Project Assignment 5 (PA5-2026)

**Course:** CSC13002 - Introduction to Software Engineering  
**Project Name:** LifeLine  
**Group ID:** 05  
**Date:** 26/08/2026

---

## 1. Team Experience
> **Performed by:** Trần Anh Kiệt | **Reviewed by:** Trịnh Khánh Linh | **Edited by:** Trần Anh Kiệt

### 1.1 What Went Well
- **Collaboration & Communication:** Team sử dụng Messenger để giao tiếp và trao đổi các vấn đề, thông báo những cập nhật cũng như là giao tiếp, trò chuyện về đồ án. Việc quản lý task cũng như phân công công việc được cập nhật ở trên Jira và repo Github của nhóm là nơi để lưu trữ dự án. Về các file env và key api, team sẽ gửi riêng qua Messenger, đối với các Bug hay TestCase thì team sẽ quản lý thông qua Google Sheet. Những cuộc họp meeting Scrum được tổ chức ở Google Meet để giao tiếp trực tiếp, bàn về hướng đi cũng như tình trạng của nhóm.
- **Technical Milestones:** Milestone quan trọng nhất là ở PA3, đó là khi mà team bắt đầu code và xây dựng lên base cơ bản về hệ thống cũng như là giao diện và luồng hoạt động cơ bản cho Donor và BloodCenterStaff, để từ đó tiếp tục xây dựng lên hệ thống hiện tại. Tiếp theo là những Milestone về AI-Chatbot, về các tính năng và giao diện được cập nhật thêm cho các actor như BloodCenterStaff, HospitalStaff và Admin.
- **Problem Solving:** Team gặp nhiều vấn đề trong việc quản lý thời gian
When the team encountered massive integration overhead during Sprint 3 due to splitting frontend and backend development between different owners, we quickly pivoted to a "single full-stack owner per functional group" model. This drastically improved velocity and ensured zero missed deadlines in Sprint 4.

### 1.2 Challenges Faced & Mitigations
- **Challenge 1: Cross-Actor Feature Interactions Causing Schema Churn**
  - *Description:* Features like SOS emergency coordination involved Donor, Blood Center Staff, and Hospital Staff interacting with the same data. Developing these simultaneously led to continuous database schema changes mid-implementation.
  - *Mitigation/Solution:* We moved from parallel to sequenced implementation. One developer stabilized the core data contract (API and schema) for a shared flow first before other actors built against it, significantly reducing rework.
- **Challenge 2: Integration Overhead Between Frontend and Backend**
  - *Description:* In earlier sprints, having one person build the API and another build the UI for the same feature caused major delays and integration friction.
  - *Mitigation/Solution:* We adjusted task assignments so that whoever implemented the backend for a specific feature also owned the frontend API integration for that feature end-to-end.
- **Challenge 3: Database Payload Size Slowing Frontend Load Times**
  - *Description:* As data volume grew across campaigns, bookings, and notifications, returning entire collections in a single response caused noticeable dashboard slowdowns.
  - *Mitigation/Solution:* We mandated page-based data loading (pagination) on all list-returning API endpoints, keeping frontend load times manageable as the dataset expanded.

---

## 2. Spec Kit Experience (Specification-Driven Development)
> **Performed by:** Trịnh Khánh Linh | **Reviewed by:** Trần Anh Kiệt | **Edited by:** Trịnh Khánh Linh

### 2.1 Overview of Experience
The team successfully adopted Spec Kit starting from Sprint 2 to drive development and generate test cases. Initializing the shared GitHub repo and `constitution.md` laid a solid foundation. While it significantly accelerated artifact generation, the team had to learn how to standardize prompting approaches across 5 members to prevent divergent code structures. 

### 2.2 Benefits of Spec Kit vs. Traditional Development
- **Clarity of Requirements:** Having well-defined Use Case Specifications (generated and refined across 14 FGs) established clear contracts, reducing ambiguity before writing any code.
- **Automated Artifacts & Test Generation:** QA efforts were vastly accelerated. Spec Kit generated test cases for complex flows (like FG2 Booking and FG3 Campaign Management) rapidly, freeing QA bandwidth for execution rather than manual drafting.
- **Traceability:** There was a strong, direct link between the system specifications (Vision, Use Cases) and the resulting code artifacts, ensuring that no business rules (e.g., the 84-day rule) were missed during implementation.

### 2.3 Limitations & Pain Points
- **Inconsistent Prompting Causing Merge Conflicts:** In Sprint 3, because members independently prompted Spec Kit against the same repository without a shared convention, it generated divergent code structures and styles, leading to painful merge conflicts on shared files.
- **Initial Overhead & Training:** Self-learning Spec Kit without a shared baseline led to varying levels of comprehension initially. It took time to define strict file ownership boundaries (shared vs. individual modules) to maximize the tool's effectiveness.
- **Maintenance Cost:** As cross-actor interactions evolved the MongoDB schemas during Sprint 4, keeping the previously generated Spec Kit tests and artifacts in perfect sync with the rapidly changing codebase required diligent manual oversight.

---

## 3. AI Coding Tools Usage
> **Performed by:** Trần Đức Quý | **Reviewed by:** Nguyễn Quốc Dương | **Edited by:** Trần Anh Kiệt

### 3.1 Tools Employed
- **Tools:** GitHub Copilot for Students, Cursor, Spec Kit, ChatGPT, v0, Bolt.

### 3.2 Effective Aspects & Productivity Gains
- **Boilerplate & CRUD Generation:** Utilizing AI tools massively accelerated the setup of our Node.js API endpoints, Mongoose schema definitions, and React component scaffolding. Cursor generated repetitive CRUD boilerplate almost instantly.
- **Documentation & UI Prototyping:** AI dramatically improved our ability to draft massive documents (14 Functional Groups). Tools like v0 and Bolt allowed us to quickly visualize UI prototypes for complex pages (e.g., Dashboards, Booking Maps).
- **Architecture Exploration:** ChatGPT and Cursor assisted in structuring our BullMQ worker logic and Python FastAPI FAISS integration, providing helpful examples for semantic caching.

### 3.3 Limitations & Challenges Encountered
- **Context Window / Stale Context:** When working with 10 domain modules, AI often lost track of the broader architectural constraints, sometimes proposing solutions that worked locally but violated our global domain boundaries.
- **Complex Business Logic:** AI struggled to inherently understand multi-step domain logic, such as the 84-day rule verification combined with MongoDB `$near` geospatial queries. We had to break these down into very explicit micro-prompts.
- **Translation & Formatting Overhead:** Initially, AI tools outputting or translating between Vietnamese and English caused Markdown formatting glitches, requiring manual cleanup across Mermaid diagrams and tables.

---

## 4. SDLC Process Feedback & Suggestions
> **Performed by:** Trần Minh Triết | **Reviewed by:** Trần Anh Kiệt | **Edited by:** Trần Anh Kiệt

### 4.1 Evaluation of Current Course SDLC Workflow
- **Strengths of the Process:** The phased approach (PA1 to PA5) provided a structured learning curve. Spec-driven development forced the team to thoroughly analyze and document business logic (like cross-actor interactions) before writing code, drastically reducing late-stage architectural failures.
- **Bottlenecks / Areas for Improvement:** Early sprints felt overly documentation-heavy, leading to a crunch during actual implementation. Furthermore, generating pixel-perfect UI prototypes in early sprints was mostly obsolete once actual development started, as real constraints modified the UI design.

### 4.2 Actionable Recommendations for Future Iterations
1. **PA Structure & Milestones:** Suggest shifting some coding tasks to PA2 instead of bunching all implementations into PA3 and PA4. This provides a longer runway for integrating frontend and backend cleanly.
2. **Tools & Tooling Support:** Provide a standardized Spec Kit shared-repo template and common prompting guide earlier in the course. This would prevent the painful merge conflicts we experienced when 5 members prompted Spec Kit differently on shared files.
3. **Spec Kit / AI Guidelines:** Advise teams to time-box UI prototyping tasks. Emphasize low-fidelity "wireframes to guide implementation" over high-fidelity mockups to save valuable sprint capacity for backend logic and test automation.

---

## 5. Individual Contributions & Reflections
> **Performed by:** [All Team Members] | **Reviewed by:** [Team Leader] | **Edited by:** [Team Leader]

*Note: Each member must write 3–5 sentences reflecting on their individual contribution, technical growth, and key takeaways.*

**Suggested format:** During the project, I was mainly responsible for [your role / tasks]. My main contributions included [specific features, documents, development/testing/design tasks]. One contribution that I consider particularly significant was [specific contribution], because [why it was important to the project].

### 5.1 [Student 1 Name - Student ID - Role: e.g., Backend Lead / Full-stack Developer]
> [Write 3–5 sentences: Detail specific modules implemented (e.g., Campaign management, Auth), tools mastered, challenges overcome, and key lessons learned regarding team collaboration or SDLC].

### 5.2 [Student 2 Name - Student ID - Role: e.g., Frontend Lead / UI-UX Designer]
> [Write 3–5 sentences: Detail specific modules implemented (e.g., Booking workflow, Donor Dashboard), UI/UX improvements, and lessons learned about building responsive and accessible interfaces].

### 5.3 [Student 3 Name - Student ID - Role: e.g., QA / Test Engineer / Full-stack Developer]
> [Write 3–5 sentences: Detail specific work on test planning, use case execution, bug tracking, Spec Kit refinement, and lessons learned on software quality assurance].

### 5.4 [Student 4 Name - Student ID - Role: e.g., Full-stack Developer]
> [Write 3–5 sentences: Detail contributions, technical growth, and individual takeaways].

*(Add additional members if applicable)*
