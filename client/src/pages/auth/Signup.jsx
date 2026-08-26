import { Mail, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import AuthFooter from '../../components/auth/AuthFooter';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import PasswordInput from '../../components/auth/PasswordInput';

export default function Signup() {
  const navigate = useNavigate();
  function enterPortal(event) { event.preventDefault(); navigate('/patient/dashboard'); }
  return <AuthCard><AuthHeader title="Create your account" description="Join CureLink to manage your health securely and easily." /><form className="auth-form" noValidate onSubmit={enterPortal}><AuthInput icon={UserRound} id="signup-name" label="Full Name" placeholder="e.g. Jane Doe" /><AuthInput icon={Mail} id="signup-email" label="Email Address" type="email" placeholder="name@example.com" /><PasswordInput id="signup-password" /><PasswordInput id="signup-confirm-password" label="Confirm Password" /><label className="terms-field"><input type="checkbox" /><span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></span></label><button className="auth-submit" type="submit">Create Account <span aria-hidden="true">→</span></button></form><AuthFooter prompt="Already have an account?" linkLabel="Log in" to="/login" /></AuthCard>;
}
