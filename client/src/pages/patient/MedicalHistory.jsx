import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, AlertCircle, Search, Filter, Heart, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import MedicalRecordCard from '../../components/patient/MedicalRecordCard';
import ActiveMedicinesPanel from '../../components/patient/ActiveMedicinesPanel';
import { getMyConsultations } from '../../services/consultationService';
import { getMyPrescriptions, getMyActiveMedicines } from '../../services/prescriptionService';

/**
 * Build a prescription-items map keyed by consultation _id.
 * Each value is an array of shaped items for the MedicalRecordCard.
 */
function buildPrescriptionMap(prescriptions) {
  const map = {};
  for (const rx of prescriptions) {
    const cId = rx.consultation?._id;
    if (!cId) continue;
    map[cId] = (rx.items || []).map((it) => ({
      name: it.medicine,
      dosage: it.dosage || '',
      frequency: it.frequency || '',
      duration: it.duration || '',
      durationDays: it.durationDays || null,
      instructions: it.instructions || '',
      isActive: it.isActive || false,
      endsOn: it.endsOn || null,
    }));
  }
  return map;
}

/**
 * Split a comma-separated or newline-separated string into trimmed, non-empty items.
 */
function splitItems(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
}

/** Color scheme per health summary category. */
const CATEGORY_STYLES = {
  allergies:          { bg: '#fdf0f0', color: '#8b2d36', border: '#f5c6cb' },
  chronicConditions:  { bg: '#fff8e6', color: '#92660a', border: '#f5e6b8' },
  surgeries:          { bg: '#eef4ff', color: '#1a5ea8', border: '#c4d8f5' },
  currentMedications: { bg: '#e6f7f5', color: '#00776e', border: '#b5e5df' },
};

/**
 * Renders a row of pill badges for a medical profile category.
 */
