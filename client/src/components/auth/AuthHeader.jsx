import { ShieldPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthHeader({ title, description }) {
  return (
    <header className="auth-header">
      <Link to="/" className="auth-brand" style={{ textDecoration: 'none' }}>
        <ShieldPlus aria-hidden="true" size={27} strokeWidth={2.6} />
        <span>CureLink</span>
      </Link>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
