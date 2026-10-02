import { useEffect, useState } from 'react';
import { ClipboardList, Search, Filter } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import MedicalRecordCard from '../../components/patient/MedicalRecordCard';
import { getPatientConsultations } from '../../services/consultationService';
import { getPatientPrescriptions } from '../../services/prescriptionService';

/**
 * Joins a consultation document with its matching prescription (if any).
 * Returns a single record object shaped for MedicalRecordCard.
 *
 * @param {object} consultation - Populated consultation from the API.
 * @param {object|null} prescription - Matching prescription, or null.
 * @returns {object} Unified medical record for the card component.
 */
function buildRecord(consultation, prescription) {
  return {
    _id: consultation._id,
    doctor: consultation.doctor,
    date: consultation.completedAt || consultation.createdAt,
    chiefComplaint: consultation.chiefComplaint || null,
    diagnosis: consultation.diagnosis || null,
    clinicalNotes: null, // clinical notes are not returned to patients by the API
    prescriptionItems: prescription ? prescription.items : [],
  };
}

export default function MedicalHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([getPatientConsultations(), getPatientPrescriptions()])
      .then(([consultationData, prescriptionData]) => {
        const consultations = consultationData.consultations ?? [];
        const prescriptions = prescriptionData.prescriptions ?? [];

        // Index prescriptions by their consultation ID for O(1) lookup
        const prescriptionByConsultation = {};
        for (const rx of prescriptions) {
          const consultationId =
            typeof rx.consultation === 'object'
              ? rx.consultation._id
              : rx.consultation;
          if (consultationId) {
            prescriptionByConsultation[String(consultationId)] = rx;
          }
        }

        const mapped = consultations.map((c) => {
          const rx = prescriptionByConsultation[String(c._id)] ?? null;
          return buildRecord(c, rx);
        });

        setRecords(mapped);
      })
      .catch(() => setError('Unable to load your medical records. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredRecords = records.filter((record) => {
    const q = searchQuery.toLowerCase();
    const docName = (record.doctor?.name || '').toLowerCase();
    const diag = (record.diagnosis || '').toLowerCase();
    return docName.includes(q) || diag.includes(q);
  });

  return (
    <div className="medical-history-page">
      <header className="page-heading">
        <h1>Medical History</h1>
        <p>Review your clinical records, consultation notes, and prescriptions.</p>
      </header>

      <div className="medical-history-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by doctor or diagnosis..."
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
          <Card><p className="error-text">{error}</p></Card>
        ) : records.length === 0 ? (
          <Card>
            <EmptyState
              icon={ClipboardList}
              title="No clinical records yet"
              description="Your consultation notes and assessments will appear here after you complete an appointment."
            />
          </Card>
        ) : filteredRecords.length === 0 ? (
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
              <MedicalRecordCard key={record._id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
