import { Bell, LogOut, ShieldPlus } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleNavigation = {
  doctor: [
    ['Dashboard', 'dashboard'],
    ['My Schedule', 'schedule'],
    ['Appointments', 'appointments'],
    ['Consultations', 'consultations'],
    ['Patients', 'patients'],
  ],
  admin: [
    ['Overview', 'dashboard'],
    ['Doctors', 'doctors'],
    ['Patients', 'patients'],
    ['Appointments', 'appointments'],
  ],
};

export default function RoleLayout({ role }) {
  const prefix = `/${role}`;
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <NavLink className="brand" to={`${prefix}/dashboard`}>
          <ShieldPlus size={25} />
          <span>CureLink</span>
        </NavLink>
        <nav className="top-nav__links" aria-label={`${role} navigation`}>
          {roleNavigation[role].map(([label, path]) => (
            <NavLink key={path} to={`${prefix}/${path}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="top-nav__actions">
          <button className="icon-button" type="button" aria-label="Notifications"><Bell size={21} /></button>
          <NavLink className="profile-dot" to={`${prefix}/profile`} aria-label="Your profile">
            {role === 'doctor' ? 'D' : 'A'}
          </NavLink>
          <button className="icon-button" type="button" aria-label="Log out" onClick={handleLogout}><LogOut size={19} /></button>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
    </div>
  );
}
