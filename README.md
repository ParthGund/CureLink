# CureLink

CureLink is a MERN-stack web portal for booking doctor appointments, recording consultations and prescriptions, and keeping patient medical records. It is built against SRS **HEA-WEB-2026-052-SRS-v1.2**.

Three roles are supported:

- **Patient**: browse doctors, book a slot, keep a medical profile, view consultation history and prescriptions.
- **Doctor**: publish a weekly schedule, see booked appointments, run consultations, record a diagnosis and prescription.
- **Administrator**: manage doctor profiles and appointments, and monitor platform activity.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite, lucide-react |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB (Atlas or a replica set; 6.0+ recommended) |
| Auth | JWT stored in an httpOnly cookie, bcryptjs password hashing |
| Security middleware | helmet, cors, express-rate-limit (login and register), cookie-parser |

---

## Project structure

```text
CureLink/
├── .env.example              server environment template
├── package.json              convenience scripts
├── client/
│   ├── .env.example          VITE_API_URL
│   └── src/
│       ├── components/       admin, auth, common, doctor (+ consultation), layout, patient
│       ├── context/          AuthContext, ToastContext
│       ├── pages/            admin, auth, doctor, patient, public, shared
│       ├── routes/           AppRoutes.jsx
│       ├── services/         one module per API area, built on services/api.js
│       ├── styles/           global.css
│       └── utils/            date helpers
└── server/
    ├── config/               db connection, auth constants
    ├── controllers/          request/response handling
    ├── middleware/           authMiddleware (protect, authorize), errorMiddleware
    ├── models/               User, Patient, Doctor, Appointment, Slot, Consultation, Prescription
    ├── routes/               one router per resource
    ├── scripts/              createAdmin, seedDoctors, migrateEmbeddedPrescriptions
    ├── services/             business rules (booking, schedule, consultation, prescription)
    ├── utils/                generateToken, httpError, timeUtils
    └── validators/           request validation per resource
```

Request flow: route, then `protect` / `authorize`, then validator, then controller, then service, then Mongoose model.

---

## Getting started

### Prerequisites

- A current LTS release of Node.js
- A MongoDB database. For local work a standalone `mongod` is enough, but consultation completion is only atomic on a replica set or Atlas (see *Data integrity*).

### Setup

```bash
# 1. install dependencies
npm run install-all

# 2. server environment
cp .env.example .env          # then edit the values
# 3. client environment (optional for local dev; defaults to http://localhost:5000/api)
cp client/.env.example client/.env

# 4. create the first administrator (interactive prompt)
npm run create:admin --prefix server

# 5. run both apps in two terminals
npm run server-dev            # API on http://localhost:5000
npm run client-dev            # UI on http://localhost:5173
```

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `MONGO_URI` | server | MongoDB connection string (required) |
| `JWT_SECRET` | server | Secret used to sign tokens (required, use a long random value) |
| `CLIENT_URL` | server | Exact origin of the frontend, used for CORS (required) |
| `JWT_EXPIRE` | server | Token lifetime, default `7d` |
| `NODE_ENV` | server | `production` enables secure cookies and the helmet CSP |
| `PORT` | server | Defaults to 5000 (set automatically on most hosts) |
| `VITE_API_URL` | client, build time | API base URL, for example `http://localhost:5000/api`, or `/api` when the API serves the client |

The server refuses to start if `MONGO_URI`, `JWT_SECRET` or `CLIENT_URL` is missing. Real credentials must never be committed; only the `.env.example` files are tracked.

### Demo data

- Doctors are created from **Admin, Doctors, Add Doctor**. This also creates the doctor's login account.
- `npm run seed:doctors --prefix server` inserts sample doctor profiles for browsing. **It deletes every existing doctor document first**, and the seeded doctors have no login account. Do not run it on a database that holds real data.
- Patients register themselves from the Sign Up page.

---

## Roles and access

| Area | Patient | Doctor | Admin |
|---|---|---|---|
| Browse doctors and open slots | yes | yes | yes |
| Book and cancel own appointments | yes | no | no |
| Own profile and medical profile | yes | yes (doctor profile) | yes (name, email, phone) |
| Schedule and slot management | no | yes | no |
| Start and complete consultations | no | yes | no |
| View own consultations and prescriptions | yes | no | no |
| View patients the doctor has an appointment with | no | yes | no |
| Doctor, patient and appointment administration | no | no | yes |

Access is enforced twice: `ProtectedRoute` redirects on the client, and `protect` plus `authorize(...)` reject on the server (401 or 403). The client check is only for navigation; the server is the real gate.

### Client routes

| Role | Routes |
|---|---|
| Public | `/`, `/login`, `/signup` |
| Patient | `/patient/dashboard`, `/patient/doctors`, `/patient/doctors/:doctorId`, `/patient/appointments`, `/patient/appointments/book`, `/patient/medical-history`, `/patient/profile` |
| Doctor | `/doctor/dashboard`, `/doctor/schedule`, `/doctor/appointments`, `/doctor/consultations`, `/doctor/consultations/:consultationId`, `/doctor/patients`, `/doctor/patients/:patientId`, `/doctor/profile` |
| Admin | `/admin/dashboard`, `/admin/doctors`, `/admin/patients`, `/admin/appointments`, `/admin/profile` |

