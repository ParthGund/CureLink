import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AuthFooter({ prompt, linkLabel, to }) {
  return (
    <footer className="auth-footer">
      <div>{prompt} <Link to={to}>{linkLabel}</Link></div>
      <div className="auth-footer__home">
        <Link className="auth-footer__home-link" to="/">
          <ArrowLeft size={14} /> Back to Home Page
        </Link>
      </div>
    </footer>
  );
}
