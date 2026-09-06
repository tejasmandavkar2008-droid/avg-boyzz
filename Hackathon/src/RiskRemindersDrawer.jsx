import { useState, useEffect } from 'react'
import './RiskRemindersDrawer.css'
import { formatINR } from './PortfolioPanel'

export default function RiskRemindersDrawer({ 
  isOpen, 
  onClose, 
  user, 
  portfolioData, 
  onNavigateRisk 
}) {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(false)
  const [simulating, setSimulating] = useState(false)

  const userEmail = user?.email || 'guest'
  const cap = Number(portfolioData?.capital) || 10000000
  const userRiskLimit = Number(portfolioData?.riskLimit) || 12.4

  const fetchReminders = () => {
    setLoading(true)
    fetch(`/api/risk/reminders?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReminders(data)
        }
      })
      .catch(err => console.warn('Could not fetch reminders:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isOpen) {
      fetchReminders()
    }
  }, [isOpen, userEmail])

  // Initial check on mount
  useEffect(() => {
    fetchReminders()
  }, [userEmail])

  // Simulate or trigger market step-down test
  const triggerMarketStepDownAlert = async (dropPct = -6.5) => {
    setSimulating(true)
    const simulatedCurrentRisk = Number((userRiskLimit + Math.abs(dropPct) * 0.75).toFixed(1))

    try {
      const res = await fetch('/api/risk/reminders/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          portfolioCapital: cap,
          configuredRiskLimit: userRiskLimit,
          currentMarketRisk: simulatedCurrentRisk,
          marketDropPct: dropPct,
          alertType: 'MARKET_STEP_DOWN',
          severity: 'CRITICAL',
          message: `Market Step-Down Warning: NIFTY / Market index declined by ${Math.abs(dropPct)}%. Your portfolio risk surged to ${simulatedCurrentRisk}%, exceeding your allowed risk limit of ${userRiskLimit}%.`
        })
      })

      if (res.ok) {
        fetchReminders()
      }
    } catch (err) {
      console.warn('Could not trigger reminder:', err)
    } finally {
      setSimulating(false)
    }
  }

  // Dismiss a reminder
  const dismissReminder = async (id) => {
    try {
      await fetch(`/api/risk/reminders/${id}/dismiss`, { method: 'PUT' })
      setReminders(prev => prev.map(r => r.id === id ? { ...r, isRead: true } : r))
    } catch (err) {
      console.warn('Could not dismiss reminder:', err)
    }
  }

  const unreadCount = reminders.filter(r => !r.isRead).length

  if (!isOpen) return null

  return (
    <div className="reminders-overlay" onClick={onClose}>
      <div className="reminders-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="reminders-header">
          <div className="reminders-title-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div>
              <h3>Risk Limit & Market Step-Down Sentinel</h3>
              <p>Automated reminders when market drawdown exceeds your risk tolerance.</p>
            </div>
          </div>
          <button className="reminders-close-btn" onClick={onClose}>×</button>
        </div>

        {/* User Risk Sentinel Status Bar */}
        <div className="reminders-sentinel-bar">
          <div className="rem-stat">
            <span className="rem-stat-lbl">Active Capital</span>
            <span className="rem-stat-val">{formatINR(cap)}</span>
          </div>
          <div className="rem-stat">
            <span className="rem-stat-lbl">Configured Risk Limit</span>
            <span className="rem-stat-val" style={{ color: '#4a9eff' }}>{userRiskLimit.toFixed(1)}% Max</span>
          </div>
          <div className="rem-stat">
            <span className="rem-stat-lbl">Active Reminders</span>
            <span className="rem-stat-val" style={{ color: unreadCount > 0 ? '#f87171' : '#34d399' }}>
              {unreadCount} Unresolved
            </span>
          </div>
        </div>

        {/* Market Step-Down Simulation Action Bar */}
        <div className="reminders-sim-box">
          <span className="rem-sim-txt">Test Market Step-Down Alerts:</span>
          <div className="rem-sim-btns">
            <button 
              className="rem-sim-btn" 
              onClick={() => triggerMarketStepDownAlert(-5.5)}
              disabled={simulating}
            >
              Simulate -5.5% Drop
            </button>
            <button 
              className="rem-sim-btn btn-danger" 
              onClick={() => triggerMarketStepDownAlert(-10.0)}
              disabled={simulating}
            >
              Simulate -10.0% Crash
            </button>
          </div>
        </div>

        {/* Reminders List */}
        <div className="reminders-body">
          {loading && reminders.length === 0 ? (
            <div className="reminders-empty">Checking database reminders...</div>
          ) : reminders.length === 0 ? (
            <div className="reminders-empty">
              <p>All portfolio assets are operating within your {userRiskLimit.toFixed(1)}% risk tolerance limit.</p>
              <p style={{ fontSize: '12px', marginTop: '6px', color: 'rgba(255,255,255,0.4)' }}>
                When market assets step down beyond your risk threshold, an automated reminder will appear here and trigger rebalancing options.
              </p>
            </div>
          ) : (
            <div className="reminders-list">
              {reminders.map((r) => (
                <div key={r.id} className={`reminder-card ${r.isRead ? 'read' : 'unread'} ${r.severity?.toLowerCase()}`}>
                  <div className="reminder-top">
                    <span className="reminder-type-tag">
                      {r.alertType || 'MARKET_STEP_DOWN'}
                    </span>
                    <span className="reminder-time">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : 'Just now'}
                    </span>
                  </div>

                  <div className="reminder-msg">{r.message}</div>

                  <div className="reminder-metrics-row">
                    <div className="rem-metric">
                      <span>Market Drop</span>
                      <strong style={{ color: '#f87171' }}>{r.marketDropPct ? `${r.marketDropPct.toFixed(1)}%` : '-6.2%'}</strong>
                    </div>
                    <div className="rem-metric">
                      <span>Breached Risk</span>
                      <strong style={{ color: '#fbbf24' }}>{r.currentMarketRisk ? `${r.currentMarketRisk.toFixed(1)}%` : '16.5%'}</strong>
                    </div>
                    <div className="rem-metric">
                      <span>Your Limit</span>
                      <strong style={{ color: '#4a9eff' }}>{r.configuredRiskLimit ? `${r.configuredRiskLimit.toFixed(1)}%` : `${userRiskLimit}%`}</strong>
                    </div>
                  </div>

                  <div className="reminder-actions">
                    <button 
                      className="rem-action-cure"
                      onClick={() => {
                        onClose()
                        if (onNavigateRisk) onNavigateRisk()
                      }}
                    >
                      Resolve Risk & Cure in Risk Engine
                    </button>
                    {!r.isRead && (
                      <button 
                        className="rem-action-dismiss"
                        onClick={() => dismissReminder(r.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
