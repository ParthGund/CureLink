import { Link } from 'react-router-dom';

export default function AuthFooter({ prompt, linkLabel, to }) {
  return <footer className="auth-footer">{prompt} <Link to={to}>{linkLabel}</Link></footer>;
}
