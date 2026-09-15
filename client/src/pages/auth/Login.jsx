import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthCard from '../../components/auth/AuthCard';
import AuthFooter from '../../components/auth/AuthFooter';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import PasswordInput from '../../components/auth/PasswordInput';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);

    try {
      const data = await login(email, password);

      const role = data.user?.role || 'patient';
      const dashboardPaths = {
        patient: '/patient/dashboard',
        doctor: '/doctor/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(dashboardPaths[role] || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Welcome back"
        description="Sign in to your patient portal to manage your health information securely."
      />
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {error && <p className="auth-error">{error}</p>}
        <AuthInput
          icon={Mail}
          id="login-email"
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="password-label">
          <span>Password</span>
          <button type="button">Forgot password?</button>
        </div>
        <PasswordInput
          id="login-password"
          hideLabel
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="auth-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign In'}{' '}
          {!submitting && <span aria-hidden="true">→</span>}
        </button>
      </form>
      <AuthFooter prompt="Don't have an account?" linkLabel="Sign up" to="/signup" />
    </AuthCard>
  );
}