---

## REST API

All paths are prefixed with `/api`. Everything except register, login, logout and status needs a valid session cookie.

### Auth

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Register a patient account |
| POST | `/auth/login` | public | Log in and set the `jwt` cookie |
| POST | `/auth/logout` | public | Clear the cookie |
| GET | `/auth/me` | any role | Current user, with patient profile when applicable |
| PUT | `/auth/me` | any role | Update name, email, phone and, for patients, the medical profile |

### Doctors and schedules

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/doctors` | any role | List doctors (search and specialization filter) |
| GET | `/doctors/:id` | any role | Doctor profile |
| GET | `/doctors/:id/slots?date=YYYY-MM-DD` | any role | Free slots for one date |
| GET | `/doctors/:id/availability` | any role | Availability summary across dates |
| GET, PUT | `/doctors/me` | doctor | Own profile |
| GET | `/doctors/me/dashboard` | doctor | Dashboard data for a date |
| GET, PUT | `/doctors/me/schedule` | doctor | Working days, hours, break, off dates |
| GET, POST | `/doctors/me/slots` | doctor | List or create slots |
| POST | `/doctors/me/slots/from-working-hours` | doctor | Generate slots from the weekly schedule |
| POST | `/doctors/me/slots/cancel-day` | doctor | Cancel open slots for a day |
| PUT, DELETE | `/doctors/me/slots/:slotId` | doctor | Update or remove a slot |
| GET | `/doctors/me/patients` | doctor | Patients linked through appointments |
| GET | `/doctors/me/patients/:patientId` | doctor | One patient (only if linked to this doctor) |

### Appointments

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/appointments` | patient | Book a slot (`doctorId`, `date`, `timeSlot`, `reason`; `phone` on the first booking if none is stored) |
| GET | `/appointments/me` | patient | Own appointments |
| GET | `/appointments/doctor/me` | doctor | The doctor's appointments |
| GET | `/appointments/:id` | owner patient, owner doctor, admin | One appointment |
| PUT | `/appointments/:id/cancel` | owner patient, owner doctor, admin | Cancel; refused once a consultation is in progress or completed |
| GET | `/appointments/patient/:patientId` | owner patient, admin | Legacy listing, not used by the client |

