import { useState, useEffect } from 'react'
import PortfolioPanel, { formatINR, formatINRShorthand } from './PortfolioPanel'
import MarketsPage from './MarketsPage'
import AnalyticsTab from './AnalyticsTab'
import RiskEngineTab from './RiskEngineTab'
import AiCopilot from './AiCopilot'
import RiskRemindersDrawer from './RiskRemindersDrawer'
import './DashboardPage.css'

const NAV_ITEMS = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>
  },
  {
    id: 'portfolio', label: 'Portfolio',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 16l4-6 4 4 4-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  },
  {
    id: 'risk', label: 'Risk Engine',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  },
  {
    id: 'markets', label: 'Markets',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="1.8"/></svg>
  },
  {
    id: 'analytics', label: 'Analytics',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  },
  {
    id: 'settings', label: 'Settings',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>
  },
]

const TRANSACTIONS = [
  { name: 'Reliance Industries', type: 'BUY',  amount: '+₹1,20,000', date: 'Today',      color: '#4ade80' },
  { name: 'HDFC Mutual Fund',    type: 'SIP',  amount: '+₹25,000',   date: 'Yesterday',  color: '#4a9eff' },
  { name: 'Gold ETF',            type: 'BUY',  amount: '+₹15,000',   date: '2 days ago', color: '#fbbf24' },
  { name: 'SBI FD',              type: 'SELL', amount: '-₹50,000',   date: '3 days ago', color: '#f87171' },
  { name: 'TCS Ltd',             type: 'BUY',  amount: '+₹80,000',   date: '4 days ago', color: '#4ade80' },
]

function DonutChart({ segments, totalText }) {
  const r = 54, cx = 64, cy = 64
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20"/>
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="20"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '64px 64px' }}
          />
        )
        offset += dash
        return el
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{totalText || '₹1Cr'}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">Total</text>
    </svg>
  )
}

