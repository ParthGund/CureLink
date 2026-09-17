import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import PatientProfileCard from '../../components/patient/PatientProfileCard';

export default function Profile({ role }) {
  const { user, loading } = useAuth();

  return (
    <div>
      <header className="page-heading">
        <h1>Profile</h1>
        <p>Manage your {role} profile information.</p>
      </header>

      <Card className="profile-page-card">
        {loading ? (
          <p className="loading-text">Loading profile…</p>
        ) : user ? (
          <PatientProfileCard user={user} />
        ) : (
          <p className="loading-text">Profile information is not available. Please log in.</p>
        )}
      </Card>
    </div>
  );
}
