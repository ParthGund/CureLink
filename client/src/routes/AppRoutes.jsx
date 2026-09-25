import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import RedirectIfAuthenticated from '../components/layout/RedirectIfAuthenticated';
import PatientLayout from '../components/layout/PatientLayout';
import PatientDashboard from '../pages/patient/Dashboard';
import PatientAppointments from '../pages/patient/Appointments';
import BookAppointment from '../pages/patient/BookAppointment';
import MedicalHistory from '../pages/patient/MedicalHistory';
import Messages from '../pages/patient/Messages';
import Doctors from '../pages/patient/Doctors';
import DoctorProfile from '../pages/patient/DoctorProfile';
import Profile from '../pages/shared/Profile';
import RoleLayout from '../components/layout/RoleLayout';
import ResourcePage from '../pages/shared/ResourcePage';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import DoctorOwnProfile from '../pages/doctor/DoctorProfile';
import Schedule from '../pages/doctor/Schedule';
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
          <Route path="messages" element={<Messages />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="doctors/:doctorId" element={<DoctorProfile />} />
          <Route path="profile" element={<Profile role="patient" />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route path="/doctor" element={<RoleLayout role="doctor" />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="appointments" element={<ResourcePage title="Appointments" description="Review consultations scheduled with your patients." emptyTitle="No appointments yet" emptyDescription="Scheduled consultations will appear here." />} />
          <Route path="consultations" element={<ResourcePage title="Consultations" description="Record and review authorised patient consultations." emptyTitle="No consultations yet" emptyDescription="Your consultation records will appear here." />} />
          <Route path="patients" element={<ResourcePage title="Patients" description="View patients assigned to your care." emptyTitle="No patients to show" emptyDescription="Your authorised patients will appear here." />} />
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
