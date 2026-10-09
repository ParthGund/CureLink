import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, AlertCircle, Search, Filter, Edit } from 'lucide-react';
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

  return (
    <div className="medical-history-page">
      <header className="page-heading">
        <h1>Medical History</h1>
        <p>Review your clinical records, consultation notes, and prescriptions.</p>
      </header>

      <Card style={{ marginBottom: '24px' }}>
        <div className="card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>My Medical Profile</h2>
          <Link to="/patient/profile" className="button button--secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Edit size={16} /> Edit Medical Profile
          </Link>
        </div>
        <dl className="dr-apt-detail__fields" style={{ padding: 0 }}>
          <div className="dr-apt-detail__row">
            <dt>Allergies</dt>
            <dd>{patient.allergies || 'None reported'}</dd>
          </div>
          <div className="dr-apt-detail__row">
            <dt>Chronic Conditions</dt>
            <dd>{patient.chronicConditions || 'None reported'}</dd>
          </div>
          <div className="dr-apt-detail__row">
            <dt>Past Surgeries</dt>
            <dd>{patient.surgeries || 'None reported'}</dd>
          </div>
          <div className="dr-apt-detail__row">
            <dt>Current Medications</dt>
            <dd>{patient.currentMedications || 'None reported'}</dd>
          </div>
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
