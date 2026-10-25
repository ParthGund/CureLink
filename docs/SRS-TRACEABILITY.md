# CureLink: Requirements Traceability

| | |
|---|---|
| **Product** | CureLink: Digital Appointment and Health Record Portal |
| **SRS** | HEA-WEB-2026-052-SRS-v1.2 (project code HEA-WEB-2026-052) |
| **Scope** | Functional requirements FR-01 to FR-11, non-functional requirements NFR-01 to NFR-08, acceptance criteria AC-01 to AC-06 |

This document maps each requirement of the SRS to its implementation. Setup, API reference and the manual acceptance checklist are in the [README](../README.md).

---

## 1. Functional requirements

| ID | Requirement (SRS) | Priority | Implementation | Source |
|---|---|---|---|---|
| FR-01 | Secure registration, login and profile management for patients, doctors and administrators | Must | Patients register publicly; doctors are created by an administrator; the first administrator is created with a script. Passwords are hashed, sessions use a JWT in an httpOnly cookie. Patients edit a validated profile, administrators edit name, email and phone, doctors edit their professional profile. | `server/controllers/authController.js`, `server/validators/patientProfileValidator.js`, `server/scripts/createAdmin.js`, `client/src/pages/auth`, `client/src/pages/shared/Profile.jsx`, `client/src/pages/doctor/DoctorProfile.jsx` |
| FR-02 | Role-based access appropriate to each user type | Must | `protect` verifies the session and `authorize(...)` restricts every route group by role; resource ownership is checked in the services. The client mirrors this with route guards. Deactivated patient accounts are refused. | `server/middleware/authMiddleware.js`, `server/routes`, `client/src/components/layout/ProtectedRoute.jsx`, `client/src/routes/AppRoutes.jsx` |
| FR-03 | Patients can view doctor schedules | Must | Doctors publish weekly working hours, breaks, days off and individual slots. Patients browse doctors and see the free slots for a chosen date. | `server/services/scheduleService.js`, `server/models/Slot.js`, `client/src/pages/doctor/Schedule.jsx`, `client/src/pages/patient/Doctors.jsx`, `client/src/pages/patient/DoctorProfile.jsx`, `client/src/components/patient/DoctorAvailability.jsx` |
| FR-04 | Patients can select an available slot and confirm an appointment | Must | Booking from the doctor's profile or the booking page; a patient can also reschedule or cancel an active appointment. | `server/services/appointmentService.js`, `server/controllers/appointmentController.js`, `client/src/pages/patient/BookAppointment.jsx`, `client/src/pages/patient/Appointments.jsx` |
| FR-05 | Slot availability is checked at booking so a taken slot cannot be double-booked | Must | Availability is recomputed at booking time, and a partial unique index on doctor, date and time slot (active statuses only) rejects a simultaneous second booking with a 409 response. | `server/services/appointmentService.js`, `server/models/Appointment.js` |
| FR-06 | Patients can store and view their medical history | Must | Validated medical profile (allergies, chronic conditions, surgeries, current medications and more) and a Medical History page that lists completed consultations, prescriptions and active medicines. | `server/controllers/authController.js`, `server/validators/patientProfileValidator.js`, `client/src/pages/patient/MedicalHistory.jsx`, `client/src/components/patient/MedicalRecordCard.jsx`, `client/src/components/patient/ActiveMedicinesPanel.jsx` |
| FR-07 | Doctors can record diagnosis and prescription details against a consultation | Must | A consultation is started from an appointment; the doctor records the assessment, treatment plan, follow-up and prescription. Completion requires a diagnosis and then locks the consultation and prescription. | `server/services/consultationService.js`, `server/services/prescriptionService.js`, `client/src/pages/doctor/ConsultationWorkspace.jsx`, `client/src/components/doctor/consultation` |
| FR-08 | Personalised dashboard with upcoming appointments and visit history | Must | Separate dashboards for patients, doctors and administrators. | `client/src/pages/patient/Dashboard.jsx`, `client/src/pages/doctor/DoctorDashboard.jsx`, `client/src/pages/admin/AdminDashboard.jsx`, `server/services/doctorService.js`, `server/controllers/adminController.js` |
| FR-09 | Email or on-screen reminders for scheduled consultations | Should | On-screen reminders: a dashboard banner and next-appointment card for patients, and a notification bell for patients and doctors covering today's appointments, the next 48 hours and missed visits. Email delivery is not part of this release. | `client/src/components/common/NotificationDropdown.jsx`, `client/src/pages/patient/Dashboard.jsx` |
| FR-10 | Admin panel to manage doctor profiles and appointments and monitor platform activity | Should | Create, edit and delete doctors (deletion blocked while active appointments exist); list patients and deactivate or reactivate accounts; list and filter appointments with controlled status transitions; dashboard totals and status breakdown. | `server/controllers/adminController.js`, `server/routes/adminRoutes.js`, `client/src/pages/admin` |
| FR-11 | Responsive interface for desktop and tablet | Must | A single stylesheet with breakpoints at 900, 800, 768, 600, 480 and 460 pixels; layouts, tables, modals and the slot picker adapt to narrower screens. | `client/src/styles/global.css` |

---

## 2. Non-functional requirements

