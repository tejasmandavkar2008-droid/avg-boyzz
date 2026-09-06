import { useState } from 'react'
import './LandingPage.css'

function LandingPage({ onGetStarted }) {
  const [activeTabPreview, setActiveTabPreview] = useState('optimization') // 'optimization' | 'risk' | 'friction' | 'stress'

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing-page">

      {/* Animated background glows */}
      <div className="lp-blob lp-blob-1"></div>
      <div className="lp-blob lp-blob-2"></div>
      <div className="lp-blob lp-blob-3"></div>
      <div className="lp-grid"></div>

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="url(#lp-logo-grad)" fillOpacity="0.25" stroke="url(#lp-logo-grad)" strokeWidth="1.8"/>
              <path d="M8 13.5l3-3 2.5 2.5 4.5-5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="8" r="1.5" fill="#38bdf8"/>
              <defs>
                <linearGradient id="lp-logo-grad" x1="3" y1="2" x2="21" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8"/>
                  <stop offset="0.5" stopColor="#3b82f6"/>
                  <stop offset="1" stopColor="#10b981"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="nav-title">QUANT<span className="nav-accent">GUARD</span></span>
        </div>

        <ul className="nav-links">
          <li><a href="#overview" onClick={(e) => { e.preventDefault(); scrollToSection('overview') }}>Overview</a></li>
          <li><a href="#pillars" onClick={(e) => { e.preventDefault(); scrollToSection('pillars') }}>Core Pillars</a></li>
          <li><a href="#risk-engine" onClick={(e) => { e.preventDefault(); scrollToSection('risk-engine') }}>Risk Engine</a></li>
          <li><a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection('workflow') }}>How It Works</a></li>
          <li><a href="#preview" onClick={(e) => { e.preventDefault(); scrollToSection('preview') }}>Demo Sandbox</a></li>
        </ul>

        <button className="nav-cta" onClick={onGetStarted} id="nav-get-started">
          Launch Terminal
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="hero-section" id="overview">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          ⭐ QUANTITATIVE ASSET & CAPITAL MANAGEMENT / OPTIMIZATION CONTROLS
        </div>

        <h1 className="hero-title">
          Automated Capital Optimization &<br />
          <span className="hero-gradient">Institutional Risk Safeguards</span>
        </h1>

        <p className="hero-desc">
          An end-to-end FinTech platform engineered to solve real-world balance sheet allocation, enforce mandatory liquidity & single-asset limits, and execute zero-friction rebalancing with <strong>Markowitz MPT, Parametric VaR, and Automated Breach Controls</strong>.
        </p>

        <div className="hero-actions">
          <button className="hero-btn-primary" onClick={onGetStarted} id="hero-get-started">
            Launch Risk Terminal — It's Free
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="hero-btn-secondary" onClick={() => scrollToSection('preview')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
            </svg>
            Explore Before vs After Demo
          </button>
        </div>

        {/* ── QUANTITATIVE KPI STATS ── */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">₹10 Cr+</span>
            <span className="stat-label">Tested Capital Capacity</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-value">95% & 99%</span>
            <span className="stat-label">Parametric VaR Horizons</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-value">≥ 20%</span>
            <span className="stat-label">Mandatory Liquidity Ratio</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-value">0.035%</span>
            <span className="stat-label">Minimized Turnover Drag</span>
          </div>
        </div>
      </section>

      {/* ── 4 CORE PILLARS OF THE PROBLEM STATEMENT ── */}
      <section className="lp-section" id="pillars">
        <div className="lp-section-header">
          <span className="lp-tag">COMPREHENSIVE SOLUTION</span>
          <h2>Solving the Core Challenges of Institutional Asset Management</h2>
          <p>
            When market volatility spikes, traditional static allocations fail. Our platform continuously evaluates risk, prevents overconcentration, and mitigates execution friction.
          </p>
        </div>

        <div className="pillars-grid">
          {/* Pillar 1 */}
          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'linear-gradient(135deg, rgba(26,107,255,0.2), rgba(26,107,255,0.05))', color: '#60a5fa' }}>
              🎯
            </div>
            <h3>1. Real-World Constrained Optimization</h3>
            <p>
              Stops algorithms from naïvely pouring 100% into high-beta assets. Enforces strict bounds: <strong>Stock ≤ 40%, Bonds ≤ 50%, Gold ≤ 25%, Cash ≥ 15%, VaR ≤ 6%</strong> while maximizing risk-adjusted Sharpe ratios.
            </p>
            <ul className="pillar-checklist">
              <li>✓ Multi-Asset Simplex Optimizer (Stocks, Bonds, Gold, Cash)</li>
              <li>✓ Markowitz Tangency & Minimum Variance (MVP) frontier</li>
              <li>✓ Dynamic Sharpe ratio maximization (Sharpe Ratio ≥ 1.45)</li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="pillar-card highlight-border">
            <div className="pillar-icon" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.05))', color: '#34d399' }}>
              🛡️
            </div>
            <h3>2. 5-Point Quantitative Risk Engine (A-E)</h3>
            <p>
              Continuous mathematical evaluation across 5 critical risk dimensions: <strong>Portfolio Volatility, Value at Risk (VaR), Maximum Drawdown (MDD), Liquidity Adequacy, and Concentration Limits</strong>.
            </p>
            <ul className="pillar-checklist">
              <li>✓ Gaussian Parametric VaR with natural language guarantees</li>
              <li>✓ Peak-to-Trough Drawdown & active recovery trajectory</li>
              <li>✓ Herfindahl-Hirschman Index (HHI) concentration limits</li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', color: '#fbbf24' }}>
              💰
            </div>
            <h3>3. Zero-Penalty Rebalancing Friction Engine</h3>
            <p>
              Quantifies realistic execution friction against gross risk penalty reduction. Accurately calculates <strong>STT (0.10%), Exchange Fees, Stamp Duty, Brokerage/GST, and TWAP Market Slippage</strong>.
            </p>
            <ul className="pillar-checklist">
              <li>✓ Full Indian statutory taxation & regulatory fee breakdown</li>
              <li>✓ Net Value Created formula: Risk Reduction - Friction &gt; 0</li>
              <li>✓ Staged trade execution roadmap to prevent price impact</li>
            </ul>
          </div>

          {/* Pillar 4 */}
          <div className="pillar-card">
            <div className="pillar-icon" style={{ background: 'linear-gradient(135deg, rgba(248,113,113,0.2), rgba(248,113,113,0.05))', color: '#f87171' }}>
              🌪️
            </div>
            <h3>4. Crisis Stress Testing & Auto-Cure</h3>
            <p>
              Stress-tests capital resilience against historical black-swan crises (2008 Global Crash, 2020 Covid Shock, RBI +250bps Rate Spikes) with automated breach detection and 1-click Auto-Cure.
            </p>
            <ul className="pillar-checklist">
              <li>✓ Instant detection of single-asset & liquidity breaches</li>
              <li>✓ Automated rebalancing recommendations to cure deficits</li>
              <li>✓ Macro shock capital preservation index calculation</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE TERMINAL PREVIEW & BENCHMARK ── */}
      <section className="lp-section" id="preview">
        <div className="lp-section-header">
          <span className="lp-tag tag-purple">LIVE OPTIMIZER DEMONSTRATION</span>
          <h2>Real-World Constraints in Action: Before vs After</h2>
          <p>
            See how the platform detects unconstrained risk and solves for the optimal institutional portfolio.
          </p>
        </div>

        <div className="demo-comparison-wrapper">
          {/* Card 1: Unconstrained High Risk */}
          <div className="demo-comp-card card-before">
            <div className="d-card-head">
              <span className="d-card-tag tag-danger">⚠️ CURRENT STATE (UNCONSTRAINED)</span>
              <span className="d-card-status">3 Violations Detected</span>
            </div>
            <h4>Stocks 60% • Bonds 20% • Gold 10% • Cash 10%</h4>
            <p className="d-card-desc">High equity exposure breaches single-asset limits and creates severe liquidity deficit.</p>
            
            <div className="d-metrics-row">
              <div className="d-metric-box">
                <span className="dm-lbl">1-Day VaR (95%)</span>
                <span className="dm-val val-danger">8.2% (₹8,20,000)</span>
              </div>
              <div className="d-metric-box">
                <span className="dm-lbl">Liquidity Ratio</span>
                <span className="dm-val val-danger">10% (⚠️ Deficit)</span>
              </div>
              <div className="d-metric-box">
                <span className="dm-lbl">Concentration</span>
                <span className="dm-val val-danger">HIGH (&gt; 40%)</span>
              </div>
            </div>

            <div className="d-bars-stack">
              <div className="d-bar-row">
                <span>Stocks (60%)</span>
                <div className="d-bar-track"><div className="d-bar-fill fill-red" style={{ width: '60%' }}></div></div>
              </div>
              <div className="d-bar-row">
                <span>Bonds (20%)</span>
                <div className="d-bar-track"><div className="d-bar-fill fill-blue" style={{ width: '20%' }}></div></div>
              </div>
              <div className="d-bar-row">
                <span>Gold (10%)</span>
                <div className="d-bar-track"><div className="d-bar-fill fill-gold" style={{ width: '10%' }}></div></div>
              </div>
              <div className="d-bar-row">
                <span>Cash (10%)</span>
                <div className="d-bar-track"><div className="d-bar-fill fill-red" style={{ width: '10%' }}></div></div>
              </div>
            </div>
          </div>

          <div className="demo-arrow-divider">
            <div className="arrow-circle">➔</div>
            <span>Optimized by Constraint Solver</span>
          </div>

          {/* Card 2: System Recommended */}
          <div className="demo-comp-card card-after">
            <div className="d-card-head">
              <span className="d-card-tag tag-success">🎯 SYSTEM RECOMMENDED (OPTIMAL)</span>
              <span className="d-card-status status-green">✅ 100% Compliant</span>
            </div>
            <h4>Stocks 35% • Bonds 35% • Gold 15% • Cash 15%</h4>
            <p className="d-card-desc">All regulatory constraints satisfied: VaR drops to 5.1%, liquidity restored to 15%, concentration cured.</p>
            
            <div className="d-metrics-row">
              <div className="d-metric-box">
                <span className="dm-lbl">Optimized VaR (95%)</span>
                <span className="dm-val val-success">5.1% (₹5,10,000)</span>
              </div>
              <div className="d-metric-box">
                <span className="dm-lbl">Liquidity Ratio</span>
                <span className="dm-val val-success">15% (✅ Compliant)</span>
              </div>
              <div className="d-metric-box">
                <span className="dm-lbl">Concentration</span>
                <span className="dm-val val-success">NORMAL (≤ 40%)</span>
              </div>
            </div>

            <div className="d-bars-stack">
              <div className="d-bar-row">
                <span>Stocks (35%)</span>
                <div className="d-bar-track"><div className="d-bar-fill fill-green" style={{ width: '35%' }}></div></div>
              </div>
              <div className="d-bar-row">
                <span>Bonds (35%)</span>
                <div className="d-bar-track"><div className="d-bar-fill fill-green" style={{ width: '35%' }}></div></div>
              </div>
              <div className="d-bar-row">
                <span>Gold (15%)</span>
                <div className="d-bar-track"><div className="d-bar-fill fill-green" style={{ width: '15%' }}></div></div>
              </div>
              <div className="d-bar-row">
                <span>Cash (15%)</span>
                <div className="d-bar-track"><div className="d-bar-fill fill-green" style={{ width: '15%' }}></div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="demo-action-footer">
          <button className="hero-btn-primary" onClick={onGetStarted}>
            Launch Terminal & Run on Your Portfolio
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── 4-STEP INSTITUTIONAL WORKFLOW ── */}
      <section className="lp-section" id="workflow">
        <div className="lp-section-header">
          <span className="lp-tag">HOW IT WORKS</span>
          <h2>Automated End-to-End Execution Pipeline</h2>
          <p>From real-time database order synchronization to mathematical optimization and trade dispatching.</p>
        </div>

        <div className="workflow-steps-grid">
          <div className="wf-step-card">
            <div className="wf-step-num">01</div>
            <h4>Connect Capital & Holdings</h4>
            <p>Syncs real-time buy/sell orders and portfolio capital directly from Supabase PostgreSQL database.</p>
          </div>

          <div className="wf-step-card">
            <div className="wf-step-num">02</div>
            <h4>Continuous Risk Evaluation</h4>
            <p>Computes covariance matrices (wᵀ · Σ · w), Parametric VaR, and Peak-to-Trough Drawdowns in real time.</p>
          </div>

          <div className="wf-step-card">
            <div className="wf-step-num">03</div>
            <h4>Automated Breach Detection</h4>
            <p>Monitors single-asset concentration limits (≤ 40%) and mandatory liquidity ratios (≥ 20%) continuously.</p>
          </div>

          <div className="wf-step-card">
            <div className="wf-step-num">04</div>
            <h4>Zero-Penalty Rebalancing</h4>
            <p>Generates low-impact staged trades, factoring in exact STT, exchange fees, and TWAP slippage to create net risk-adjusted value.</p>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-banner">
        <div className="cta-content">
          <h2>Ready to Optimize Your Balance Sheet?</h2>
          <p>Experience institutional-grade risk management, Markowitz MPT frontiers, and automated regulatory safeguard controls.</p>
          <button className="hero-btn-primary" onClick={onGetStarted}>
            Access Risk Engine Terminal Now
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="footer-left">
          <span className="footer-brand">FINTECH AM</span>
          <span>© 2026 Asset & Capital Management / Optimization Controls Terminal. All rights reserved.</span>
        </div>
        <div className="footer-right">
          <span>PostgreSQL (Supabase) • Spring Boot • React Quantitative Engine</span>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage
