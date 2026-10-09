# CureLink

CureLink is a MERN-stack healthcare web application for managing appointments, clinical consultations, prescriptions, medical records, and healthcare administration.

The system supports three primary roles:

- **Patient** — book appointments, view medical history, manage prescriptions
- **Doctor** — manage schedules, conduct consultations, record diagnoses and prescriptions
- **Administrator** — oversee doctors, patients, appointments, and platform analytics

---

## Clinical Workflow

CureLink implements a complete, end-to-end clinical workflow:

```text
Booking → Consultation → Diagnosis & Treatment → Prescription → Patient Medical History
```

1. **Booking** — Patients browse doctors by specialization, view real-time slot availability, and book appointments. Double-booking is prevented at both the application and database level.
2. **Consultation** — Doctors start a consultation from an appointment. The workspace captures chief complaint, examination findings, diagnosis, and treatment plan.
3. **Diagnosis & Treatment** — Structured clinical data (diagnoses, notes, assessment) is recorded within the consultation and becomes immutable once completed.
4. **Prescription** — Medications are prescribed during the consultation with dosage, frequency, duration, and instructions. Prescriptions are linked to the consultation record.
5. **Patient Medical History** — Completed consultations, diagnoses, and prescriptions appear in the patient's medical history timeline, accessible to both the patient and their treating doctors.

---

## Key Features (SRS Alignment)

| Requirement | Implementation |
|---|---|
| **Double-Booking Protection** | Explicit conflict check before insert + unique compound index on the Appointment model prevents concurrent booking of the same time slot |
| **Role-Based Access Control** | `protect` + `authorize` middleware enforces role restrictions on every API route (patient, doctor, admin) |
| **Consultation Immutability** | Completed consultations cannot be modified; the `completeConsultation` service marks status as `completed` and locks further edits |
| **Atomic Consultation Completion** | Consultation completion atomically updates both the consultation record and the linked appointment status |
| **Prescription Upsert** | `findOneAndUpdate` with `upsert: true` ensures exactly one prescription per consultation, preventing duplicates |
| **In-App Reminders (FR-09)** | Patient dashboard displays a highlighted, dismissible banner for appointments within the next 24 hours |
| **Profile Management (FR-01)** | Shared profile page with view/edit mode for both patient and doctor roles, connected to `PUT /api/auth/me` |
| **Schedule Management** | Doctors define weekly working hours; slots are auto-generated and can be individually managed or bulk-cancelled |
| **Rate Limiting** | Auth endpoints are rate-limited (20 requests per 15-minute window) via `express-rate-limit` |
| **Security Headers** | Helmet middleware applies security headers; CSP is enforced in production mode |

---

## Project Structure

