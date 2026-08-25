````md
# Agent Instructions

> This file is mirrored across `CLAUDE.md`, `AGENTS.md`, and `GEMINI.md`.
> All AI coding agents working on CureLink must follow these instructions.

---

# CureLink

CureLink is a MERN-based healthcare web application for managing appointments, consultations, medical records, communication, and healthcare administration.

The system supports three primary roles:

- Patient
- Doctor
- Administrator

The application must be developed as a structured, maintainable software project — not as an AI-generated prototype.

---

# 1. Core Development Philosophy

CureLink must remain:

- clean
- modular
- readable
- maintainable
- predictable
- consistently structured
- easy for another developer to understand

AI-generated code must never be accepted blindly.

Every component, function, service, route, model, and architectural decision must have a clear purpose.

## Never:

- generate unnecessary files
- create duplicate components
- create unnecessarily large files
- put unrelated responsibilities into one file
- introduce unnecessary abstractions
- introduce dependencies without justification
- rewrite working code without a reason
- create random folders
- create temporary/final/final2 style filenames
- place business logic inside UI components
- place database logic inside controllers
- place API calls directly throughout UI components
- hardcode data that should eventually come from the backend
- leave debugging code in production
- create fake functionality and present it as implemented functionality
- modify unrelated files

Prefer simple, explicit, readable code over clever or compressed code.

---

# 2. Three-Layer Architecture

CureLink follows a three-layer architecture that separates presentation, deterministic application logic, and data persistence.

LLMs are probabilistic.

Healthcare business rules must be deterministic.

AI must never silently control critical application behavior.

## Layer 1 — Presentation Layer

Responsible for:

- React pages
- React components
- forms
- navigation
- user interaction
- displaying application state

The presentation layer must NOT contain:

- database queries
- database connection logic
- core business rules
- authentication implementation
- appointment availability algorithms
- medical-record persistence logic

## Layer 2 — Application / Business Logic Layer

Responsible for deterministic application behavior.

Examples:

- appointment booking rules
- appointment cancellation rules
- appointment rescheduling
- schedule availability
- role-based permissions
- consultation workflows
- medical-record rules
- validation
- notification triggering
- application services

Business rules must be implemented explicitly in code.

They must not depend on an LLM response.

## Layer 3 — Data Layer

Responsible for:

- MongoDB
- Mongoose models
- database queries
- persistence
- relationships
- indexes
- database validation

Database access must remain separate from React components and presentation logic.

---

# 3. Technology Stack

## Frontend

- React
- React Router
- CSS / established styling system
- reusable React components

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Architecture

```text
React Frontend
      ↓
React Router
      ↓
API Services
      ↓
Express API
      ↓
Controllers
      ↓
Application Services
      ↓
Mongoose Models
      ↓
MongoDB
````

The frontend must never communicate directly with MongoDB.

---

# 4. Development Phases

Development must happen incrementally.

Do NOT attempt to generate the entire CureLink application in one operation.

## Phase 1 — Frontend Skeleton

This is the current development phase.

Build:

* navigation
* page layouts
* reusable UI components
* patient pages
* doctor pages
* administrator pages
* appointment booking screens
* empty states
* responsive layouts

At this stage:

* backend is not functional
* database is not connected
* API calls are not implemented
* authentication is not implemented
* real data is not required

The frontend must provide the complete structural foundation for later implementation.

Do not create unnecessary backend functionality during this phase.

## Phase 2 — Backend Foundation

Implement:

* Express server
* database connection
* API structure
* error handling
* middleware
* models
* controllers
* routes
* application services

## Phase 3 — Authentication and RBAC

Implement:

* registration
* login
* authentication
* role-based authorization
* protected routes

Roles:

* patient
* doctor
* administrator

## Phase 4 — Core Features

Implement in a controlled order:

1. Doctor profiles
2. Doctor schedules
3. Appointment availability
4. Appointment booking
5. Appointment management
6. Medical records
7. Consultations
8. Prescriptions
9. Lab results
10. Messages
11. Notifications and reminders

---

# 5. Project Folder Structure

Use this structure as the project grows.

```text
CureLink/
│
├── client/
│   │
│   ├── public/
│   │   └── assets/
│   │
│   └── src/
│       │
│       ├── assets/
│       │   ├── images/
│       │   └── icons/
│       │
│       ├── components/
│       │   ├── common/
│       │   ├── layout/
│       │   ├── patient/
│       │   ├── doctor/
│       │   └── admin/
│       │
│       ├── pages/
│       │   ├── auth/
│       │   ├── patient/
│       │   ├── doctor/
│       │   └── admin/
│       │
│       ├── routes/
│       │
│       ├── services/
│       │
│       ├── context/
│       │
│       ├── hooks/
│       │
│       ├── utils/
│       │
│       ├── styles/
│       │
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   │
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── database.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Do not create folders outside this structure without a clear architectural reason.

