import { FolderOpen } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';

export default function ResourcePage({ title, description, emptyTitle, emptyDescription }) {
  return <div><header className="page-heading"><h1>{title}</h1><p>{description}</p></header><Card className="single-empty-card"><EmptyState icon={FolderOpen} title={emptyTitle} description={emptyDescription} /></Card></div>;
}
