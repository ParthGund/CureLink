import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import RedirectIfAuthenticated from './components/layout/RedirectIfAuthenticated';
import PatientLayout from './components/layout/PatientLayout';
import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import BookAppointment from './pages/patient/BookAppointment';
import MedicalHistory from './pages/patient/MedicalHistory';
import Messages from './pages/patient/Messages';
import Profile from './pages/shared/Profile';
import RoleLayout from './components/layout/RoleLayout';
import RoleDashboard from './pages/shared/RoleDashboard';
import ResourcePage from './pages/shared/ResourcePage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

export default function App() {
  return (
    <Routes>
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
          <Route path="profile" element={<Profile role="patient" />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route path="/doctor" element={<RoleLayout role="doctor" />}>
          <Route path="dashboard" element={<RoleDashboard role="Doctor" />} />
          <Route path="schedule" element={<ResourcePage title="My Schedule" description="Manage your availability and upcoming consultations." emptyTitle="No schedule available" emptyDescription="Your schedule will appear here when it is available." />} />
          <Route path="appointments" element={<ResourcePage title="Appointments" description="Review consultations scheduled with your patients." emptyTitle="No appointments yet" emptyDescription="Scheduled consultations will appear here." />} />
          <Route path="consultations" element={<ResourcePage title="Consultations" description="Record and review authorised patient consultations." emptyTitle="No consultations yet" emptyDescription="Your consultation records will appear here." />} />
          <Route path="patients" element={<ResourcePage title="Patients" description="View patients assigned to your care." emptyTitle="No patients to show" emptyDescription="Your authorised patients will appear here." />} />
          <Route path="profile" element={<Profile role="doctor" />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<RoleLayout role="admin" />}>
          <Route path="dashboard" element={<RoleDashboard role="Administrator" />} />
          <Route path="doctors" element={<ResourcePage title="Doctors" description="Manage registered healthcare practitioners." emptyTitle="No doctors to show" emptyDescription="Doctor records will appear here when available." />} />
          <Route path="patients" element={<ResourcePage title="Patients" description="Manage patient accounts and information." emptyTitle="No patients to show" emptyDescription="Patient records will appear here when available." />} />
          <Route path="appointments" element={<ResourcePage title="Appointments" description="Monitor appointments across the platform." emptyTitle="No appointments to show" emptyDescription="Appointment records will appear here when available." />} />
          <Route path="reports" element={<ResourcePage title="Reports" description="View platform reporting when data is available." emptyTitle="No reports available" emptyDescription="Reports will appear here when information is available." />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
