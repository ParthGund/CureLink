import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-nav__brand">CureLink</div>
        <div className="landing-nav__links">
          <a href="#features">Features</a>
          <a href="#specialists">Specialists</a>
          <a href="#how-it-works">About</a>
        </div>
        <div className="landing-nav__actions">
          <Link to="/login" className="button button--text">Sign In</Link>
          <Link to="/signup" className="button">Register</Link>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="landing-hero__content">
          <h1>Modern Healthcare, Simplified</h1>
          <p>
            Experience instant appointment booking and secure digital health records.
            Connecting you with verified specialists effortlessly.
          </p>
          <div className="landing-hero__actions">
            <Link to="/login" className="button">Book Appointment</Link>
            <Link to="/login" className="button button--secondary">Doctor Portal</Link>
          </div>
        </div>
      </header>

      <section id="features" className="landing-features">
        <h2>Why Choose CureLink?</h2>
        <div className="landing-features__grid">
          <div className="landing-feature-card">
            <h3>Verified Specialists</h3>
            <p>Browse experienced healthcare professionals across departments.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Real-Time Slot Booking</h3>
            <p>Zero wait times and conflict-free booking.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Digital Medical Records</h3>
            <p>Secure access to prescriptions, visit history, and consultations.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-steps">
        <h2>How It Works</h2>
        <div className="landing-steps__grid">
          <div className="landing-step">
            <div className="landing-step__number">1</div>
            <h3>Create Patient Account</h3>
          </div>
          <div className="landing-step">
            <div className="landing-step__number">2</div>
            <h3>Select Specialist &amp; Time Slot</h3>
          </div>
          <div className="landing-step">
            <div className="landing-step__number">3</div>
            <h3>Get Confirmed Care</h3>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__content">
          <div className="landing-footer__brand">CureLink</div>
          <p>Student Project • Healthcare Management System</p>
          <div className="landing-footer__links">
            <a href="#features">Features</a>
            <a href="#how-it-works">About</a>
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
