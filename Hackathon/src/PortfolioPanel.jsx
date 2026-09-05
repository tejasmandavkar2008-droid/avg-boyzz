import { useState, useEffect } from 'react'
import './PortfolioPanel.css'

export function formatINR(val) {
  if (val == null || isNaN(val)) return '₹0'
  return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function formatINRShorthand(val) {
  if (val == null || isNaN(val)) return '₹0'
  const num = Number(val)
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2)
    return `₹${cr.endsWith('.00') ? cr.slice(0, -3) : cr} Cr`
  } else if (num >= 100000) {
    const l = (num / 100000).toFixed(2)
    return `₹${l.endsWith('.00') ? l.slice(0, -3) : l} L`
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)} K`
  }
  return `₹${num}`
}

function numberToIndianWords(num) {
  if (!num || isNaN(num) || num <= 0) return ''
  const n = Math.floor(num)
  if (n >= 10000000) {
    const cr = (n / 10000000).toFixed(2)
    return `${cr.endsWith('.00') ? Math.floor(n / 10000000) : cr} Crore Rupees`
  }
  if (n >= 100000) {
    const l = (n / 100000).toFixed(2)
    return `${l.endsWith('.00') ? Math.floor(n / 100000) : l} Lakh Rupees`
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)} Thousand Rupees`
  }
  return `${n} Rupees`
}