---

# 6. Frontend Architecture

## Pages

A page represents a complete screen or route.

Examples:

```text
pages/patient/Dashboard.jsx
pages/patient/Appointments.jsx
pages/patient/BookAppointment.jsx
pages/patient/MedicalHistory.jsx
pages/patient/Messages.jsx
```

Pages should primarily compose components.

A page should not become a giant file containing every UI element and every piece of business logic.

## Components

Components represent reusable UI pieces.

Examples:

```text
components/common/Button.jsx
components/common/Card.jsx
components/common/EmptyState.jsx

components/patient/AppointmentCard.jsx
components/patient/MedicalRecordCard.jsx
components/patient/ConversationItem.jsx
```

Before creating a component:

1. Check whether an existing component can be reused.
2. Check whether the functionality belongs in an existing component.
3. Create a new component only when it represents a distinct responsibility.

---

# 7. Patient Application

Patient navigation:

```text
Dashboard
Appointments
Medical History
Messages
```

## Dashboard

The Dashboard is an overview.

It may summarize:

* upcoming appointments
* recent medical history
* prescriptions
* lab results
* health overview

The Dashboard must NOT duplicate complete functionality from other pages.

The Dashboard should provide quick access to the dedicated pages.

## Appointments

The Appointments page is responsible for appointment management.

It should support:

* upcoming appointments
* past appointments
* appointment details
* rescheduling
* cancellation
* booking

Appointments must not be duplicated as a complete module inside Medical History.

## Book Appointment

Appointment booking should use a clear multi-step flow.

```text
Patient Data
      ↓
Slot Selection
      ↓
Review
```

The interface should clearly communicate the user's current step.

## Medical History

Medical History is responsible for clinical records.

It may contain:

* consultation records
* diagnoses
* prescriptions
* lab results
* medical timeline
* assessment details
* downloadable reports

Patients should not create their own medical records.

Medical records are created through authorized clinical workflows.

Do not add a "New Entry" button to the patient Medical History page.

## Messages

Messages is the dedicated communication area.

It should support:

* conversations
* doctor/care-team communication
* message history
* message composition

The patient interface should feel professional and healthcare-oriented rather than like a social-media or gaming chat application.

---

# 8. Doctor Application

Doctor navigation:

```text
Dashboard
My Schedule
Consultations
Patients
```

Doctor functionality includes:

* schedule management
* availability management
* appointment viewing
* patient viewing
* consultation recording
* diagnosis recording
* prescription recording
* medical-record updates

Doctors must only access patients and records they are authorized to access.

---

# 9. Administrator Application

Administrator navigation:

```text
Dashboard
Doctors
Appointments
Patients
Reports
```

Administrator functionality includes:

* doctor management
* patient management
* appointment oversight
* reporting
* platform monitoring

Administrative functionality must remain separate from patient and doctor workflows.

---

# 10. API Architecture

API communication must be centralized.

Do NOT write repeated API requests throughout components.

Use service modules such as:

```text
services/
├── api.js
├── authService.js
├── appointmentService.js
├── doctorService.js
├── medicalRecordService.js
└── messageService.js
```

Components should communicate with service functions.

Service functions communicate with the backend.

Do not put API request implementation directly into every page or component.

---

# 11. Backend Architecture

Use:

```text
server/
├── config/
├── controllers/
├── models/
├── routes/
├── middleware/
├── services/
├── utils/
└── server.js
```

## Routes

Routes define API endpoints and connect them to controllers.

## Controllers

Controllers handle:

* HTTP requests
* input extraction
* calling application services
* HTTP responses

Controllers should not contain large amounts of business logic.

## Services

Services contain deterministic application/business logic.

Examples:

```text
appointmentService.js
medicalRecordService.js
messageService.js
notificationService.js
```

## Models

Models define MongoDB/Mongoose schemas.

Models should describe data structure and persistence concerns.

Do not place unrelated application workflows inside models.

## Middleware

Middleware handles cross-cutting concerns such as:

