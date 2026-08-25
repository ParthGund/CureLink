import { ClipboardList, FolderOpen } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';

export default function MedicalHistory() {
  return <div><header className="page-heading"><h1>Medical History</h1><p>Review your clinical records and healthcare information.</p></header><div className="two-column-page"><section><h2>Timeline</h2><Card><EmptyState icon={FolderOpen} title="No medical history yet" description="Your medical events will appear here after authorised clinical care." /></Card></section><section><h2>Clinical Records</h2><Card><EmptyState icon={ClipboardList} title="No clinical records yet" description="Your consultation notes and assessments will appear here." /></Card></section></div></div>;
}
