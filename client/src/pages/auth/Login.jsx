import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import AuthFooter from '../../components/auth/AuthFooter';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import PasswordInput from '../../components/auth/PasswordInput';

export default function Login() {
  const navigate = useNavigate();
  function enterPortal(event) { event.preventDefault(); navigate('/patient/dashboard'); }
  return <AuthCard><AuthHeader title="Welcome back" description="Sign in to your patient portal to manage your health information securely." /><form className="auth-form" noValidate onSubmit={enterPortal}><AuthInput icon={Mail} id="login-email" label="Email Address" type="email" placeholder="Enter your email" /><div className="password-label"><span>Password</span><button type="button">Forgot password?</button></div><PasswordInput id="login-password" hideLabel /><button className="auth-submit" type="submit">Sign In <span aria-hidden="true">→</span></button></form><AuthFooter prompt="Don't have an account?" linkLabel="Sign up" to="/signup" /></AuthCard>;
}
