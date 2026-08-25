import { UserRound } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';

export default function Profile({ role }) {
  return <div><header className="page-heading"><h1>Profile</h1><p>Manage your {role} profile information.</p></header><Card className="single-empty-card"><EmptyState icon={UserRound} title="Profile information is not available" description={`Your ${role} profile details will appear here.`} /></Card></div>;
}