```text
CureLink/
│
├── client/                          # Frontend — React (Vite)
│   └── src/
│       ├── components/              # Reusable UI components
│       │   ├── common/              # Button, Card, EmptyState, Modal
│       │   ├── layout/              # Navbar, navigation
│       │   ├── patient/             # AppointmentCard, MedicalRecordCard
│       │   ├── doctor/              # Doctor-specific components
│       │   └── admin/               # Admin-specific components
│       ├── pages/
│       │   ├── auth/                # Login, Register
│       │   ├── patient/             # Dashboard, Appointments, BookAppointment,
│       │   │                        # Doctors, DoctorProfile, MedicalHistory
│       │   ├── doctor/              # DoctorDashboard, Schedule, Appointments,
│       │   │                        # ConsultationWorkspace, Patients, Consultations
│       │   ├── admin/               # AdminDashboard, Doctors, Patients, Appointments
│       │   └── shared/              # Profile (view/edit)
│       ├── context/                 # AuthContext, ToastContext
│       ├── services/                # API service modules
│       ├── routes/                  # Route definitions
│       ├── hooks/                   # Custom React hooks
│       ├── utils/                   # Utilities (dateUtils, etc.)
│       └── styles/                  # global.css
│
├── server/                          # Backend — Express + MongoDB
│   ├── config/                      # Database connection (db.js)
│   ├── controllers/                 # Route handlers
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # Base user (name, email, password, role)
│   │   ├── Patient.js               # Extended patient profile (allergies, conditions, surgeries, meds)
│   │   ├── Doctor.js                # Extended doctor profile
│   │   ├── Appointment.js           # Appointment records
│   │   ├── Slot.js                  # Doctor availability slots
│   │   ├── Consultation.js          # Clinical consultation records
│   │   └── Prescription.js          # Medication prescriptions
│   ├── routes/                      # Express route definitions
│   ├── services/                    # Business logic layer
│   ├── middleware/                   # Auth, error handling
│   ├── validators/                  # Input validation
│   ├── scripts/                     # CLI utilities (createAdmin, seedDoctors)
│   └── server.js                    # Application entry point
│
├── .env.example                     # Environment variable template
├── package.json                     # Root workspace scripts
└── README.md
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite |
| Styling | Vanilla CSS (BEM naming) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT (HTTP-only cookies) |
| Security | Helmet, express-rate-limit, bcryptjs |
| Dev Tools | Nodemon, Vite HMR |

---

## API Endpoint Reference

All endpoints are prefixed with `/api`. Protected routes require an authenticated session (JWT cookie).

### Auth & Profile (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Register a new patient account |
| `POST` | `/login` | — | Log in and receive a session cookie |
| `POST` | `/logout` | Yes | Log out and clear the session cookie |
| `GET` | `/me` | Yes | Get the current user's profile |
| `PUT` | `/me` | Yes | Update the current user's profile |

### Appointments (`/api/appointments`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/` | Yes | Patient | Book an appointment (with double-booking protection) |
| `GET` | `/me` | Yes | Patient | List the patient's own appointments |
| `GET` | `/doctor/me` | Yes | Doctor | List the doctor's own appointments |
| `GET` | `/patient/:patientId` | Yes | Doctor | List a specific patient's appointments |
| `GET` | `/:id` | Yes | Any | Get a single appointment by ID |
| `PUT` | `/:id/cancel` | Yes | Any | Cancel an appointment |

### Doctors & Schedules (`/api/doctors`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/` | Yes | Any | List all doctors (with specialization filter) |
| `GET` | `/:id` | Yes | Any | Get a doctor's public profile |
| `GET` | `/:id/slots` | Yes | Any | Get a doctor's available slots for a date |
| `GET` | `/:id/availability` | Yes | Any | Get a doctor's availability calendar |
| `GET` | `/me` | Yes | Doctor | Get own doctor profile |
| `PUT` | `/me` | Yes | Doctor | Update own doctor profile |
| `GET` | `/me/dashboard` | Yes | Doctor | Get dashboard metrics and today's schedule |
| `GET` | `/me/schedule` | Yes | Doctor | Get weekly working-hours schedule |
| `PUT` | `/me/schedule` | Yes | Doctor | Update weekly working-hours schedule |
| `GET` | `/me/slots` | Yes | Doctor | List own slots |
| `POST` | `/me/slots` | Yes | Doctor | Create individual slots |
| `POST` | `/me/slots/from-working-hours` | Yes | Doctor | Auto-generate slots from working hours |
| `POST` | `/me/slots/cancel-day` | Yes | Doctor | Cancel all slots for a specific date |
| `PUT` | `/me/slots/:slotId` | Yes | Doctor | Update a slot |
| `DELETE` | `/me/slots/:slotId` | Yes | Doctor | Delete a slot |
| `GET` | `/me/patients` | Yes | Doctor | List the doctor's patients |
| `GET` | `/me/patients/:patientId` | Yes | Doctor | Get a patient's details |

### Consultations (`/api/consultations`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `POST` | `/` | Yes | Doctor | Start a new consultation from an appointment |
| `GET` | `/doctor/me` | Yes | Doctor | List the doctor's consultations |
| `GET` | `/me` | Yes | Patient | List the patient's consultations |
| `GET` | `/:id` | Yes | Doctor, Patient | Get a consultation by ID |
| `PUT` | `/:id` | Yes | Doctor | Update consultation (diagnosis, notes, treatment) |
| `PUT` | `/:id/complete` | Yes | Doctor | Complete and lock the consultation |