* authentication
* authorization
* validation
* error handling

---

# 12. Database Rules

MongoDB must only be accessed through the backend.

Never place MongoDB credentials in source code.

Never commit:

```text
.env
```

Use:

```text
.env.example
```

to document required environment variables.

Each developer may use their own MongoDB connection during development.

The database schema must remain consistent across the team.

Schema changes must be communicated and reviewed before being merged.

Never modify another developer's database schema assumptions without communicating the change.

---

# 13. Security

CureLink handles healthcare-related information.

Security is therefore a core requirement.

Never:

* commit credentials
* expose database connection strings
* expose secrets in frontend code
* trust client-side role checks alone
* allow users to access another patient's medical records
* return sensitive information unnecessarily
* store sensitive secrets in Git

Authentication and authorization must be enforced on the backend.

---

# 14. UI / Design System

CureLink uses a professional healthcare SaaS visual language.

## Color Direction

Primary:

* clinical teal

Supporting:

* deep navy
* very light cool-gray background
* white surfaces
* muted slate text

Use teal primarily for:

* primary actions
* active navigation
* selected states
* important highlights
* healthcare-related accents

Do not overuse teal.

## Visual Style

Use:

* white cards
* subtle borders
* restrained shadows
* moderate corner radius
* clean sans-serif typography
* simple line icons
* generous but controlled spacing

Avoid:

* gradients
* glassmorphism
* excessive animations
* decorative blobs
* excessive illustrations
* excessive colors
* excessive rounded elements
* unnecessary visual effects

The UI should feel like a real healthcare application rather than an AI-generated template.

---

# 15. Design Consistency

All CureLink screens must share:

* typography
* colors
* spacing
* navigation
* button styles
* card styles
* icon style
* border treatment
* responsive behavior

Different roles may have different navigation and workflows, but they must still feel like the same CureLink product.

Do not independently redesign the visual language for each page.

---

# 16. Empty States

During the frontend-skeleton phase, use intentional empty states.

Do NOT create fake patient data.

Prefer:

```text
No upcoming appointments

Your scheduled consultations will appear here.

[Book an Appointment]
```

instead of:

```text
NO_APPOINTMENTS_FOUND
```

Do not expose internal developer/database identifiers to users.

Avoid user-facing labels such as:

```text
NO_HISTORY_FOUND
AWAITING_DATA
SYSTEM_READY
DATABASE_SYNCING
```

unless such terminology is genuinely appropriate for that particular interface.

Patient-facing language should be natural and human-readable.

---

# 17. No Fake Data Rule

Unless explicitly requested, do not invent:

* patients
* doctors
* appointments
* prescriptions
* diagnoses
* lab results
* messages
* statistics
* medical information

During the frontend-skeleton phase, use empty states and structural placeholders.

Do not make a prototype appear functional by inserting fake healthcare data.

---

# 18. Naming Conventions

React components:

```text
PascalCase
```

Examples:

```text
AppointmentCard.jsx
MedicalHistory.jsx
Navbar.jsx
```

Functions and variables:

```text
camelCase
```

Examples:

```text
getAppointments()
selectedAppointment
```

Constants:

```text
UPPER_SNAKE_CASE
```

Examples:

```text
USER_ROLES
APPOINTMENT_STATUS
```

Files must have names that clearly describe their responsibility.

Avoid names such as:

```text
test.jsx
newComponent.jsx
component2.jsx
final.jsx
final2.jsx
temp.jsx
stuff.jsx
```

---

# 19. State Management Rules

Keep state as close as possible to where it is used.

Do not create global state for values that only one component needs.

Use shared/global state only when multiple unrelated parts of the application genuinely need the same state.

Avoid unnecessary state duplication.

Do not store derived values in state when they can be calculated from existing state.

---

# 20. Form Rules

Forms should:

* have clear labels
* provide appropriate validation
* show meaningful error messages
* avoid unnecessary fields
* keep validation logic organized
* use reusable form components where appropriate

Do not silently accept invalid healthcare-related data.

---

# 21. Error Handling

Errors must be handled intentionally.

Do not expose raw:

* stack traces
* database errors
* internal server messages
* implementation details

to users.

User-facing errors should be clear and understandable.

Example:

```text
Unable to book this appointment.

Please select another available time slot.
```

rather than:

```text
MongoServerError: E11000 duplicate key error...
```

---

# 22. Git and Team Workflow

CureLink is developed by a team of five.

