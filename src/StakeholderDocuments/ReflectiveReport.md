# Reflective Report - Project Assignment 5 (PA5-2026)

**Course:** CSC13002 - Introduction to Software Engineering  
**Project Name:** LifeLine  
**Group ID:** 05  
**Date:** 26/08/2026

---

## 1. Team Experience
> **Performed by:** Trần Anh Kiệt | **Reviewed by:** Trịnh Khánh Linh | **Edited by:** Trần Anh Kiệt

### 1.1 What Went Well
- **Collaboration & Communication:** The team used Messenger to communicate, discuss issues, announce updates, and chat about the project. Task management and task assignments were tracked on Jira, while our GitHub repository served as the project's storage. Environment files and API keys were shared privately via Messenger, and bug tracking or test cases were managed through Google Sheets. Scrum meetings were held on Google Meet for face-to-face communication, discussing direction, and updating project status.
- **Technical Milestones:** The most crucial milestone was in PA3, where the team started coding and building the foundational system, UI, and basic workflow for Donors and BloodCenterStaff. This base allowed us to continue expanding into the current system. Subsequent milestones included the AI-Chatbot integration and the addition of features and interfaces for other actors such as BloodCenterStaff, HospitalStaff, and Admin.
- **Problem Solving:** We faced challenges in time management due to differing member schedules. Therefore, the team had to adapt to each other's availability and distribute tasks more efficiently: those busy on weekends worked more during the week, and vice versa. Initially, we also struggled with a working model where Frontend and Backend were divided among different people and merged later; this proved inefficient and consumed too much time during integration. Consequently, we shifted to a model where one person is responsible for both the Frontend and Backend of a specific feature.

### 1.2 Challenges Faced & Mitigations
- **Challenge 1: Cross-Actor Feature Interactions Causing Schema Churn**
  - *Description:* Features like emergency SOS requests required multiple actors (Donor, Blood Center Staff, and Hospital) interacting within a single workflow. This made the implementation very difficult and required frequent revisions to the database and code.
  - *Mitigation/Solution:* We moved from parallel to sequenced implementation. One developer stabilized the core data contract (API and schema) for a shared flow first before other actors built against it, significantly reducing rework.
- **Challenge 2: Integration Overhead Between Frontend and Backend**
  - *Description:* In earlier sprints, having one person build the API and another build the UI for the same feature caused major delays and integration friction.
  - *Mitigation/Solution:* We adjusted task assignments so that whoever implemented the backend for a specific feature also owned the frontend API integration for that feature end-to-end.
- **Challenge 3: Database Payload Size Slowing Frontend Load Times**
  - *Description:* As data volume grew across campaigns, bookings, and notifications, returning entire collections in a single response caused noticeable dashboard slowdowns.
  - *Mitigation/Solution:* We mandated page-based data loading (pagination) on all list-returning API endpoints, keeping frontend load times manageable as the dataset expanded.
- **Challenge 4: Deployment Bugs**
  - *Description:* Code running locally is one thing, but deploying it to hosting platforms like Vercel and Render resulted in quite a few system errors.
  - *Mitigation/Solution:* We consistently relied on AI to help debug and redeploy, systematically fixing system errors and ensuring consistency across environments.
- **Challenge 5: Timezone Discrepancies**
  - *Description:* Initially, team members did not pay attention to timezones while coding. Upon deployment, Vercel used international timezones, which created numerous bugs related to displaying campaign schedules differently locally versus on the server.
  - *Mitigation/Solution:* We had to refactor the code and synchronize everything using the `dayjs` library to strictly enforce the Vietnam timezone.

---

## 2. Spec Kit Experience (Specification-Driven Development)
> **Performed by:** Trần Anh Kiệt | **Reviewed by:** Trịnh Khánh Linh | **Edited by:** Trần Anh Kiệt

