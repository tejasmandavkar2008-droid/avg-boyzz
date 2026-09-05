import './LandingPage.css'

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">

      {/* Animated background */}
      <div className="lp-blob lp-blob-1"></div>
      <div className="lp-blob lp-blob-2"></div>
      <div className="lp-blob lp-blob-3"></div>
      <div className="lp-grid"></div>

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="nav-title">FINTECH <span className="nav-accent">AM</span></span>
        </div>

        <ul className="nav-links">
          <li><a href="#">Features</a></li>
          <li><a href="#">Markets</a></li>
          <li><a href="#">Pricing</a></li>
          <li><a href="#">About</a></li>
        </ul>

        <button className="nav-cta" onClick={onGetStarted} id="nav-get-started">
          Get Started
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          Trusted by 50,000+ investors worldwide
        </div>

        <h1 className="hero-title">
          Manage Your Assets<br />
          <span className="hero-gradient">Smarter & Faster</span>
        </h1>

        <p className="hero-desc">
          A next-generation fintech platform to track, grow, and protect your<br />
          portfolio with real-time insights and AI-powered analytics.
        </p>

        <div className="hero-actions">
          <button className="hero-btn-primary" onClick={onGetStarted} id="hero-get-started">
            Get Started — It's Free
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="hero-btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
            </svg>
            Watch Demo
          </button>
        </div>

        {/* ── STATS ── */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">$2.4B+</span>
            <span className="stat-label">Assets Managed</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-value">50K+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-value">99.9%</span>
            <span className="stat-label">Uptime SLA</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-value">18%</span>
            <span className="stat-label">Avg Annual Return</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'linear-gradient(135deg,#1a6bff22,#1a6bff11)', borderColor: '#1a6bff33' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 3v18h18" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round"/>
              <path d="M7 16l4-6 4 4 4-8" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Real-Time Analytics</h3>
          <p>Live market data with intelligent dashboards to track your investments 24/7.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'linear-gradient(135deg,#7b2fff22,#7b2fff11)', borderColor: '#7b2fff33' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="#a78bfa" strokeWidth="1.5"/>
              <path d="M12 6v6l4 2" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>AI-Powered Insights</h3>
          <p>Smart recommendations powered by ML models to maximize your portfolio returns.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" style={{ background: 'linear-gradient(135deg,#00c6ff22,#00c6ff11)', borderColor: '#00c6ff33' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#22d3ee" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>Bank-Grade Security</h3>
          <p>256-bit encryption, 2FA, and biometric authentication to keep your funds safe.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <span>© 2026 Fintech Asset Manager. All rights reserved.</span>
        <span>Built for the future of finance.</span>
      </footer>

    </div>
  )
}

export default LandingPage