### Prescriptions (`/api/prescriptions`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `PUT` | `/consultation/:consultationId` | Yes | Doctor | Create or update a prescription for a consultation |
| `GET` | `/consultation/:consultationId` | Yes | Doctor, Patient | Get the prescription for a consultation |
| `GET` | `/doctor/me` | Yes | Doctor | List all prescriptions by the doctor |
| `GET` | `/me` | Yes | Patient | List the patient's prescriptions |
| `GET` | `/me/active` | Yes | Patient | List the patient's active (current) medications |

### Admin (`/api/admin`)

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/stats` | Yes | Admin | Platform statistics (counts, trends) |
| `GET` | `/doctors` | Yes | Admin | List all doctors |
| `POST` | `/doctors` | Yes | Admin | Register a new doctor account |
| `PUT` | `/doctors/:id` | Yes | Admin | Update a doctor |
| `DELETE` | `/doctors/:id` | Yes | Admin | Delete a doctor |
| `GET` | `/patients` | Yes | Admin | List all patients |
| `DELETE` | `/patients/:id` | Yes | Admin | Delete a patient |
| `GET` | `/appointments` | Yes | Admin | List all appointments |
| `PUT` | `/appointments/:id/status` | Yes | Admin | Update an appointment's status |

### Health Check

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/status` | — | Returns server status and timestamp |

---

## Environment Setup

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- [MongoDB](https://www.mongodb.com/) (local instance or Atlas)

### 2. Environment Configuration

Copy the environment template and configure your values:

```bash
cp .env.example .env
```

Required variables (see `.env.example`):

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/curelink` |
| `JWT_SECRET` | Secret key for JWT signing | *(must be set)* |
| `JWT_EXPIRE` | JWT expiration duration | `7d` |
| `CLIENT_URL` | Frontend URL (for CORS) | `http://localhost:5173` |

> **Important:** Never commit `.env` to version control. The `.gitignore` already excludes it.

### 3. Install Dependencies

From the project root:

```bash
npm run install-all
```

This installs both `client/` and `server/` dependencies.

### 4. Create an Admin Account

An admin account is required to manage the platform:

```bash
cd server
npm run create:admin
```

Follow the interactive prompts to set admin credentials.

### 5. Seed Sample Doctors (Optional)

To populate the system with sample doctor profiles:

```bash
cd server
npm run seed:doctors
```

### 6. Run the Application

Open two terminals from the project root:

**Terminal 1 — Backend Server:**
```bash
npm run server-dev
```
The server runs on [http://localhost:5000](http://localhost:5000).

**Terminal 2 — Frontend Client:**
```bash
npm run client-dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Role Credentials

After setup, the following roles are available:

| Role | How to Access |
|---|---|
| **Patient** | Register a new account via the Sign Up page |
| **Doctor** | Created by an administrator through the Admin → Doctors panel |
| **Admin** | Created via `npm run create:admin` CLI script |

---

## Architecture

```text
React Frontend (Vite)
      ↓
React Router (role-based layouts)
      ↓
API Service Modules (centralized fetch wrappers)
      ↓
Express REST API
      ↓
Auth Middleware (JWT + role authorization)
      ↓
Controllers (HTTP layer)
      ↓
Application Services (business logic)
      ↓
Mongoose Models
      ↓
MongoDB
```

### Three-Layer Separation

1. **Presentation Layer** — React pages and components. No database or business logic.
2. **Application / Business Logic Layer** — Express services with deterministic rules (booking conflicts, consultation state machines, prescription upsert logic).
3. **Data Layer** — Mongoose models and database queries. Accessed only through the backend.

---

## Development Workflow

CureLink is developed by a team of five. Each developer works on their own branch:

```text
main
├── parth
├── ayush
├── swayam
├── likhit
└── adarsh
```

### Commit Convention

```text
feat: add patient appointments page
fix: correct appointment route
style: update button styles
refactor: extract appointment card component
```


---

## License

This project is developed for educational and demonstration purposes as part of a team software engineering project.