### 2.1 Overview of Experience
The team successfully adopted Spec Kit starting from Sprint 3 to drive development and generate test cases. Initializing the shared GitHub repo and `constitution.md` laid a solid foundation. While it significantly accelerated artifact generation, the team had to learn how to standardize prompting approaches across 5 members to prevent divergent code structures. 

### 2.2 Benefits of Spec Kit vs. Traditional Development
- **Clarity of Requirements:** Having well-defined Use Case Specifications (generated and refined across 14 FGs) established clear contracts, reducing ambiguity before writing any code.
- **Automated Artifacts & Test Generation:** QA efforts were vastly accelerated. Spec Kit generated test cases for complex flows (like FG2 Booking and FG3 Campaign Management) rapidly, freeing QA bandwidth for execution rather than manual drafting.
- **Traceability:** There was a strong, direct link between the system specifications (Vision, Use Cases) and the resulting code artifacts, ensuring that no business rules (e.g., the 84-day rule) were missed during implementation.
- **Smooth Initialization:** Carefully planning and writing artifact files, and providing them to the AI to read, made setting up the initial codebase very smooth and fast. We encountered no issues during the initial deployment phase.

### 2.3 Limitations & Pain Points
- **Inconsistent Prompting Causing Merge Conflicts:** In Sprint 3, because members independently prompted Spec Kit against the same repository without a shared convention, it generated divergent code structures and styles, leading to painful merge conflicts on shared files.
- **Initial Overhead & Training:** Self-learning Spec Kit without a shared baseline led to varying levels of comprehension initially. It took time to define strict file ownership boundaries (shared vs. individual modules) to maximize the tool's effectiveness.
- **Maintenance Cost:** As cross-actor interactions evolved the MongoDB schemas during Sprint 4, keeping the previously generated Spec Kit tests and artifacts in perfect sync with the rapidly changing codebase required diligent manual oversight.
- **Continuous Modifications:** Using Spec Kit was primarily beneficial during the startup phase. As the project expanded with more features requiring extensive testing, updating the artifact files each time became incredibly time-consuming. Gradually, members tended to make direct code edits without using Spec Kit or updating the generated artifacts, causing a discrepancy between the artifact folders and the actual codebase.

---

## 3. AI Coding Tools Usage
> **Performed by:** Trần Anh Kiệt | **Reviewed by:** Trịnh Khánh Linh | **Edited by:** Trần Anh Kiệt

### 3.1 Tools Employed
- **Tools:** Google Gemini Pro, Claude, Google AI Stitch.

### 3.2 Effective Aspects & Productivity Gains
- **Boilerplate & CRUD Generation:** Utilizing AI tools massively accelerated the setup of our Node.js API endpoints, Mongoose schema definitions, and React component scaffolding. Gemini generated repetitive CRUD boilerplate almost instantly.
- **Documentation & UI Prototyping:** AI dramatically improved our ability to draft massive documents (14 Functional Groups). Google AI Stich allowed us to quickly visualize UI prototypes for complex pages (e.g., Dashboards, Booking Maps).
- **Architecture Exploration:** Gemini Pro assisted in structuring our BullMQ worker logic and Python FastAPI FAISS integration, providing helpful examples for semantic caching.

### 3.3 Limitations & Challenges Encountered
- **Context Window / Stale Context:** When working with 10 domain modules, AI often lost track of the broader architectural constraints, sometimes proposing solutions that worked locally but violated our global domain boundaries.
- **Complex Business Logic:** AI struggled to inherently understand multi-step domain logic, such as the 84-day rule verification combined with MongoDB geospatial queries. We had to break these down into very explicit micro-prompts.
- **Translation & Formatting Overhead:** Initially, AI tools outputting or translating between Vietnamese and English caused Markdown formatting glitches, requiring manual cleanup across Mermaid diagrams and tables.
- **Bug Fixing Side Effects:** When resolving bugs for specific features, AI often suggested changes that inadvertently modified other files. Consequently, fixing one bug would break another feature during testing, leading to a repetitive cycle of fixing and re-testing.

---