### Consultations and prescriptions

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/consultations` | doctor | Start a consultation for an appointment |
| GET | `/consultations/doctor/me` | doctor | The doctor's consultations |
| GET | `/consultations/me` | patient | Own completed consultations (clinical notes are never returned) |
| GET | `/consultations/:id` | doctor, patient | One consultation, ownership checked |
| PUT | `/consultations/:id` | doctor | Save assessment, treatment plan and follow-up while in progress |
| PUT | `/consultations/:id/complete` | doctor | Finalise the consultation |
| PUT, GET | `/prescriptions/consultation/:consultationId` | doctor (write), doctor or patient (read) | Save or read the prescription |
| GET | `/prescriptions/me` | patient | Own prescriptions |
| GET | `/prescriptions/me/active` | patient | Medicines still within their course |
| GET | `/prescriptions/doctor/me` | doctor | Prescriptions written by the doctor |

### Admin

| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Platform counts and recent appointments |
| GET, POST | `/admin/doctors` | List doctors or create a doctor with a login account |
| PUT, DELETE | `/admin/doctors/:id` | Update or delete a doctor |
| GET | `/admin/patients` | List patient accounts (no medical data) |
| DELETE | `/admin/patients/:id` | Deliberately disabled (501) so medical records are retained |
| GET | `/admin/appointments` | List all appointments |
| PUT | `/admin/appointments/:id/status` | Change an appointment's status |

### Other

`GET /api/status` returns a simple health response.

Errors are returned as JSON with `success: false` and a `message`; validation errors use 400, missing session 401, wrong role or ownership 403, conflicts such as a taken slot 409.

---

## Data models

| Model | Main fields | Notes |
|---|---|---|
| **User** | name, email (unique), phone, password (hashed), role | Login identity for all three roles |
| **Patient** | fullName, email, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact, allergies, chronicConditions, surgeries, currentMedications, `userId` | Created on first booking or first profile save |
| **Doctor** | name, specialization, email, experience, qualifications, bio, languages, workingDays, workingHours, slotDurationMinutes, breakTime, offDates, `user` | Linked to a User with role `doctor` |
| **Slot** | doctor, date, startTime, endTime, status (`open` / `cancelled`), isManual | Unique per doctor, date and start time |
| **Appointment** | patient, doctor, date, timeSlot, status, reason, notes | Statuses: upcoming, scheduled, confirmed, completed, cancelled |
| **Consultation** | appointment (unique), patient, doctor, status (`in_progress` / `completed`), chiefComplaint, diagnosis, clinicalNotes, treatmentPlan, followUpDate, followUpInstructions, prescription, completedAt | One per appointment |
| **Prescription** | consultation (unique), patient, doctor, items[medicine, dosage, frequency, duration, durationDays, instructions] | One per consultation |

Relationships: User 1-1 Patient or Doctor; Doctor 1-n Appointment n-1 Patient; Appointment 1-1 Consultation 1-1 Prescription.

Indexes that matter:

- `Appointment (doctor, date, timeSlot)` is **unique while the status is upcoming, scheduled or confirmed**. This is the database-level guard against double booking. Cancelling frees the slot again.
- `Consultation.appointment` and `Prescription.consultation` are unique.

---

## Key behaviours

### Booking and double-booking protection (FR-04, FR-05)

Booking first recomputes the free slots for that doctor and date (working hours, breaks, off dates, stored slots, past times, existing active appointments) and rejects a label that is not free. If two patients still submit the same slot at the same moment, the partial unique index rejects the second insert and the API answers 409.

### Consultation lifecycle (FR-07)

1. The doctor starts a consultation from an appointment (one per appointment).
2. While `in_progress`, the assessment and the prescription can be edited.
3. **Complete** sets the consultation to `completed` and the appointment to `completed`. After that the assessment and prescription are rejected by the API and shown read-only in the UI.
4. Patients see only completed consultations, without `clinicalNotes`.

### Data integrity

- Completion writes to two collections inside a MongoDB transaction. This is only atomic on a replica set or Atlas; on a standalone development `mongod` the code falls back to sequential writes.
- Immutability of completed records is enforced in the service layer, not by database constraints.
- Cancelling an appointment is refused once its consultation is `in_progress` or `completed`.

### Reminders (FR-09)

The patient dashboard shows a dismissible banner for an appointment coming up within 24 hours, and a "next appointment" card. There is no email delivery and no reminder for doctors yet.

---

## SRS traceability

| Requirement | Where it lives |
|---|---|
| FR-01 registration, login, profiles | `authController`, `Profile.jsx`, `DoctorProfile.jsx` (doctor's own page) |
| FR-02 role-based access | `authMiddleware`, `ProtectedRoute`, per-route `authorize` |
| FR-03 doctor schedules | `scheduleService`, `patient/DoctorProfile.jsx`, `DoctorAvailability` |
| FR-04, FR-05 booking and conflicts | `appointmentService`, `BookAppointment.jsx`, unique partial index |
| FR-06 medical history | Patient medical profile (`PUT /auth/me`), `MedicalHistory.jsx` |
| FR-07 diagnosis and prescription | `consultationService`, `prescriptionService`, `ConsultationWorkspace.jsx` |
| FR-08 dashboards | Patient, doctor and admin dashboard pages |
| FR-09 reminders | Patient dashboard banners |
| FR-10 admin panel | `adminController`, `pages/admin` |
| FR-11 responsive UI | `global.css` breakpoints (desktop and tablet) |

---

## Manual test checklist (acceptance criteria)

| AC | Steps | Expected |
|---|---|---|
| AC-01 | Log in as a patient, open `/admin/dashboard` | Redirected to the patient dashboard; `GET /api/admin/stats` returns 403 |
| AC-02 | Open a doctor with a published schedule | Available slots are listed for a future weekday |
| AC-03 | Book a slot | Appears under the patient's Appointments and the doctor's Appointments |
| AC-04 | Open the same slot as a second patient and confirm after the first booking | Booking refused (409), slot not double-allocated |
| AC-05 | Doctor completes a consultation with a diagnosis and prescription | Patient sees both under Medical History; the prescription is read-only for the doctor |
| AC-06 | Open Medical History as patient A, then as patient B | Each sees only their own records; another patient's consultation id returns 403 |

---

## Deployment (single origin)

The Express server also serves the built client from `client/dist`, so the API and UI share one origin. This matters because the auth cookie uses `sameSite: strict` and would not be sent between two different hosting domains.

- **Build command:** `npm install --prefix client && npm run build --prefix client && npm install --prefix server`
- **Start command:** `npm start --prefix server`
- **Environment:** `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the deployed URL), `VITE_API_URL=/api` (needed at build time)
- `trust proxy` is enabled so rate limiting sees the real client address behind the host's proxy.
- Create the admin once with `npm run create:admin --prefix server` pointed at the production database.

---

## Known limitations

These are tracked for the final sprint:

- Admin appointment status changes do not apply the same lifecycle checks as patient or doctor cancellation.
- Deleting a doctor does not yet block when appointments or clinical records reference that doctor.
- Past appointments that were never started stay in an active status; there is no "missed" state.
- Dates are stored as UTC midnight and "today" uses the server clock, so behaviour near midnight depends on the server timezone.
- Reminders are on-screen only and patient-only.
- There are no automated tests yet; verification is manual (see checklist above).
- The legacy `GET /api/appointments/patient/:patientId` endpoint is not used by the client.

---

## Development workflow

Work happens on per-developer branches that merge into `main`:

```text
main
├── parth
├── ayush
├── swayam
├── likhit
└── adarsh
```

Commit messages follow `feat:`, `fix:`, `style:` and `refactor:` prefixes.

---

## License

Academic project for HEA-WEB-2026-052. Not licensed for production use with real patient data.
