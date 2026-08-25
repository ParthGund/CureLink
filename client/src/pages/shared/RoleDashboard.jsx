import { Activity, CalendarDays, Users } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';

export default function RoleDashboard({ role }) {
  return <div><header className="page-heading"><h1>{role} Dashboard</h1><p>Overview information will appear here when it becomes available.</p></header><div className="dashboard-grid"><Card><EmptyState icon={CalendarDays} title="No upcoming activity" description="Scheduled activity will appear here." /></Card><Card><EmptyState icon={Activity} title="No overview data" description="Your healthcare overview will appear here." /></Card></div><Card className="single-empty-card"><EmptyState icon={Users} title="No records to display" description="Authorised records will appear here when available." /></Card></div>;
}