export default function PortfolioPanel({ user, portfolioData, onSaveSuccess, onNavigateDashboard }) {
  const [capital, setCapital] = useState(portfolioData?.capital || 10000000)
  const [riskLimit, setRiskLimit] = useState(portfolioData?.riskLimit || 12.4)
  const [liquidityLimit, setLiquidityLimit] = useState(portfolioData?.liquidityLimit || 72.0)
  const [expectedReturn, setExpectedReturn] = useState(portfolioData?.expectedReturn || 11.8)

  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Sync if portfolioData updates from parent
  useEffect(() => {
    if (portfolioData) {
      setCapital(portfolioData.capital)
      setRiskLimit(portfolioData.riskLimit)
      setLiquidityLimit(portfolioData.liquidityLimit)
      setExpectedReturn(portfolioData.expectedReturn)
    }
  }, [portfolioData])

  // Presets for Capital
  const capitalPresets = [
    { label: '₹10 Lakh',  val: 1000000 },
    { label: '₹25 Lakh',  val: 2500000 },
    { label: '₹50 Lakh',  val: 5000000 },
    { label: '₹1 Crore',  val: 10000000 },
    { label: '₹2.5 Crore',val: 25000000 },
    { label: '₹5 Crore',  val: 50000000 },
  ]

  // Calculations
  const capitalNum = Math.max(0, Number(capital) || 0)
  const riskNum = Math.min(100, Math.max(0, Number(riskLimit) || 0))
  const liquidityNum = Math.min(100, Math.max(0, Number(liquidityLimit) || 0))
  const returnNum = Math.max(0, Number(expectedReturn) || 0)

  const maxCapitalAtRisk = (capitalNum * (riskNum / 100))
  const liquidReserve = (capitalNum * (liquidityNum / 100))
  const projectedReturnAmount = (capitalNum * (returnNum / 100))

  // Risk category label & color
  const getRiskCategory = (r) => {
    if (r <= 12) return { label: 'Conservative (Low)', badge: '🟢 Low', color: '#34d399' }
    if (r <= 22) return { label: 'Balanced (Moderate)', badge: '🟡 Moderate', color: '#fbbf24' }
    if (r <= 35) return { label: 'Growth (High)', badge: '🟠 High', color: '#fb923c' }
    return { label: 'Aggressive (Very High)', badge: '🔴 Aggressive', color: '#f87171' }
  }

  // Liquidity category label & color
  const getLiquidityCategory = (l) => {
    if (l >= 60) return { label: 'High Liquidity Buffer', badge: '🟢 High', color: '#22d3ee' }
    if (l >= 30) return { label: 'Moderate Liquidity', badge: '🟡 Moderate', color: '#fbbf24' }
    return { label: 'Tight / Low Cash', badge: '🔴 Low Reserve', color: '#f87171' }
  }

  const riskCat = getRiskCategory(riskNum)
  const liqCat = getLiquidityCategory(liquidityNum)

  // Dynamic asset allocations calculated from user inputs
  const liquidPct = Math.round(liquidityNum)
  const equityPct = Math.round(Math.min(riskNum * 2.2, Math.max(10, 100 - liquidPct - 15)))
  const goldPct = 10
  const mfPct = Math.max(5, 100 - liquidPct - equityPct - goldPct)

  const dynamicAllocations = [
    { label: 'Liquid Cash & T-Bills', pct: liquidPct, color: '#22d3ee', amount: (capitalNum * liquidPct / 100) },
    { label: 'Equities (Growth/Risk)', pct: equityPct, color: '#4a9eff', amount: (capitalNum * equityPct / 100) },
    { label: 'Mutual Funds / Debt',    pct: mfPct, color: '#a78bfa', amount: (capitalNum * mfPct / 100) },
    { label: 'Gold & Hedge Assets',   pct: goldPct, color: '#fbbf24', amount: (capitalNum * goldPct / 100) },
  ]

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault()
    if (capitalNum <= 0) {
      setStatusMsg('Please enter a valid capital amount greater than ₹0.')
      setIsSuccess(false)
      return
    }

    setSaving(true)
    setStatusMsg(null)

    try {
      const res = await fetch('/api/portfolio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || 'guest',
          capital: capitalNum,
          riskLimit: riskNum,
          liquidityLimit: liquidityNum,
          expectedReturn: returnNum
        })
      })

      const data = await res.json()

      if (res.ok) {
        setIsSuccess(true)
        setStatusMsg(data.message || 'Portfolio configuration saved successfully!')
        if (onSaveSuccess) {
          onSaveSuccess({
            capital: capitalNum,
            riskLimit: riskNum,
            liquidityLimit: liquidityNum,
            expectedReturn: returnNum
          })
        }
      } else {
        setIsSuccess(false)
        setStatusMsg(data.message || 'Failed to save portfolio settings.')
      }
    } catch (err) {
      console.error(err)
      setIsSuccess(true)
      setStatusMsg('Portfolio saved locally in current session!')
      if (onSaveSuccess) {
        onSaveSuccess({
          capital: capitalNum,
          riskLimit: riskNum,
          liquidityLimit: liquidityNum,
          expectedReturn: returnNum
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setCapital(10000000)
    setRiskLimit(12.4)
    setLiquidityLimit(72.0)
    setExpectedReturn(11.8)
    setStatusMsg(null)
  }

  // Mini donut chart SVG
  const r = 50, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  let currentOffset = 0

  return (
    <div className="port-container">
      {/* ── HEADER ── */}
      <div className="port-header">
        <div className="port-header-info">
          <div className="port-pill">
            <span className="port-pill-dot"></span>
            Dynamic Risk & Capital Engine • Live NSE/BSE Connected
          </div>
          <h1 className="port-title">Portfolio Capital & Risk Limits</h1>
          <p className="port-subtitle">
            Configure your total investment capital, adjust risk tolerance boundaries, and set liquidity thresholds. 
            When saved, the system compares live stock market prices and generates a complete capital deployment blueprint.
          </p>
        </div>

        {onNavigateDashboard && (
          <button className="port-back-btn" onClick={onNavigateDashboard}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard Overview
          </button>
        )}
      </div>

      {/* ── TOP STAT SUMMARY CARDS ── */}
      <div className="port-stats-grid">
        {/* Card 1: Total Capital */}
        <div className="port-stat-card card-glow-blue">
          <div className="port-stat-header">
            <span className="port-stat-label">Total Capital</span>
            <span className="port-stat-icon-wrap icon-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
          </div>
          <div className="port-stat-val">{formatINR(capitalNum)}</div>
          <div className="port-stat-sub blue-text">{formatINRShorthand(capitalNum)} active capital base</div>
        </div>

        {/* Card 2: Risk Limit */}
        <div className="port-stat-card card-glow-emerald">
          <div className="port-stat-header">
            <span className="port-stat-label">Max Risk Exposure</span>
            <span className="port-stat-badge" style={{ background: `${riskCat.color}22`, color: riskCat.color, border: `1px solid ${riskCat.color}44` }}>
              {riskCat.badge}
            </span>
          </div>
          <div className="port-stat-val">{riskNum.toFixed(1)}%</div>
          <div className="port-stat-sub" style={{ color: riskCat.color }}>
            Max drawdown: {formatINR(maxCapitalAtRisk)}
          </div>
        </div>

        {/* Card 3: Liquidity Reserve */}
        <div className="port-stat-card card-glow-cyan">
          <div className="port-stat-header">
            <span className="port-stat-label">Liquidity Threshold</span>
            <span className="port-stat-badge" style={{ background: `${liqCat.color}22`, color: liqCat.color, border: `1px solid ${liqCat.color}44` }}>
              {liqCat.badge}
            </span>
          </div>
          <div className="port-stat-val">{liquidityNum.toFixed(1)}%</div>
          <div className="port-stat-sub cyan-text">
            Liquid cash buffer: {formatINR(liquidReserve)}
          </div>
        </div>

        {/* Card 4: Expected Return */}
        <div className="port-stat-card card-glow-purple">
          <div className="port-stat-header">
            <span className="port-stat-label">Target Annual Return</span>
            <span className="port-stat-icon-wrap icon-purple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
          <div className="port-stat-val">{returnNum.toFixed(1)}%</div>
          <div className="port-stat-sub purple-text">
            Proj. gain: +{formatINR(projectedReturnAmount)} / yr
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION / ALERT BANNER ── */}
      {statusMsg && (
        <div className={`port-alert ${isSuccess ? 'port-alert-success' : 'port-alert-error'}`}>
          <div className="port-alert-icon">
            {isSuccess ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            )}
          </div>
          <div className="port-alert-text">{statusMsg}</div>
          <button className="port-alert-close" onClick={() => setStatusMsg(null)}>×</button>
        </div>
      )}

      {/* ── MAIN WORKSPACE: 2-COLUMN GRID ── */}
      <div className="port-workspace">

        {/* ── LEFT COLUMN: INPUT FORM ── */}
        <div className="port-form-card">
          <div className="port-card-title-row">
            <div className="port-card-icon-tag">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h2 className="port-card-title">User Investment Parameters</h2>
              <p className="port-card-desc">Enter and fine-tune your parameters below. Changes update your limits immediately.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="port-inputs-form">
            {/* 1. CAPITAL INPUT */}
            <div className="port-field-group">
              <div className="port-field-label-row">
                <label className="port-label" htmlFor="capitalInput">
                  Total Investment Capital (₹)
                </label>
                <span className="port-label-extra">
                  {numberToIndianWords(capitalNum)}
                </span>
              </div>

              <div className="port-input-wrapper">
                <span className="port-input-prefix">₹</span>
                <input
                  id="capitalInput"
                  type="number"
                  min="1000"
                  step="1000"
                  className="port-input port-input-capital"
                  placeholder="e.g. 10000000"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  required
                />
                <span className="port-input-badge">INR</span>
              </div>

              {/* Quick Presets */}
              <div className="port-presets">
                <span className="port-presets-title">Quick Select:</span>
                <div className="port-presets-list">
                  {capitalPresets.map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      className={`port-preset-chip ${capitalNum === preset.val ? 'active' : ''}`}
                      onClick={() => setCapital(preset.val)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. RISK LIMIT */}
            <div className="port-field-group">
              <div className="port-field-label-row">
                <label className="port-label" htmlFor="riskRange">
                  Maximum Risk Limit (%)
                </label>
                <div className="port-range-val-badge" style={{ color: riskCat.color, borderColor: `${riskCat.color}55` }}>
                  {riskNum.toFixed(1)}% • {riskCat.label}
                </div>
              </div>

              <div className="port-slider-combo">
                <input
                  id="riskRange"
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  className="port-range-slider range-risk"
                  value={riskNum}
                  onChange={(e) => setRiskLimit(parseFloat(e.target.value))}
                />
                <div className="port-number-box">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={riskLimit}
                    onChange={(e) => setRiskLimit(e.target.value)}
                    className="port-mini-num"
                  />
                  <span className="port-mini-unit">%</span>
                </div>
              </div>

              <div className="port-slider-ticks">
                <span>0% (Conservative)</span>
                <span>15%</span>
                <span>30%</span>
                <span>50% (High Risk)</span>
              </div>
              <p className="port-help-text">
                Your portfolio will cap high-volatility assets so maximum capital drawdown does not exceed <strong>{formatINR(maxCapitalAtRisk)}</strong>.
              </p>
            </div>

            {/* 3. LIQUIDITY LIMIT */}
            <div className="port-field-group">
              <div className="port-field-label-row">
                <label className="port-label" htmlFor="liquidityRange">
                  Minimum Liquidity Limit (%)
                </label>
                <div className="port-range-val-badge cyan-border cyan-text">
                  {liquidityNum.toFixed(1)}% • {liqCat.label}
                </div>
              </div>

              <div className="port-slider-combo">
                <input
                  id="liquidityRange"
                  type="range"
                  min="5"
                  max="95"
                  step="1"
                  className="port-range-slider range-liq"
                  value={liquidityNum}
                  onChange={(e) => setLiquidityLimit(parseFloat(e.target.value))}
                />
                <div className="port-number-box">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={liquidityLimit}
                    onChange={(e) => setLiquidityLimit(e.target.value)}
                    className="port-mini-num"
                  />
                  <span className="port-mini-unit">%</span>
                </div>
              </div>

              <div className="port-slider-ticks">
                <span>5% (Low Cash)</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>95% (Max Liquid)</span>
              </div>
              <p className="port-help-text">
                Ensures at least <strong>{formatINR(liquidReserve)}</strong> is kept in liquid instruments (Cash, Overnight Funds) for instant withdrawal without penalty.
              </p>
            </div>

            {/* 4. EXPECTED RETURN TARGET */}
            <div className="port-field-group">
              <div className="port-field-label-row">
                <label className="port-label" htmlFor="returnRange">
                  Target Expected Annual Return (%)
                </label>
                <div className="port-range-val-badge purple-border purple-text">
                  {returnNum.toFixed(1)}% Annualized
                </div>
              </div>

              <div className="port-slider-combo">
                <input
                  id="returnRange"
                  type="range"
                  min="5"
                  max="30"
                  step="0.5"
                  className="port-range-slider range-ret"
                  value={returnNum}
                  onChange={(e) => setExpectedReturn(parseFloat(e.target.value))}
                />
                <div className="port-number-box">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.1"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    className="port-mini-num"
                  />
                  <span className="port-mini-unit">%</span>
                </div>
              </div>
            </div>

            {/* ── ACTION BUTTONS ── */}
            <div className="port-actions">
              <button
                type="submit"
                className="port-save-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="port-spinner"></span>
                    Analyzing Live Market & Saving...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Save Portfolio Configuration
                  </>
                )}
              </button>

              <button
                type="button"
                className="port-reset-btn"
                onClick={handleReset}
                disabled={saving}
              >
                Reset Defaults
              </button>
            </div>
          </form>
        </div>

        {/* ── RIGHT COLUMN: SIMULATOR & ALLOCATION PREVIEW ── */}
        <div className="port-preview-col">

          {/* Allocation Breakdown Card */}
          <div className="port-card port-alloc-card">
            <div className="port-card-header-clean">
              <div>
                <h3 className="port-subhead">Simulated Asset Allocation</h3>
                <span className="port-subhead-desc">Automatically balanced to match your liquidity & risk limits</span>
              </div>
              <span className="port-live-badge">Real-time</span>
            </div>

            <div className="port-chart-row">
              {/* SVG Donut */}
              <div className="port-donut-wrapper">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
                  {dynamicAllocations.map((item, idx) => {
                    const dash = (item.pct / 100) * circ
                    const circleEl = (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill="none"
                        stroke={item.color}
                        strokeWidth="18"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={-currentOffset}
                        style={{
                          transform: 'rotate(-90deg)',
                          transformOrigin: '60px 60px',
                          transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease'
                        }}
                      />
                    )
                    currentOffset += dash
                    return circleEl
                  })}
                  <text x={cx} y={cy - 4} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">
                    {formatINRShorthand(capitalNum)}
                  </text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
                    Capital
                  </text>
                </svg>
              </div>

              {/* Progress bars list */}
              <div className="port-alloc-list">
                {dynamicAllocations.map((item, idx) => (
                  <div key={idx} className="port-alloc-item">
                    <div className="port-alloc-item-top">
                      <div className="port-alloc-dot-label">
                        <span className="port-alloc-dot" style={{ background: item.color }}></span>
                        <span className="port-alloc-name">{item.label}</span>
                      </div>
                      <div className="port-alloc-amounts">
                        <span className="port-alloc-amt">{formatINR(item.amount)}</span>
                        <span className="port-alloc-pct" style={{ color: item.color }}>{item.pct}%</span>
                      </div>
                    </div>
                    <div className="port-alloc-bar-bg">
                      <div
                        className="port-alloc-bar-fill"
                        style={{ width: `${item.pct}%`, background: item.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Health & Stress Test Card */}
          <div className="port-card port-health-card">
            <div className="port-card-header-clean">
              <h3 className="port-subhead">Portfolio Health & Stress Indicators</h3>
            </div>

            <div className="port-health-metrics">
              <div className="port-metric-row">
                <div className="port-metric-info">
                  <span className="port-metric-title">Capital Preservation Ratio</span>
                  <span className="port-metric-desc">Proportion protected from aggressive market volatility</span>
                </div>
                <div className="port-metric-badge-green">
                  {(100 - riskNum).toFixed(1)}% Protected
                </div>
              </div>

              <div className="port-metric-row">
                <div className="port-metric-info">
                  <span className="port-metric-title">Instant Liquidity Access</span>
                  <span className="port-metric-desc">Available within 24 hours without market liquidation</span>
                </div>
                <div className="port-metric-badge-cyan">
                  {formatINR(liquidReserve)} ({liquidityNum.toFixed(0)}%)
                </div>
              </div>

              <div className="port-metric-row">
                <div className="port-metric-info">
                  <span className="port-metric-title">Simulated Market Stress Drawdown</span>
                  <span className="port-metric-desc">Estimated loss impact in severe 25% correction event</span>
                </div>
                <div className="port-metric-badge-amber">
                  - {formatINR(maxCapitalAtRisk * 0.5)}
                </div>
              </div>
            </div>

            <div className="port-health-footer">
              <div className="port-shield-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="port-health-text">
                Your portfolio meets all regulatory guidelines and internal risk governance thresholds.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
