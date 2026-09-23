import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const target = user.role === 'admin' 
      ? '/admin/dashboard' 
      : user.role === 'doctor' 
        ? '/doctor/dashboard' 
        : '/patient/dashboard';
    return <Navigate replace to={target} />;
  }

  return (
    <div className="landing-page-v2">
      <nav className="glass-nav">
        <div className="glass-nav__brand">
          <span className="glass-nav__logo-icon">✦</span> CureLink
        </div>
        <div className="glass-nav__links">
          <a href="#specialties">Departments</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
        </div>
        <div className="glass-nav__actions">
          <Link to="/login" className="glass-nav__link">Portal Sign In</Link>
          <Link to="/signup" className="button button--glow">Register Patient</Link>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-section__bg-elements">
          <div className="hero-blob hero-blob--1"></div>
          <div className="hero-blob hero-blob--2"></div>
        </div>
        <div className="hero-section__content">
          <div className="hero-badge">Trusted Digital Healthcare Platform</div>
          <h1>Next-Generation Healthcare Access &amp; Digital Consultations</h1>
          <p>
            Connect with verified specialists, book conflict-free appointments, and manage lifelong health records securely.
          </p>
          <div className="hero-section__actions">
            <Link to="/signup" className="button button--glow button--large">Book an Appointment</Link>
            <Link to="/login" className="button button--secondary button--large">Healthcare Portal</Link>
          </div>
        </div>
      </header>

      <section className="metrics-strip">
        <div className="metrics-strip__container">
          <div className="metric-pill">
            <span className="metric-pill__value">50+</span>
            <span className="metric-pill__label">Verified Specialists</span>
          </div>
          <div className="metric-pill">
            <span className="metric-pill__value">15k+</span>
            <span className="metric-pill__label">Patient Consultations</span>
          </div>
          <div className="metric-pill">
            <span className="metric-pill__value">Zero</span>
            <span className="metric-pill__label">Double Booking</span>
          </div>
          <div className="metric-pill">
            <span className="metric-pill__value">256-bit</span>
            <span className="metric-pill__label">Encrypted EMR</span>
          </div>
        </div>
      </section>

      <section id="specialties" className="landing-section">
        <div className="section-header">
          <h2>Specialties Showcase</h2>
          <p>Expert care across specialized departments</p>
        </div>
        <div className="specialties-grid">
          {['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Neurology'].map(spec => (
            <div key={spec} className="specialty-card">
              <div className="specialty-card__icon">⚕️</div>
              <h3>{spec}</h3>
              <p>Comprehensive {spec.toLowerCase()} care and consultation</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="landing-section landing-section--alt">
        <div className="section-header">
          <h2>Core Features</h2>
          <p>Built for reliability and seamless healthcare management</p>
        </div>
        <div className="features-grid">
          <div className="feature-card-interactive">
            <div className="feature-card__icon">📅</div>
            <h3>Real-Time Scheduling</h3>
            <p>Live availability tracking across all specialist calendars (FR-03/FR-04).</p>
          </div>
          <div className="feature-card-interactive">
            <div className="feature-card__icon">🔒</div>
            <h3>Conflict-Free Locking</h3>
            <p>Advanced concurrency control ensures no double bookings (FR-05).</p>
          </div>
          <div className="feature-card-interactive">
            <div className="feature-card__icon">📁</div>
            <h3>Centralized Health Records</h3>
            <p>Unified digital repository for prescriptions and reports (FR-06/FR-07).</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Three simple steps to better healthcare</p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-card__number">1</div>
            <h3>Create Patient Profile</h3>
            <p>Register securely and set up your foundational medical history.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-card__number">2</div>
            <h3>Pick Specialist &amp; Confirmed Slot</h3>
            <p>Browse available doctors and lock in your preferred time.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-card">
            <div className="step-card__number">3</div>
            <h3>Complete Consultation &amp; Access Digital Prescriptions</h3>
            <p>Attend your session and view your updated electronic medical records.</p>
          </div>
        </div>
      </section>

      <footer className="glass-footer">
        <div className="glass-footer__content">
          <div className="glass-footer__brand">
            <span className="glass-nav__logo-icon">✦</span> CureLink
          </div>
          <p>Trusted Digital Healthcare Platform</p>
          <div className="glass-footer__links">
            <a href="#specialties">Departments</a>
            <a href="#features">Features</a>
            <Link to="/login">Portal Sign In</Link>
          </div>
        </div>
        <div className="glass-footer__bottom">
          <p>&copy; {new Date().getFullYear()} CureLink. All rights reserved.</p>
          <p className="glass-footer__disclaimer">For demonstration purposes. Do not enter real medical data.</p>
        </div>
      </footer>
    </div>
  );
}
