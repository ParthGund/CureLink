import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AuthCard({ children }) {
  return (
    <main className="auth-page">
      <div className="auth-page__container">
        <Link to="/" className="auth-back-home">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <section className="auth-card">
          {children}
        </section>
      </div>
    </main>
  );
}
