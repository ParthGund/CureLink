# CureLink SRS v1.2 traceability

## Source and verification scope

The repository identifies the target as `HEA-WEB-2026-052-SRS-v1.2` and its README summarizes FR-01 through FR-11 and AC-01 through AC-06. The formal SRS document itself, including the text of NFR-01 through NFR-08, is not present in this workspace. Functional summaries below follow the repository README; NFR wording is deliberately not inferred. “Implemented in source” describes code inspection only and is not runtime acceptance evidence.

## Functional requirements

| ID | Summary from repository documentation | Status | Source evidence | Remaining work / limitation |
|---|---|---|---|---|
| FR-01 | Registration, login, and user profiles | Implemented in source | `server/controllers/authController.js`, `server/routes/authRoutes.js`, `client/src/pages/shared/Profile.jsx` | Verify end-to-end with each role. |
| FR-02 | Role-based access control | Implemented in source | `server/middleware/authMiddleware.js`, route `protect`/`authorize` middleware, `client/src/routes/ProtectedRoute.jsx` | Runtime authorization checks remain pending. |
| FR-03 | Doctor schedules and availability | Partially implemented | `server/services/scheduleService.js`, `server/models/Slot.js`, `client/src/pages/doctor/Schedule.jsx` | Cross-instance overlapping schedule edits need concurrency testing; changes reject booked visits that would no longer fit. |
| FR-04 | Appointment booking | Implemented in source | `server/services/appointmentService.js`, `POST /api/appointments`, `client/src/pages/patient/BookAppointment.jsx` | Runtime booking flow remains pending. |
| FR-05 | Slot availability and booking conflict prevention | Implemented in source | `Appointment` partial unique index; schedule availability checks in `scheduleService.js` | Concurrent database behavior must be exercised against the target MongoDB deployment. |
| FR-06 | Patient medical history | Implemented in source | `server/validators/patientProfileValidator.js`, `server/controllers/authController.js`, `client/src/pages/patient/MedicalHistory.jsx` | Runtime ownership and validation scenarios remain pending. |
| FR-07 | Consultation diagnosis and prescription workflows | Partially implemented | `server/services/consultationService.js`, `server/services/prescriptionService.js`, consultation and prescription models | Transactional guarantee requires MongoDB replica set support. Standalone fallback is sequential and not atomic. |
| FR-08 | Patient, doctor, and admin dashboards | Partially implemented | `server/services/doctorService.js`, `server/controllers/adminController.js`, role-specific dashboard pages | Source counts corrected; runtime data accuracy and privacy review remain pending. |
| FR-09 | Appointment reminders | Implemented in source | `client/src/components/common/NotificationDropdown.jsx`, `client/src/pages/patient/Dashboard.jsx`, `server/services/missedAppointmentJob.js` | In-app reminders are present. Email delivery is optional in the supplied README summary and is not configured. |
| FR-10 | Administrative management | Partially implemented | `server/controllers/adminController.js`, `server/routes/adminRoutes.js`, `client/src/pages/admin` | Status transitions are restricted; completion remains consultation-only. Runtime admin workflows remain pending. |
| FR-11 | Responsive user interface | Partially implemented | `client/src/styles/global.css`, role-specific pages and components | Target-device visual and keyboard accessibility review remains pending. |

## Non-functional requirements

The formal SRS category names and descriptions for NFR-01 through NFR-08 are unavailable in the repository. The implementation evidence below records relevant controls without claiming they satisfy unknown criteria. Update this section from the authoritative SRS before sign-off.

| ID | Requirement summary | Status | Relevant evidence | Remaining work / limitation |
|---|---|---|---|---|
| NFR-01 | Category text unavailable; cannot reliably summarize. | Partially implemented | Auth middleware, HttpOnly cookie, security middleware | Compare with formal SRS and perform security review. |
| NFR-02 | Category text unavailable; cannot reliably summarize. | Partially implemented | `server/server.js` production config validation and CORS | Verify deployment origin/proxy settings. |
| NFR-03 | Category text unavailable; cannot reliably summarize. | Partially implemented | MongoDB indexes and transaction-backed completion | Requires replica set; load and failure testing pending. |
| NFR-04 | Category text unavailable; cannot reliably summarize. | Partially implemented | React responsive breakpoints in `global.css` | Device and assistive-technology testing pending. |
| NFR-05 | Category text unavailable; cannot reliably summarize. | Partially implemented | API validators, Express size limits, error middleware | Formal criteria and integration checks pending. |
| NFR-06 | Category text unavailable; cannot reliably summarize. | Partially implemented | Missed appointment background job and graceful shutdown | Multi-instance job coordination and runtime recovery tests pending. |
| NFR-07 | Category text unavailable; cannot reliably summarize. | Partially implemented | README setup, environment, backup and restore procedures | Test restoration and reconcile against formal SRS. |
| NFR-08 | Category text unavailable; cannot reliably summarize. | Partially implemented | `README.md`, this traceability matrix | Obtain the source SRS and complete requirement wording/evidence review. |

## Acceptance criteria

These ACs are copied from the project README. They have not been executed as part of this implementation pass.

| ID | Expected demonstration | Status |
|---|---|---|
| AC-01 | Patient cannot access admin dashboard/API; API returns 403. | Pending runtime verification |
| AC-02 | Doctor with a published schedule exposes future available slots. | Pending runtime verification |
| AC-03 | Booking appears in the patient and assigned doctor's appointment lists. | Pending runtime verification |
| AC-04 | Concurrent second booking for an occupied slot is rejected without double allocation. | Pending replica-set/database verification |
| AC-05 | Completed consultation and prescription appear in patient Medical History and are protected from edits. | Pending runtime verification |
| AC-06 | Each patient sees only their records; another patient's consultation ID returns 403. | Pending runtime authorization verification |

## Implemented lifecycle and rescheduling notes

- Patients can reschedule only their own active appointments. The appointment document is retained and `rescheduleHistory` records each move.
- The destination must be available for the assigned doctor. The active appointment unique index protects the final write from allocating an already occupied doctor/date/time label.
- Admin status changes use explicit allowed transitions and a conditional status update. Admins cannot set `completed`; consultation completion owns that transition. Admin cancellation is rejected when a consultation exists.
- Doctors can create, edit, and cancel their own slots through authenticated doctor routes. Schedule edits preserve booked slots and reject weekly schedule changes that would strand appointments, unless the appointment is backed by a manually created slot.
- In-app reminders remain enabled. Email provider delivery is not implemented or configured.
- Audit logging (Priority 10) is intentionally out of scope and has not been added.

## Checks performed and pending

Source inspection and targeted syntax/diff checks are recorded in the task completion report. Comprehensive unit, integration, acceptance, browser, concurrency, production deployment, security, and database restore tests remain pending.
