import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return null;
  }

  if (isAuthenticated && user) {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav__brand">CureLink</div>
        <div className="landing-nav__links">
          <a href="#services">Services</a>
          <a href="#specialists">Specialists</a>
          <a href="#about">About</a>
        </div>
        <div className="landing-nav__actions">
          <Link to="/login" className="button button--text">Sign In</Link>
          <Link to="/signup" className="button">Create Patient Account</Link>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="landing-hero__content">
          <h1>Healthcare Simplified: Book Consultations &amp; Manage Records</h1>
          <p>
            Instant appointment booking with verified doctors and 24/7 digital medical records.
          </p>
          <div className="landing-hero__actions">
            <Link to="/signup" className="button">Book an Appointment</Link>
            <Link to="/login" className="button button--secondary">Portal Sign In</Link>
          </div>
        </div>
      </header>

      <section id="services" className="landing-features">
        <h2>Why Choose CureLink?</h2>
        <div className="landing-features__grid">
          <div className="landing-feature-card">
            <h3>Verified Specialists</h3>
            <p>Browse experienced healthcare professionals across departments.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Conflict-Free Slot Booking</h3>
            <p>Zero wait times and seamless scheduling.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Secure Digital Records</h3>
            <p>Secure access to prescriptions, visit history, and consultations.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-steps">
        <h2>How It Works</h2>
        <div className="landing-steps__grid">
          <div className="landing-step">
            <div className="landing-step__number">1</div>
            <h3>Register Patient Profile</h3>
          </div>
          <div className="landing-step">
            <div className="landing-step__number">2</div>
            <h3>Select Specialist &amp; Available Slot</h3>
          </div>
          <div className="landing-step">
            <div className="landing-step__number">3</div>
            <h3>Attend Consultation &amp; Access EMR</h3>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__content">
          <div className="landing-footer__brand">CureLink</div>
          <p>Student Project • Healthcare Management System</p>
          <div className="landing-footer__links">
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
        <div className="landing-footer__bottom">
          &copy; {new Date().getFullYear()} CureLink. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