## 4. SDLC Process Feedback & Suggestions
> **Performed by:** Trần Anh Kiệt | **Reviewed by:** Trịnh Khánh Linh | **Edited by:** Trần Anh Kiệt

### 4.1 Evaluation of Current Course SDLC Workflow
- **Strengths of the Process:** The phased approach (PA1 to PA5) provided a structured learning curve. Spec-driven development forced the team to thoroughly analyze and document business logic (like cross-actor interactions) before writing code, drastically reducing late-stage architectural failures.
- **Bottlenecks / Areas for Improvement:** Early sprints felt overly documentation-heavy, leading to a crunch during actual implementation. Furthermore, generating pixel-perfect UI prototypes in early sprints was mostly obsolete once actual development started, as real constraints modified the UI design. Additionally, the application of the SDLC workflow during the final testing and bug-fixing phases was minimal; most fixes were done directly via AI prompting and manual patches.

### 4.2 Actionable Recommendations for Future Iterations
1. **PA Structure & Milestones:** Suggest shifting some coding tasks to PA2 instead of bunching all implementations into PA3 and PA4. This provides a longer runway for integrating frontend and backend cleanly.
2. **Tools & Tooling Support:** Provide a standardized Spec Kit shared-repo template and common prompting guide earlier in the course. This would prevent the painful merge conflicts we experienced when 5 members prompted Spec Kit differently on shared files.
3. **Spec Kit / AI Guidelines:** Advise teams to time-box UI prototyping tasks. Emphasize low-fidelity "wireframes to guide implementation" over high-fidelity mockups to save valuable sprint capacity for backend logic and test automation.

---

## 5. Individual Contributions & Reflections
> **Performed by:** All Team Members | **Reviewed by:** Trần Anh Kiệt | **Edited by:** Trần Anh Kiệt

*Note: Each member must write 3–5 sentences reflecting on their individual contribution, technical growth, and key takeaways.*

**Suggested format:** During the project, I was mainly responsible for [your role / tasks]. My main contributions included [specific features, documents, development/testing/design tasks]. One contribution that I consider particularly significant was [specific contribution], because [why it was important to the project].

### 5.1 Trần Anh Kiệt - 24127287 - Role: Project Manager, Full-stack Developer
> [Write 3–5 sentences: Detail specific modules implemented (e.g., Campaign management, Auth), tools mastered, challenges overcome, and key lessons learned regarding team collaboration or SDLC].

Throughout this project, I was responsible for implementing the Auth module, monitoring and debugging the Donor blood donation registration flow, and handling Campaign Bookings. Additionally, I built the frontend for the Landing Page, updated the Donor Dashboard UI, brainstormed and guided the implementation of the AI Chatbot, managed the project, assigned tasks, and planned each sprint. The challenges I faced included balancing coding responsibilities with managing documentation and tracking the team's coding progress. Assigning tasks and brainstorming the project from scratch was very difficult and required extensive use of AI for planning, creating project schedules, and distributing tasks. I also had to pre-determine the framework, models, and development direction to establish a stable base for coding. The key takeaway from this project is the necessity of speeding up the documentation process and deeply analyzing the feasibility of the project and individual features before crafting the Use Case Specifications.

### 5.2 [Student 2 Name - Student ID - Role: e.g., Frontend Lead / UI-UX Designer]
> [Write 3–5 sentences: Detail specific modules implemented (e.g., Booking workflow, Donor Dashboard), UI/UX improvements, and lessons learned about building responsive and accessible interfaces].

### 5.3 [Student 3 Name - Student ID - Role: e.g., QA / Test Engineer / Full-stack Developer]
> [Write 3–5 sentences: Detail specific work on test planning, use case execution, bug tracking, Spec Kit refinement, and lessons learned on software quality assurance].

### 5.4 [Student 4 Name - Student ID - Role: e.g., Full-stack Developer]
> [Write 3–5 sentences: Detail contributions, technical growth, and individual takeaways].

*(Add additional members if applicable)*