| ID | Category | Requirement (SRS) | Measures in place | Planned improvements |
|---|---|---|---|---|
| NFR-01 | Performance | Respond to user actions without a noticeable delay during normal use | Indexed unique lookups; slot availability computed on demand for the selected date; loading skeletons while data arrives. | Response compression, route-level code splitting, caching headers for built assets. |
| NFR-02 | Scalability | Remain responsive as records and concurrent users grow | Stateless API with a cookie-based JWT; compound indexes on slots, consultations and prescriptions; the background sweeper works on candidate ids rather than whole collections. | Pagination for admin and history lists; additional appointment indexes by patient and by doctor and date. |
| NFR-03 | Security | Authenticated, role-authorised endpoints; medical records only for the patient and authorised clinical staff; no credentials in source control | JWT in an httpOnly, SameSite=Strict cookie; bcrypt (bcryptjs) password hashing; `protect` and `authorize` on every protected route; ownership checks on appointments, consultations and prescriptions; doctors reach a patient's record only through an existing appointment; clinical notes are never returned to patients; request validation and field whitelists; helmet, CORS restricted to configured origins and rate limiting on login and registration; startup validation of required environment variables; `.env` files are git-ignored and only `.env.example` is tracked. | Audit log of record access; account lockout policy. |
| NFR-04 | Reliability | User-submitted data is persisted so work is not lost on an unexpected disconnection | Every save is written to MongoDB on submit; consultation drafts can be saved at any step and the workspace warns before leaving with unsaved changes; consultation completion and prescription saving run in transactions on a replica set or Atlas and fall back to sequential writes on a standalone server; status changes use conditional updates; the server shuts down gracefully on SIGINT and SIGTERM. | Automated recovery tests; scheduled database backups (a backup and restore procedure is documented in the README). |
| NFR-05 | Usability | Operable without prior training, with visible feedback for every action | Toast notifications for every outcome; confirmation dialogs for cancellations and account changes; specific empty states; inline validation messages; a guided booking flow. | Guided first-run hints. |
| NFR-06 | Compatibility | Current desktop browsers; usable at tablet screen sizes | Standard React and Vite build for modern browsers; tablet and phone breakpoints in the stylesheet. | Documented cross-browser test matrix. |
| NFR-07 | Accessibility | Interactive controls keyboard reachable and clearly labelled | Native buttons, links and form controls; `aria-label` on icon-only controls; labelled inputs; visible focus styles; Escape closes the notification dropdown. | Make the notification list items individually keyboard operable; automated accessibility audit. |
| NFR-08 | Maintainability | Consistent style, modular components, documented environment setup | Layered backend (routes, controllers, services, validators, models); modular React components, pages and service modules; shared helpers; oxlint configuration; README with setup, environment variables, API reference and deployment notes; this traceability document. | Automated unit and integration test suites; splitting the global stylesheet by feature. |

---

## 3. Acceptance criteria

| ID | Ref | Criterion (SRS) | How it is satisfied | Demonstration |
|---|---|---|---|---|
| AC-01 | FR-02 | A patient who opens an administrative view is refused | `/admin/*` routes require the admin role on the server (403) and are guarded in the client (redirect to the patient dashboard). | Sign in as a patient, open `/admin/dashboard`; call `GET /api/admin/stats` and receive 403. |
| AC-02 | FR-03 | A published doctor schedule shows its available slots on the doctor's profile | Slot availability endpoint feeds the availability panel on the profile page. | Publish working hours as a doctor; open that doctor as a patient and pick a future weekday. |
| AC-03 | FR-04 | A confirmed booking appears on both the patient's and the doctor's dashboard | Booking creates the appointment; both roles read it through their own appointment endpoints. | Book as a patient; check Appointments for the patient and the doctor. |
| AC-04 | FR-05 | A slot that is already booked cannot be booked again | Availability re-check plus the partial unique index; the second request returns 409. | Open the same slot as a second patient and confirm after the first booking. |
| AC-05 | FR-07 | A completed consultation with diagnosis and prescription is saved to the patient's record and visible to the patient | Completion stores the diagnosis, links the prescription and marks the appointment completed; patients read completed consultations only. | Complete a consultation as a doctor; open Medical History as the patient. |
| AC-06 | FR-06 | A patient sees their own stored history and no other patient's record | Patient endpoints resolve the patient from the session; consultations and prescriptions verify ownership and return 403 otherwise. | Compare Medical History for two patients; request another patient's consultation id and receive 403. |

---

## 4. Mid-point review (SRS section 7)

The requirements named for demonstration are FR-01, FR-03, FR-04 and FR-06.

| Requirement | Where to show it |
|---|---|
| FR-01 | Sign up, sign in, edit the profile (including the medical profile) |
| FR-03 | Doctors list, doctor profile with the slot picker |
| FR-04 | Book a slot; reschedule and cancel from My Appointments |
| FR-06 | Medical profile in Profile; Medical History with consultations, prescriptions and active medicines |

---

## 5. Design notes relevant to the requirements

- **Appointment lifecycle.** Statuses are upcoming, scheduled, confirmed, completed, cancelled and missed. Administrators may only apply forward transitions and cannot set `completed`; completion belongs to the consultation workflow. An appointment with a consultation cannot be cancelled or rescheduled.
- **Rescheduling.** A patient moves an active appointment to another free slot of the same doctor. The appointment record is kept and each move is appended to its reschedule history.
- **Missed appointments.** A background job marks `scheduled` appointments as `missed` once the slot (plus a grace period) has passed. It never touches an appointment that has a consultation and only updates appointments that are still `scheduled`.
- **Patient accounts.** Accounts are deactivated rather than deleted, so clinical history is preserved.
- **Transactions.** Consultation completion and prescription saving are transactional on a replica set or Atlas. On a standalone MongoDB they fall back to sequential writes.

## 6. Out of scope for this release

- Email or SMS delivery of reminders (FR-09 is met with on-screen reminders).
- Audit logging of record access.
- Automated test suites; verification uses the manual checklist in the README.
