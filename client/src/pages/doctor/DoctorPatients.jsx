import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Eye } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getMyPatients } from '../../services/doctorService';
import { useToast } from '../../context/ToastContext';

const SKELETON_ROWS = 5;

export default function DoctorPatients() {
  const toast = useToast();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getMyPatients()
      .then((data) => setPatients(data || []))
      .catch((err) => toast.error(err.message || 'Failed to load patients.'))
      .finally(() => setLoading(false));
  }, [toast]);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
    );
  }, [patients, search]);

  return (
    <div>
      <header className="page-heading">
        <h1>
          Patients
          {!loading && <span className="dr-apt-count">{patients.length}</span>}
        </h1>
        <p>View patients assigned to your care through appointments.</p>
      </header>

      <div className="dr-apt-controls">
        <div className="dr-apt-filter-row">
          <div className="dr-apt-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by patient name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="dr-apt-table-card">
        <div className="dr-apt-table-wrap">
          <table className="dr-apt-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Phone</th>
                <th>Total Appointments</th>
                <th>Latest Appointment</th>
                <th className="dr-apt-table__actions-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td>
                      <div className="skeleton-line" style={{ width: '70%' }} />
                    </td>
                    <td>
                      <div className="skeleton-line skeleton-line--short" />
                    </td>
                    <td>
                      <div className="skeleton-line skeleton-line--short" />
                    </td>
                    <td>
                      <div className="skeleton-line skeleton-line--short" />
                    </td>
                    <td>
                      <div className="skeleton-line skeleton-line--short" />
                    </td>
                  </tr>
                ))
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const patientName = patient.fullName || '—';
                  const patientEmail = patient.email || '';
                  const appointments = patient.appointments || [];
                  const latestAppointment = appointments.length > 0 ? appointments[0] : null;

                  return (
                    <tr key={patient._id}>
                      <td className="dr-apt-table__patient-cell">
                        <span className="dr-apt-table__avatar">
                          {patientName.charAt(0).toUpperCase()}
                        </span>
                        <span className="dr-apt-table__patient-info">
                          <span className="dr-apt-table__patient-name">{patientName}</span>
                          {patientEmail && (
                            <span className="dr-apt-table__patient-email">{patientEmail}</span>
                          )}
                        </span>
                      </td>
                      <td>{patient.phone || '—'}</td>
                      <td>{appointments.length}</td>
                      <td>
                        {latestAppointment ? (
                          <>
                            {new Date(latestAppointment.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            <span
                              className={`dr-apt-status dr-apt-status--${latestAppointment.status}`}
                              style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 6px' }}
                            >
                              {latestAppointment.status}
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="dr-apt-view-btn"
                          onClick={() => navigate(`/doctor/patients/${patient._id}`)}
                          aria-label={`View details for ${patientName}`}
                        >
                          <Eye size={15} aria-hidden="true" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="dr-apt-table__empty-cell">
                    <EmptyState
                      icon={search ? Search : Users}
                      title={search ? 'No matching patients' : 'No patients to show'}
                      description={
                        search
                          ? 'Try adjusting your search.'
                          : 'Your authorised patients will appear here.'
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
