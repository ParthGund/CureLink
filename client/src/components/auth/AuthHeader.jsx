import { ShieldPlus } from 'lucide-react';

export default function AuthHeader({ title, description }) {
  return <header className="auth-header"><div className="auth-brand"><ShieldPlus aria-hidden="true" size={27} strokeWidth={2.6} /><span>CureLink</span></div><h1>{title}</h1><p>{description}</p></header>;
}