function Sparkline({ points, color }) {
  const w = 120, h = 40
  const min = Math.min(...points), max = Math.max(...points)
  const xs = points.map((_, i) => (i / (points.length - 1)) * w)
  const ys = points.map(p => h - ((p - min) / (max - min)) * h)
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
  const area = d + ` L${w},${h} L0,${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${color})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function DashboardPage({ user, onLogout }) {
  const [activeNav, setActiveNav]         = useState('dashboard')
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [remindersOpen, setRemindersOpen] = useState(false)
  const [unreadAlerts, setUnreadAlerts]   = useState(0)

  // User-configurable portfolio state (loads from localStorage or defaults, then validates with backend)
  const [portfolioData, setPortfolioData] = useState(() => {
    try {
      const saved = localStorage.getItem('user_portfolio_config')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.capital) return parsed
      }
    } catch (e) {}
    return {
      capital: 10000000,
      riskLimit: 12.4,
      liquidityLimit: 72.0,
      expectedReturn: 11.8
    }
  })

  // Fetch reminder unread status on mount
  useEffect(() => {
    const userEmail = user?.email || 'guest'
    fetch(`/api/risk/reminders?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const unread = data.filter(r => !r.isRead).length
          setUnreadAlerts(unread)
        }
      })
      .catch(() => {})
  }, [user?.email, remindersOpen])

  // Listen to portfolio_updated events across all components
  useEffect(() => {
    const handlePortfolioUpdate = (e) => {
      if (e.detail && e.detail.capital) {
        setPortfolioData(e.detail)
        try {
          localStorage.setItem('user_portfolio_config', JSON.stringify(e.detail))
        } catch (err) {}
      }
    }
    window.addEventListener('portfolio_updated', handlePortfolioUpdate)
    return () => window.removeEventListener('portfolio_updated', handlePortfolioUpdate)
  }, [])

  // Load user's saved portfolio from backend on mount or when user changes
  useEffect(() => {
    const userEmail = user?.email || 'guest'
    fetch(`/api/portfolio?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.capital) {
          const fresh = {
            capital: data.capital,
            riskLimit: data.riskLimit,
            liquidityLimit: data.liquidityLimit,
            expectedReturn: data.expectedReturn
          }
          setPortfolioData(fresh)
          try {
            localStorage.setItem('user_portfolio_config', JSON.stringify(fresh))
          } catch (err) {}
        }
      })
      .catch(err => {
        console.warn('Could not fetch portfolio from backend:', err)
      })
  }, [user?.email])

  // Dynamic values calculated from user portfolio
  const cap = Number(portfolioData.capital) || 10000000
  const risk = Number(portfolioData.riskLimit) || 12.4
  const liq = Number(portfolioData.liquidityLimit) || 72.0
  const ret = Number(portfolioData.expectedReturn) || 11.8

  const monthlyGain = Math.round((cap * (ret / 100)) / 12)
  const liquidAmount = Math.round(cap * (liq / 100))

  const kpiCards = [
    {
      title: 'Portfolio Value',
      value: formatINR(cap),
      sub: `+₹${monthlyGain.toLocaleString('en-IN')} this month`,
      subColor: '#4ade80',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      iconBg: 'linear-gradient(135deg,#1a6bff,#0038a8)',
      glow: 'rgba(26,107,255,0.2)',
      spark: [80, 85, 78, 92, 88, 95, 100],
      sparkColor: '#4a9eff',
    },
    {
      title: 'Expected Return',
      value: `${ret.toFixed(1)}%`,
      sub: `+${(ret * 0.2).toFixed(1)}% vs last year`,
      subColor: '#4ade80',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      iconBg: 'linear-gradient(135deg,#7b2fff,#3a0ca3)',
      glow: 'rgba(123,47,255,0.2)',
      spark: [60, 70, 65, 80, 75, 88, 92],
      sparkColor: '#a78bfa',
    },
    {
      title: 'Portfolio Risk',
      value: `${risk.toFixed(1)}%`,
      badge: risk <= 15 ? 'Low' : risk <= 25 ? 'Moderate' : 'High',
      sub: risk <= 15 ? 'Well diversified' : 'Higher growth exposure',
      subColor: risk <= 15 ? '#4ade80' : '#fbbf24',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      iconBg: risk <= 15 ? 'linear-gradient(135deg,#059669,#065f46)' : 'linear-gradient(135deg,#d97706,#92400e)',
      glow: risk <= 15 ? 'rgba(5,150,105,0.2)' : 'rgba(217,119,6,0.2)',
      spark: [40, 38, 42, 35, 38, 36, 35],
      sparkColor: risk <= 15 ? '#34d399' : '#fbbf24',
    },
    {
      title: 'Liquidity',
      value: `${liq.toFixed(1)}%`,
      badge: liq >= 50 ? 'High' : liq >= 25 ? 'Moderate' : 'Low',
      sub: `${formatINRShorthand(liquidAmount)} liquid assets`,
      subColor: liq >= 50 ? '#4ade80' : '#fbbf24',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      iconBg: 'linear-gradient(135deg,#0891b2,#0e7490)',
      glow: 'rgba(8,145,178,0.2)',
      spark: [55, 60, 58, 65, 68, 70, 72],
      sparkColor: '#22d3ee',
    },
  ]

  // Dynamic asset allocations for the dashboard donut
  const dynamicAllocations = [
    { label: 'Liquid Cash & T-Bills', pct: Math.round(liq), color: '#22d3ee' },
    { label: 'Equities (Growth)',      pct: Math.round(Math.min(risk * 2.2, Math.max(10, 100 - liq - 15))), color: '#4a9eff' },
    { label: 'Mutual Funds & Debt',   pct: Math.max(5, Math.round(100 - liq - Math.min(risk * 2.2, Math.max(10, 100 - liq - 15)) - 10)), color: '#a78bfa' },
    { label: 'Gold & Hedge Assets',   pct: 10, color: '#fbbf24' },
  ]

  return (
    <div className="db-root">
      {/* Mobile overlay */}
      <div
        className={`db-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── SIDEBAR ── */}
      <aside className={`db-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="db-logo">
          <div className="db-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="url(#db-logo-grad)" fillOpacity="0.2" stroke="url(#db-logo-grad)" strokeWidth="1.8"/>
              <path d="M8 13.5l3-3 2.5 2.5 4.5-5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="18" cy="8" r="1.5" fill="#38bdf8"/>
              <defs>
                <linearGradient id="db-logo-grad" x1="3" y1="2" x2="21" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8"/>
                  <stop offset="0.5" stopColor="#3b82f6"/>
                  <stop offset="1" stopColor="#10b981"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="db-logo-name">FINTECH</div>
            <div className="db-logo-sub">Asset Manager</div>
          </div>
        </div>

        <nav className="db-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              className={`db-nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false) }}>
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'portfolio' && (
                <span className="db-nav-badge">Setup</span>
              )}
              {item.id === 'markets' && (
                <span className="db-nav-badge mkt-badge-live">Live</span>
              )}
            </button>
          ))}
        </nav>

        <div className="db-sidebar-footer">
          <div className="db-avatar-row">
            <div className="db-avatar">{(user?.name || 'U')[0].toUpperCase()}</div>
            <div className="db-avatar-info">
              <span className="db-avatar-name">{user?.name || 'User'}</span>
              <span className="db-avatar-email">{user?.email || ''}</span>
            </div>
          </div>
          <button className="db-logout" onClick={onLogout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="db-main">

        {/* Top bar */}
        <header className="db-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            {/* Hamburger - mobile only */}
            <button className="db-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div>
              <h1 className="db-greeting">Good afternoon, {(user?.name || 'Investor').split(' ')[0]}</h1>
              <p className="db-date">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
            </div>
          </div>

          <div className="db-topbar-right">
            {activeNav !== 'portfolio' ? (
              <button className="db-action-link" onClick={() => setActiveNav('portfolio')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Set Capital & Risk
              </button>
            ) : (
              <button className="db-action-link" onClick={() => setActiveNav('dashboard')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2"/></svg>
                Dashboard Overview
              </button>
            )}

            {/* Notification Bell with Unread Reminder Indicator */}
            <button 
              className="db-notif-btn" 
              onClick={() => setRemindersOpen(true)} 
              title="Risk Limit & Market Step-Down Reminders"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {unreadAlerts > 0 && <span className="db-notif-dot"></span>}
            </button>
            <div className="db-avatar db-avatar-top" title={user?.name || 'User'}>{(user?.name || 'U')[0].toUpperCase()}</div>

            {/* Prominent Topbar Log Out Button */}
            <button className="db-topbar-logout-btn" onClick={onLogout} title="Log Out of Account">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="db-content">

          {/* ══════════════════════════════════════════════════════
              PORTFOLIO TAB: ENTER CAPITAL, RISK & LIQUIDITY LIMIT
              ══════════════════════════════════════════════════════ */}
          {activeNav === 'portfolio' && (
            <PortfolioPanel
              user={user}
              portfolioData={portfolioData}
              onSaveSuccess={(updated) => {
                setPortfolioData(updated)
                try {
                  localStorage.setItem('user_portfolio_config', JSON.stringify(updated))
                } catch (e) {}
              }}
              onNavigateDashboard={() => setActiveNav('dashboard')}
              onNavigateAnalytics={() => setActiveNav('analytics')}
            />
          )}

          {/* ══════════════════════════════════════════════════════
              DASHBOARD OVERVIEW TAB
              ══════════════════════════════════════════════════════ */}
          {activeNav === 'dashboard' && (
            <>
              {/* Portfolio shortcut banner */}
              <div className="db-banner-shortcut">
                <div className="db-banner-left">
                  <div>
                    <div className="db-banner-heading">Active Capital & Risk Configuration</div>
                    <div className="db-banner-sub">
                      Capital: <strong>{formatINR(cap)}</strong> | Max Risk: <strong>{risk.toFixed(1)}%</strong> | Min Liquidity: <strong>{liq.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>
                <button className="db-banner-btn" onClick={() => setActiveNav('portfolio')}>
                  Adjust Limits & Capital
                </button>
              </div>

              {/* ── KPI CARDS ── */}
              <div className="db-kpi-grid">
                {kpiCards.map((card, i) => (
                  <div className="db-kpi-card" key={i} style={{ '--glow': card.glow }}>
                    <div className="db-kpi-top">
                      <div className="db-kpi-icon" style={{ background: card.iconBg }}>
                        {card.icon}
                      </div>
                      {card.badge && <span className="db-kpi-badge">{card.badge}</span>}
                    </div>
                    <div className="db-kpi-value">{card.value}</div>
                    <div className="db-kpi-title">{card.title}</div>
                    <div className="db-kpi-sub" style={{ color: card.subColor }}>{card.sub}</div>
                    <div className="db-kpi-spark">
                      <Sparkline points={card.spark} color={card.sparkColor} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── BOTTOM ROW ── */}
              <div className="db-bottom-row">

                {/* Asset Allocation */}
                <div className="db-card db-allocation">
                  <div className="db-card-header">
                    <h2>Asset Allocation</h2>
                    <span className="db-card-badge">Live</span>
                  </div>
                  <div className="db-alloc-body">
                    <DonutChart segments={dynamicAllocations} totalText={formatINRShorthand(cap)} />
                    <div className="db-alloc-legend">
                      {dynamicAllocations.map((a, i) => (
                        <div className="db-legend-item" key={i}>
                          <span className="db-legend-dot" style={{ background: a.color }}></span>
                          <span className="db-legend-label">{a.label}</span>
                          <span className="db-legend-pct">{a.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="db-card db-performance">
                  <div className="db-card-header">
                    <h2>Monthly Performance</h2>
                    <span className="db-perf-up">+{(ret / 3).toFixed(1)}%</span>
                  </div>
                  <div className="db-perf-bars">
                    {['Apr','May','Jun','Jul','Aug','Sep'].map((m, i) => {
                      const heights = [55, 70, 62, 85, 78, 92]
                      return (
                        <div className="db-bar-group" key={i}>
                          <div className="db-bar-wrap">
                            <div className="db-bar" style={{ height: `${heights[i]}%`, '--bar-color': i === 5 ? '#4a9eff' : 'rgba(74,158,255,0.3)' }}></div>
                          </div>
                          <span className="db-bar-label">{m}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="db-card db-transactions">
                  <div className="db-card-header">
                    <h2>Recent Activity</h2>
                    <button className="db-see-all">See all</button>
                  </div>
                  <div className="db-tx-list">
                    {TRANSACTIONS.map((tx, i) => (
                      <div className="db-tx-item" key={i}>
                        <div className="db-tx-dot" style={{ background: tx.color }}></div>
                        <div className="db-tx-info">
                          <span className="db-tx-name">{tx.name}</span>
                          <span className="db-tx-date">{tx.date}</span>
                        </div>
                        <div className="db-tx-right">
                          <span className="db-tx-amount" style={{ color: tx.color }}>{tx.amount}</span>
                          <span className="db-tx-type">{tx.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              OTHER TABS (Risk Engine, Markets, Analytics, Settings)
              ══════════════════════════════════════════════════════ */}
          {activeNav === 'risk' && (
            <RiskEngineTab
              user={user}
              portfolioData={portfolioData}
              onNavigatePortfolio={() => setActiveNav('portfolio')}
            />
          )}

          {activeNav === 'markets' && (
            <MarketsPage />
          )}

          {activeNav === 'analytics' && (
            <AnalyticsTab
              user={user}
              portfolioData={portfolioData}
              onUpdatePortfolio={(updated) => setPortfolioData(updated)}
              onNavigatePortfolio={() => setActiveNav('portfolio')}
            />
          )}

          {activeNav === 'settings' && (
            <div className="db-placeholder-tab">
              <div className="db-tab-hero">
                <span className="db-tab-tag">Account & Preferences</span>
                <h2>Account Settings</h2>
                <p>Manage security protocols, notifications, and connected brokerage accounts.</p>
              </div>
              <div className="db-card" style={{ maxWidth: '600px' }}>
                <div className="db-card-header">
                  <h2>User Profile</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'rgba(255,255,255,0.7)' }}>
                  <div><strong>Name:</strong> {user?.name || 'Investor'}</div>
                  <div><strong>Email:</strong> {user?.email || 'investor@example.com'}</div>
                  <div><strong>Account Status:</strong> <span style={{ color: '#34d399' }}>Active & Verified</span></div>
                  <div><strong>Active Capital Limit:</strong> {formatINR(cap)}</div>
                  <button className="port-save-btn" style={{ marginTop: '10px' }} onClick={() => setActiveNav('portfolio')}>
                    Modify Portfolio Capital & Limits
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── RISK REMINDERS SENTINEL DRAWER ── */}
      <RiskRemindersDrawer
        isOpen={remindersOpen}
        onClose={() => setRemindersOpen(false)}
        user={user}
        portfolioData={portfolioData}
        onNavigateRisk={() => setActiveNav('risk')}
      />

      {/* ── AI RISK & PORTFOLIO COPILOT ── */}
      <AiCopilot
        user={user}
        portfolioData={portfolioData}
        onExecuteAction={(action) => {
          if (action.type === 'APPLY_CONSTRAINED_OPTIMIZER' || action.type === 'RUN_STRESS_TEST' || action.type === 'VIEW_FRONTIER' || action.type === 'VIEW_OVERVIEW' || action.type === 'VIEW_FRICTION') {
            setActiveNav('risk')
          }
        }}
      />
    </div>
  )
}
