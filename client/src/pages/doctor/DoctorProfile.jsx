import { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import DoctorProfileForm from '../../components/doctor/DoctorProfileForm';
import { getMyProfile } from '../../services/doctorService';

export default function DoctorOwnProfile() {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notSetup, setNotSetup] = useState(false);
  const [error, setError] = useState('');
  const [notSetupMsg, setNotSetupMsg] = useState('');

  function fetchProfile() {
    setLoading(true);
    setError('');
    setNotSetup(false);
    getMyProfile()
      .then((doc) => setDoctor(doc))
      .catch((err) => {
        if (err.status === 404) {
          setNotSetup(true);
          setNotSetupMsg(err.message || 'Your doctor profile has not been set up yet. Please contact an administrator.');
        } else {
          setError(err.message || 'Unable to load your profile. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div>
      <header className="page-heading">
        <h1>Profile</h1>
        <p>Manage your profile information.</p>
      </header>

      {loading && (
        <Card className="dr-own-profile-card">
          <p className="loading-text">Loading profile…</p>
        </Card>
      )}

      {!loading && notSetup && (
        <Card className="dr-own-profile-card">
          <EmptyState
            icon={UserCog}
            title="Profile not set up yet"
            description={notSetupMsg}
          />
        </Card>
      )}

      {!loading && error && (
        <Card className="dr-own-profile-card">
          <div className="doctors-error">
            <p className="doctors-error__msg">{error}</p>
            <button className="button button--secondary" type="button" onClick={fetchProfile}>
              Try again
            </button>
          </div>
        </Card>
      )}

      {!loading && doctor && (
        <Card className="dr-own-profile-card">
          <DoctorProfileForm doctor={doctor} onSaved={setDoctor} />
        </Card>
      )}
    </div>
  );
}
