import { Bell, ShieldPlus } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const roleNavigation = {
  doctor: [['Dashboard', 'dashboard'], ['My Schedule', 'schedule'], ['Consultations', 'consultations'], ['Patients', 'patients']],
  admin: [['Dashboard', 'dashboard'], ['Doctors', 'doctors'], ['Appointments', 'appointments'], ['Patients', 'patients'], ['Reports', 'reports']],
};

export default function RoleLayout({ role }) {
  const prefix = `/${role}`;
  return <div className="app-shell"><header className="top-nav"><NavLink className="brand" to={`${prefix}/dashboard`}><ShieldPlus size={25} /><span>CureLink</span></NavLink><nav className="top-nav__links" aria-label={`${role} navigation`}>{roleNavigation[role].map(([label, path]) => <NavLink key={path} to={`${prefix}/${path}`}>{label}</NavLink>)}</nav><div className="top-nav__actions"><button className="icon-button" type="button" aria-label="Notifications"><Bell size={21} /></button><NavLink className="profile-dot" to={`${prefix}/profile`} aria-label="Your profile">{role === 'doctor' ? 'D' : 'A'}</NavLink></div></header><main className="page-content"><Outlet /></main></div>;
}
