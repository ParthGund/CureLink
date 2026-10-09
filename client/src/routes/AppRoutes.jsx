import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import RedirectIfAuthenticated from '../components/layout/RedirectIfAuthenticated';
import PatientLayout from '../components/layout/PatientLayout';
import PatientDashboard from '../pages/patient/Dashboard';
import PatientAppointments from '../pages/patient/Appointments';
import BookAppointment from '../pages/patient/BookAppointment';
import MedicalHistory from '../pages/patient/MedicalHistory';
import Doctors from '../pages/patient/Doctors';
import DoctorProfile from '../pages/patient/DoctorProfile';
import Profile from '../pages/shared/Profile';
import RoleLayout from '../components/layout/RoleLayout';
import DoctorAppointments from '../pages/doctor/DoctorAppointments';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import DoctorOwnProfile from '../pages/doctor/DoctorProfile';
import Schedule from '../pages/doctor/Schedule';
import DoctorPatients from '../pages/doctor/DoctorPatients';
import DoctorPatientProfile from '../pages/doctor/DoctorPatientProfile';
import DoctorConsultations from '../pages/doctor/DoctorConsultations';
import ConsultationWorkspace from '../pages/doctor/ConsultationWorkspace';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminDoctors from '../pages/admin/AdminDoctors';
import AdminPatients from '../pages/admin/AdminPatients';
import AdminAppointments from '../pages/admin/AdminAppointments';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import LandingPage from '../pages/public/LandingPage';

export default function AppRoutes() {
  return (
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
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
