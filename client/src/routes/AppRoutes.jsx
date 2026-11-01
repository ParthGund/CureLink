import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import RedirectIfAuthenticated from '../components/layout/RedirectIfAuthenticated';
import PatientLayout from '../components/layout/PatientLayout';
import RoleLayout from '../components/layout/RoleLayout';

// ── Lazy-loaded pages for route-level code splitting (NFR-01: Performance) ──
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const Login = lazy(() => import('../pages/auth/Login'));
const Signup = lazy(() => import('../pages/auth/Signup'));

// Patient pages
const PatientDashboard = lazy(() => import('../pages/patient/Dashboard'));
const PatientAppointments = lazy(() => import('../pages/patient/Appointments'));
const BookAppointment = lazy(() => import('../pages/patient/BookAppointment'));
const MedicalHistory = lazy(() => import('../pages/patient/MedicalHistory'));
const Doctors = lazy(() => import('../pages/patient/Doctors'));
const DoctorProfile = lazy(() => import('../pages/patient/DoctorProfile'));
const Profile = lazy(() => import('../pages/shared/Profile'));

// Doctor pages
const DoctorDashboard = lazy(() => import('../pages/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('../pages/doctor/DoctorAppointments'));
const Schedule = lazy(() => import('../pages/doctor/Schedule'));
const DoctorConsultations = lazy(() => import('../pages/doctor/DoctorConsultations'));
const ConsultationWorkspace = lazy(() => import('../pages/doctor/ConsultationWorkspace'));
const DoctorPatients = lazy(() => import('../pages/doctor/DoctorPatients'));
const DoctorPatientProfile = lazy(() => import('../pages/doctor/DoctorPatientProfile'));
const DoctorOwnProfile = lazy(() => import('../pages/doctor/DoctorProfile'));

// Admin pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminDoctors = lazy(() => import('../pages/admin/AdminDoctors'));
const AdminPatients = lazy(() => import('../pages/admin/AdminPatients'));
const AdminAppointments = lazy(() => import('../pages/admin/AdminAppointments'));

function PageLoader() {
  return (
    <div className="auth-loading" role="status" aria-live="polite">
      <div className="auth-spinner" aria-label="Loading page content" />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="appointments/book" element={<BookAppointment />} />
            <Route path="medical-history" element={<MedicalHistory />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:doctorId" element={<DoctorProfile />} />
            <Route path="profile" element={<Profile role="patient" />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
          <Route path="/doctor" element={<RoleLayout role="doctor" />}>
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="consultations" element={<DoctorConsultations />} />
            <Route path="consultations/:consultationId" element={<ConsultationWorkspace />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patients/:patientId" element={<DoctorPatientProfile />} />
            <Route path="profile" element={<DoctorOwnProfile />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<RoleLayout role="admin" />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="profile" element={<Profile role="admin" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
