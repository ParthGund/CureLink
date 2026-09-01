import { Mail, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/auth/AuthCard';
import AuthFooter from '../../components/auth/AuthFooter';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import PasswordInput from '../../components/auth/PasswordInput';

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');
    if (!name || !email || !password) {
      setErrorMsg('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      // registration succeeded – redirect to login page
      navigate('/login');
    } catch (err) {
      // authService throws an Error with .message set to backend message
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthCard>
      <AuthHeader title="Create your account" description="Join CureLink to manage your health securely and easily." />
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <AuthInput icon={UserRound} id="signup-name" label="Full Name" placeholder="e.g. Jane Doe" value={name} onChange={e => setName(e.target.value)} />
        <AuthInput icon={Mail} id="signup-email" label="Email Address" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <PasswordInput id="signup-password" value={password} onChange={e => setPassword(e.target.value)} />
        <PasswordInput id="signup-confirm-password" label="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        <label className="terms-field"><input type="checkbox" required />
          <span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></span>
        </label>
        {errorMsg && <p className="auth-error" role="alert">{errorMsg}</p>}
        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Account'} <span aria-hidden="true">→</span>
        </button>
      </form>
      <AuthFooter prompt="Already have an account?" linkLabel="Log in" to="/login" />
    </AuthCard>
  );
}