Each developer works on their own branch.

Example:

```text
main
├── parth
├── ayush
├── swayam
├── likhit
└── adarsh
```

Developers should:

1. Pull the latest changes before starting work.
2. Work only on their assigned branch.
3. Commit small, meaningful changes.
4. Push their branch regularly.
5. Keep their branch updated with changes from the team.
6. Communicate before changing shared files.
7. Review changes when shared components are affected.
8. Resolve conflicts before integration.
9. Never directly push to `main` except the team leader.
10. Test integrated changes before merging into `main`.

---

# 23. Shared Files

Extra care must be taken when modifying:

* `App.jsx`
* route configuration
* Navbar
* global styles
* design variables
* shared components
* package configuration
* environment configuration
* application configuration

Do not modify shared files casually.

If a shared file must be changed for a feature, keep the change minimal and communicate it to the team.

---

# 24. Commit Rules

Commits should describe what changed.

Good:

```text
feat: add patient appointments page
feat: add medical history empty state
style: update CureLink button styles
fix: correct appointment route
refactor: extract appointment card component
```

Avoid:

```text
update
changes
stuff
final
final2
fixed
working
```

Keep commits focused.

One commit should represent one logical change whenever practical.

---

# 25. AI Agent Rules

AI agents are coding assistants, not autonomous architects.

Before making changes:

1. Inspect the existing project structure.
2. Read the relevant files.
3. Understand the existing implementation.
4. Check whether an existing component can be reused.
5. Follow the established architecture.
6. Make the smallest appropriate change.
7. Do not modify unrelated files.
8. Verify the result after making changes.
9. Explain important architectural decisions when necessary.

If the requested change conflicts with the architecture, explain the conflict before proceeding.

Do not silently redesign the architecture.

Do not generate the entire application when the user requested one feature or one page.

---

# 26. Antigravity / AI Generation Rules

When generating code:

## First inspect

Before writing code, inspect:

* existing folders
* relevant pages
* relevant components
* routes
* styles
* services
* configuration

## Then plan

Identify:

* files that need to change
* files that need to be created
* reusable components
* dependencies
* possible conflicts

## Then implement

Make the smallest clean implementation that satisfies the request.

## Then verify

Check:

* imports
* routes
* component usage
* styling
* responsiveness
* build errors
* lint errors where applicable
* unintended changes

Never blindly overwrite working code.

---

# 27. No Vibecoding Rule

This is a hard project requirement.

CureLink must NOT look or behave like a generated demo.

Every implementation should answer:

* Why does this file exist?
* Why does this component exist?
* Why does this logic exist here?
* Why is this dependency required?
* Why is this state stored here?
* Why is this API structured this way?

Prefer:

```text
Readable code
+
Clear responsibility
+
Consistent architecture
```

over:

```text
Fast generated code
+
Large files
+
Duplicated logic
+
Unnecessary abstractions
```

The goal is not to minimize the amount of code.

The goal is to make the code understandable.

---

# 28. Current Development Rule

The current project phase is:

> FRONTEND SKELETON ONLY

Unless explicitly instructed otherwise:

## DO

* create page structures
* create reusable components
* create navigation
* create routes
* create responsive layouts
* create empty states
* match approved CureLink designs
* prepare clean architecture for later functionality

## DO NOT

* connect MongoDB
* create working APIs
* implement authentication
* implement real appointment booking
* implement real messaging
* implement medical-record persistence
* create fake healthcare data
* create unnecessary backend code
* add features that are not currently requested

The frontend must be structurally ready for future functionality without pretending that the functionality already exists.

---

# 29. Definition of Done

A feature is not complete merely because it renders.

Before considering a change complete:

* code follows the project structure
* existing components were reused where appropriate
* no duplicate logic was introduced
* no unrelated files were modified
* naming is consistent
* UI matches the CureLink design system
* responsive behavior is considered
* no unnecessary dependencies were added
* no debug code remains
* errors are handled appropriately
* implementation is understandable by another team member

---

# 30. Final Principle

Build CureLink as if a professional development team will maintain it for years.

Do not optimize for:

> "Can the AI generate this quickly?"

Optimize for:

> "Can another developer understand this immediately?"

Every line of code should have a reason to exist.

Every file should have a clear responsibility.

Every feature should fit the architecture.

Every page should feel like part of the same CureLink product.

The AI must follow the project.

The project must never be shaped around whatever code the AI happens to generate.

```
```
