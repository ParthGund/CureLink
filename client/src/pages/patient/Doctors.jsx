import { useEffect, useState, useMemo } from 'react';
import { Search, Stethoscope } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import DoctorCard from '../../components/patient/DoctorCard';
import { getDoctors } from '../../services/doctorService';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');

  function fetchDoctors() {
    setLoading(true);
    setError('');
    getDoctors()
      .then((data) => setDoctors(data ?? []))
      .catch((err) => setError(err.message || 'Unable to load doctors. Please try again.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Distinct specialization options derived from loaded list
  const specializations = useMemo(() => {
    const seen = new Set();
    for (const d of doctors) {
      if (d.specialization) seen.add(d.specialization);
    }
    return Array.from(seen).sort();
  }, [doctors]);

  // Client-side filtering — no derived state, calculated inline
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((d) => {
      const matchesSearch =
        !q ||
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.specialization && d.specialization.toLowerCase().includes(q));
      const matchesSpec =
        !specialization || d.specialization === specialization;
      return matchesSearch && matchesSpec;
    });
  }, [doctors, search, specialization]);

  return (
    <div className="doctors-page">
      <header className="page-heading">
        <h1>Find a Doctor</h1>
        <p>Browse healthcare practitioners and view their available appointment times.</p>
      </header>

      <div className="doctors-controls">
        {/* Search */}
        <label htmlFor="doctor-search" className="doctors-controls__label">
          Search
        </label>
        <div className="search-field doctors-controls__search">
          <Search size={17} aria-hidden="true" />
          <input
            id="doctor-search"
            type="text"
            placeholder="Search by name or specialization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Specialization filter */}
        <div className="doctors-controls__filter">
          <label htmlFor="doctor-spec-filter" className="doctors-controls__label">
            Specialization
          </label>
          <select
            id="doctor-spec-filter"
            className="doctors-controls__select"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
          >
            <option value="">All specializations</option>
            {specializations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="doctors-error">
          <p className="doctors-error__msg">{error}</p>
          <button className="button button--secondary" type="button" onClick={fetchDoctors}>
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <p className="loading-text">Loading doctors…</p>
      )}

      {/* Empty — no doctors at all */}
      {!loading && !error && doctors.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="No doctors available"
          description="Doctors who join CureLink will appear here."
        />
      )}

      {/* Empty — filter match */}
      {!loading && !error && doctors.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="No matching doctors"
          description="Try a different name or specialization."
        />
      )}

      {/* Doctor grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="doctor-grid">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