function HealthBadgeRow({ label, icon, items, category, emptyText }) {
  const style = CATEGORY_STYLES[category] || {};
  const hasItems = items.length > 0;

  return (
    <div className="mh-health__row">
      <dt className="mh-health__label">
        {icon}
        {label}
      </dt>
      <dd className="mh-health__badges">
        {hasItems ? (
          items.map((item, i) => (
            <span
              key={i}
              className="mh-health__badge"
              style={{
                background: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
              }}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="mh-health__badge mh-health__badge--empty">
            {emptyText}
          </span>
        )}
      </dd>
    </div>
  );
}

export default function MedicalHistory() {
  const [records, setRecords] = useState([]);
  const [activeMedicines, setActiveMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rxWarning, setRxWarning] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [printingId, setPrintingId] = useState(null);
  const { user } = useAuth();
  
  const patient = user?.patient || {};

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    setRxWarning('');

    const [cResult, pResult, aResult] = await Promise.allSettled([
      getMyConsultations(),
      getMyPrescriptions(),
      getMyActiveMedicines(),
    ]);

    // Consultations are essential
    if (cResult.status === 'rejected') {
      setError(true);
      setRecords([]);
      setActiveMedicines([]);
      setLoading(false);
      return;
    }

    const consultations = cResult.value.consultations ?? [];

    // Prescriptions are optional
    let rxMap = {};
    if (pResult.status === 'fulfilled') {
      rxMap = buildPrescriptionMap(pResult.value.prescriptions ?? []);
    } else {
      setRxWarning('Prescriptions could not be loaded.');
    }

    // Active medicines are optional
    if (aResult.status === 'fulfilled') {
      setActiveMedicines(aResult.value.medicines ?? []);
    } else {
      setActiveMedicines([]);
    }

    // Build records
    const mapped = consultations.map((c) => ({
      _id: c._id,
      doctor: c.doctor,
      date: c.appointment?.date || c.completedAt,
      chiefComplaint: c.chiefComplaint || '',
      diagnosis: c.diagnosis || '',
      treatmentPlan: c.treatmentPlan || '',
      followUpDate: c.followUpDate || null,
      followUpInstructions: c.followUpInstructions || '',
      prescriptions: rxMap[c._id] || [],
    }));

    setRecords(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Search ──────────────────────────────────────────────────
  const filteredRecords = records.filter((record) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const docName = (record.doctor?.name || '').toLowerCase();
    const diag = (record.diagnosis || '').toLowerCase();
    const complaint = (record.chiefComplaint || '').toLowerCase();
    const medNames = (record.prescriptions || [])
      .map((p) => p.name.toLowerCase())
      .join(' ');
    return (
      docName.includes(q) ||
      diag.includes(q) ||
      complaint.includes(q) ||
      medNames.includes(q)
    );
  });

  // ── Print a single record ─────────────────────────────────
  function handlePrintRecord(id) {
    setPrintingId(id);
    // Allow the printing class to render before calling print
    requestAnimationFrame(() => {
      document.body.classList.add('mh-printing');
      function onAfterPrint() {
        document.body.classList.remove('mh-printing');
        setPrintingId(null);
        window.removeEventListener('afterprint', onAfterPrint);
      }
      window.addEventListener('afterprint', onAfterPrint);
      window.print();
    });
  }

  // Clean up body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('mh-printing');
    };
  }, []);

  // ── Pre-split patient health data ──────────────────────────
  const allergies = splitItems(patient.allergies);
  const conditions = splitItems(patient.chronicConditions);
  const surgeries = splitItems(patient.surgeries);
  const medications = splitItems(patient.currentMedications);

  return (
    <div className="medical-history-page">
      <header className="page-heading">
        <h1>Medical History</h1>
        <p>Review your clinical records, consultation notes, and prescriptions.</p>
      </header>

      {/* ── Health Summary Card ─────────────────────────────── */}
      <Card className="mh-health-card">
        <div className="mh-health__header">
          <div className="mh-health__title-group">
            <span className="mh-health__icon-circle">
              <Heart size={20} />
            </span>
            <div>
              <h2 className="mh-health__title">Health Summary</h2>
              <p className="mh-health__subtitle">Your self-reported medical profile</p>
            </div>
          </div>
          <Link
            to="/patient/profile"
            className="button button--secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Edit size={15} />
            Update Health Details
          </Link>
        </div>

        <dl className="mh-health__grid">
          <HealthBadgeRow
            label="Allergies"
            icon={null}
            items={allergies}
            category="allergies"
            emptyText="No known allergies"
          />
          <HealthBadgeRow
            label="Chronic Conditions"
            icon={null}
            items={conditions}
            category="chronicConditions"
            emptyText="None reported"
          />
          <HealthBadgeRow
            label="Past Surgeries"
            icon={null}
            items={surgeries}
            category="surgeries"
            emptyText="None reported"
          />
          <HealthBadgeRow
            label="Current Medications"
            icon={null}
            items={medications}
            category="currentMedications"
            emptyText="None reported"
          />
        </dl>
      </Card>

      <div className="medical-history-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by doctor, diagnosis, or medicine…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="button button--secondary icon-button-text">
          <Filter size={16} /> Filter
        </button>
      </div>

      <div className="medical-history-content">
        {loading ? (
          <Card><p className="loading-text">Loading records…</p></Card>
        ) : error ? (
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load your records"
              description="Please try again in a moment."
              action={
                <button type="button" className="button" onClick={loadData}>
                  Try again
                </button>
              }
            />
          </Card>
        ) : records.length === 0 ? (
          <Card>
            <EmptyState
              icon={ClipboardList}
              title="No clinical records yet"
              description="Your consultation notes and assessments will appear here after you complete an appointment."
            />
          </Card>
        ) : (
          <>
            <ActiveMedicinesPanel medicines={activeMedicines} />

            {rxWarning && <p className="mh-rx-warning">{rxWarning}</p>}

            {filteredRecords.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Search}
                  title="No matching records"
                  description="Try adjusting your search terms."
                />
              </Card>
            ) : (
              <div className="medical-records-list">
                {filteredRecords.map((record) => (
                  <MedicalRecordCard
                    key={record._id}
                    record={record}
                    isPrinting={printingId === record._id}
                    onPrint={() => handlePrintRecord(record._id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
