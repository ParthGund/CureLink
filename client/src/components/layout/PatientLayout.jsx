import { Bell, ShieldPlus } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { label: 'Dashboard', to: '/patient/dashboard' },
  { label: 'Appointments', to: '/patient/appointments' },
  { label: 'Medical History', to: '/patient/medical-history' },
  { label: 'Messages', to: '/patient/messages' },
];

export default function PatientLayout() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <NavLink className="brand" to="/patient/dashboard" aria-label="CureLink home">
          <ShieldPlus aria-hidden="true" size={25} strokeWidth={2.3} />
          <span>CureLink</span>
        </NavLink>
        <nav className="top-nav__links" aria-label="Patient navigation">
          {navigation.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="top-nav__actions">
          <button className="icon-button" type="button" aria-label="Notifications"><Bell size={21} /></button>
          <NavLink className="profile-dot" to="/patient/profile" aria-label="Your profile">P</NavLink>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
    </div>
  );
}
