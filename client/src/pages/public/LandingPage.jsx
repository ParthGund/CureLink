import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
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

        <button 
          className="glass-nav__toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`glass-nav__menu ${isMenuOpen ? 'glass-nav__menu--open' : ''}`}>
          <div className="glass-nav__links">
            <a href="#specialties" onClick={(e) => scrollToSection(e, 'specialties')}>Departments</a>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How It Works</a>
          </div>
          <div className="glass-nav__actions">
            <Link to="/login" className="glass-nav__link">Portal Sign In</Link>
            <Link to="/signup" className="button button--glow">Register Patient</Link>
          </div>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-section__bg-elements">
          <div className="hero-blob hero-blob--1"></div>
          <div className="hero-blob hero-blob--2"></div>
        </div>
        <div className="hero-section__content">
          <div className="hero-badge">Clinical Appointment Portal</div>
          <h1>Professional Healthcare &amp; Clinical Appointments</h1>
          <p>
            Connect with specialists, book appointments securely, and manage your medical history in one seamless platform.
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
            <span className="metric-pill__value">Registered</span>
            <span className="metric-pill__label">Doctors</span>
          </div>
          <div className="metric-pill">
            <span className="metric-pill__value">Role-Based</span>
            <span className="metric-pill__label">Access</span>
          </div>
          <div className="metric-pill">
            <span className="metric-pill__value">Double-Booking</span>
            <span className="metric-pill__label">Protection</span>
          </div>
        </div>
      </section>

      <section id="specialties" className="landing-section">
        <div className="section-header">
          <h2>Departments</h2>
          <p>Expert care across specialized departments</p>
        </div>
        <div className="specialties-grid">
          {['General Medicine', 'Cardiology', 'Dermatology'].map(spec => (
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
            <p>Live availability tracking across all specialist calendars.</p>
          </div>
          <div className="feature-card-interactive">
            <div className="feature-card__icon">🔒</div>
            <h3>Double-Booking Protection</h3>
            <p>Slot availability is checked at booking to prevent overlapping reservations.</p>
          </div>
          <div className="feature-card-interactive">
            <div className="feature-card__icon">📁</div>
            <h3>Centralized Health Records</h3>
            <p>Unified digital repository for prescriptions and consultation records.</p>
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
            <a href="#specialties" onClick={(e) => scrollToSection(e, 'specialties')}>Departments</a>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
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
