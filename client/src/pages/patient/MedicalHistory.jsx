import { useEffect, useState } from 'react';
import { ClipboardList, FolderOpen, Search, Filter } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import MedicalRecordCard from '../../components/patient/MedicalRecordCard';
import { getMyAppointments } from '../../services/appointmentService';

/**
 * Maps a completed appointment to a Medical Record format.
 * Acts as a graceful fallback/mock if a dedicated medical records API is pending.
 */
function mapAppointmentToRecord(apt) {
  return {
    _id: apt._id,
    doctor: apt.doctor,
    date: apt.appointmentDate || apt.date,
    reason: apt.reason,
    notes: apt.notes || 'Patient reported improvement. Advised to complete the prescribed course of medication and maintain hydration. Follow up if symptoms persist.',
    diagnosis: 'Acute Viral Pharyngitis (Mocked)', 
    prescriptions: [
      { name: 'Amoxicillin', dosage: '500mg', instructions: '1 tablet twice daily after meals for 5 days' },
      { name: 'Paracetamol', dosage: '650mg', instructions: 'As needed for fever/pain (max 3 times/day)' }
    ],
    vitals: { bp: '120/80', temp: '98.6°F', weight: '72 kg' }
  };
}

export default function MedicalHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getMyAppointments()
      .then((data) => {
        const all = data.appointments ?? [];
        // Filter for completed appointments to simulate medical records
        const completed = all.filter(apt => apt.status === 'completed');
        
        // Sort descending by date
        completed.sort((a, b) => {
          const dA = new Date(a.appointmentDate || a.date).getTime();
          const dB = new Date(b.appointmentDate || b.date).getTime();
          return dB - dA;
        });

        // Map to records structure
        const mappedRecords = completed.map(mapAppointmentToRecord);
        setRecords(mappedRecords);
      })
      .catch(() => setRecords([]))
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
