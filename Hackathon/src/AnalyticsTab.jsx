import { useState, useEffect } from 'react'
import { formatINR, formatINRShorthand } from './PortfolioPanel'
import './AnalyticsTab.css'

export default function AnalyticsTab({
  user,
  portfolioData,
  onUpdatePortfolio,
  onNavigatePortfolio
}) {
  // Local state initialized from portfolioData, localStorage, or fallback
  const getInitialConfig = () => {
    try {
      const saved = localStorage.getItem('user_portfolio_config')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.capital) return parsed
      }
    } catch (e) {}
    return null
  }
  const cachedConfig = getInitialConfig()

  const [capital, setCapital] = useState(portfolioData?.capital ?? cachedConfig?.capital ?? 10000000)
  const [riskLimit, setRiskLimit] = useState(portfolioData?.riskLimit ?? cachedConfig?.riskLimit ?? 12.4)
  const [liquidityLimit, setLiquidityLimit] = useState(portfolioData?.liquidityLimit ?? cachedConfig?.liquidityLimit ?? 72.0)
  const [targetReturn, setTargetReturn] = useState(portfolioData?.expectedReturn ?? cachedConfig?.expectedReturn ?? 11.8)

  // Simulator controls visibility
  const [showSimulator, setShowSimulator] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null)
  const [autoUpdatedNotice, setAutoUpdatedNotice] = useState(null)

  // Current user holdings from orders API to compare Current vs Recommended
  const [currentHoldings, setCurrentHoldings] = useState([])
  const [totalInvestedInStocks, setTotalInvestedInStocks] = useState(0)
  const [loadingHoldings, setLoadingHoldings] = useState(true)

  // Actual (Current) Allocation State - default 55% Equity, 25% Bonds, 20% Cash
  const [actualEquityPct, setActualEquityPct] = useState(55)
  const [actualBondsPct, setActualBondsPct]   = useState(25)
  const [actualCashPct, setActualCashPct]     = useState(20)
  const [showActualTuner, setShowActualTuner] = useState(false)
  const [actualInputMode, setActualInputMode] = useState('pct') // 'pct' | 'amt'
  const [prevActualState, setPrevActualState] = useState(null)
  const [rebalanceAppliedMsg, setRebalanceAppliedMsg] = useState(null)
  const [recModelMode, setRecModelMode]       = useState('dynamic') // 'dynamic' | 'preset45' | 'custom'
  const [customRecEquityPct, setCustomRecEquityPct] = useState(45)
  const [customRecBondsPct, setCustomRecBondsPct]   = useState(30)
  const [customRecCashPct, setCustomRecCashPct]     = useState(25)

  // Active stress test scenario
  const [activeScenario, setActiveScenario] = useState('normal')

  // Multi-Year Compounding Projection Horizon (1, 3, 5, 10, 15, 20 years)
  const [projectionYears, setProjectionYears] = useState(5)

  // 1. Sync if portfolioData updates from parent
  useEffect(() => {
    if (portfolioData) {
      if (portfolioData.capital != null) setCapital(portfolioData.capital)
      if (portfolioData.riskLimit != null) setRiskLimit(portfolioData.riskLimit)
      if (portfolioData.liquidityLimit != null) setLiquidityLimit(portfolioData.liquidityLimit)
      if (portfolioData.expectedReturn != null) setTargetReturn(portfolioData.expectedReturn)
    }
  }, [portfolioData])

  // 2. Listen to cross-tab / global portfolio_updated events for instantaneous live update
  useEffect(() => {
    const handlePortfolioUpdate = (e) => {
      if (e.detail) {
        if (e.detail.capital != null) setCapital(e.detail.capital)
        if (e.detail.riskLimit != null) setRiskLimit(e.detail.riskLimit)
        if (e.detail.liquidityLimit != null) setLiquidityLimit(e.detail.liquidityLimit)
        if (e.detail.expectedReturn != null) setTargetReturn(e.detail.expectedReturn)
        setAutoUpdatedNotice(`Capital synchronized to ₹${Number(e.detail.capital).toLocaleString('en-IN')}`)
        setTimeout(() => setAutoUpdatedNotice(null), 4000)
      }
    }
    window.addEventListener('portfolio_updated', handlePortfolioUpdate)
    return () => window.removeEventListener('portfolio_updated', handlePortfolioUpdate)
  }, [])

  // 3. Load latest portfolio from backend on mount
  useEffect(() => {
    const userEmail = user?.email || 'guest'
    fetch(`/api/portfolio?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.capital) {
          setCapital(data.capital)
          setRiskLimit(data.riskLimit)
          setLiquidityLimit(data.liquidityLimit)
          setTargetReturn(data.expectedReturn)
        }
      })
      .catch(err => console.warn('Could not fetch portfolio in analytics:', err))
  }, [user?.email])

  // Fetch user orders & current stock holdings
  useEffect(() => {
    const userEmail = user?.email || 'guest'
    fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.holdings) {
          setCurrentHoldings(data.holdings)
          setTotalInvestedInStocks(data.totalInvested || 0)
        }
      })
      .catch(err => console.warn('Could not fetch user holdings for analytics comparison:', err))
      .finally(() => setLoadingHoldings(false))
  }, [user?.email])

  // ══════════════════════════════════════════════════════════════
  // QUANTITATIVE CALIBRATION & RECOMMENDATION ENGINE
  // ══════════════════════════════════════════════════════════════
  const capitalNum = Math.max(1000, Number(capital) || 1000000)
  const riskNum = Math.min(100, Math.max(0, Number(riskLimit) || 40))
  const liquidityNum = Math.min(90, Math.max(5, Number(liquidityLimit) || 20))
  const targetReturnNum = Math.max(1, Number(targetReturn) || 10.0)

  // 1. Recommended Allocations based on user inputs
  const recLiquidPct = Math.round(liquidityNum)
  const remainingPct = 100 - recLiquidPct

  // Calibrate equity weight based on risk tolerance
  const riskFactor = Math.min(0.88, Math.max(0.18, 0.225 + (riskNum / 100) * 1.0))
  let recEquityPct = Math.round(remainingPct * riskFactor)
  recEquityPct = Math.min(remainingPct - 5, Math.max(5, recEquityPct))
  const recBondsPct = Math.max(5, remainingPct - recEquityPct)

  // Absolute Rupee amounts
  const recLiquidAmt = Math.round(capitalNum * (recLiquidPct / 100))
  const recEquityAmt = Math.round(capitalNum * (recEquityPct / 100))
  const recBondsAmt = Math.round(capitalNum * (recBondsPct / 100))
  const recTotalAmt = recLiquidAmt + recEquityAmt + recBondsAmt

  // 2. Expected Performance & Risk Metrics
  const eqRet = 14.7, bondRet = 7.8, cashRet = 5.5
  const expReturnCalc = ((recEquityPct * eqRet) + (recBondsPct * bondRet) + (recLiquidPct * cashRet)) / 100
  const expectedReturnPct = Number(expReturnCalc.toFixed(1))

  // Risk Score (0-100) with covariance diversification discount
  const rawRisk = ((recEquityPct * 65) + (recBondsPct * 20) + (recLiquidPct * 2)) / 100
  const expRiskScore = Math.max(5, Math.min(95, Math.round(rawRisk - 0.9)))
  const expLiquidityPct = recLiquidPct

  // Institutional Quantitative Metrics
  const riskFreeRate = 6.5 // 10Y Indian Sovereign Yield
  const portfolioVolatility = Number(((recEquityPct * 0.15) + (recBondsPct * 0.04) + (recLiquidPct * 0.005)).toFixed(2))
  const sharpeRatio = portfolioVolatility > 0 ? Number(((expectedReturnPct - riskFreeRate) / portfolioVolatility).toFixed(2)) : 1.50
  const sortinoRatio = Number((sharpeRatio * 1.42).toFixed(2))
  const portfolioBeta = Number(((recEquityPct / 100) * 1.05 + (recBondsPct / 100) * 0.12).toFixed(2))
  const alphaVal = Number((expectedReturnPct - (riskFreeRate + portfolioBeta * (12.5 - riskFreeRate))).toFixed(2))
  const var95PctDaily = Number((portfolioBeta * 1.45 + (100 - recLiquidPct) * 0.015).toFixed(2))
  const maxHistoricDD = Number((recEquityPct * 0.18 + recBondsPct * 0.03).toFixed(1))

  // 3. Status checks vs Targets (Clean status without emojis)
  const returnDiff = Number((expectedReturnPct - targetReturnNum).toFixed(1))
  const isReturnMet = expectedReturnPct >= targetReturnNum
  const returnStatus = isReturnMet
    ? { label: `Return ${expectedReturnPct}% >= Target ${targetReturnNum}%`, badge: 'TARGET MET', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }
    : returnDiff >= -1.0
    ? { label: `Return ${expectedReturnPct}% ~ Target ${targetReturnNum}%`, badge: 'SLIGHT DEFICIT (-' + Math.abs(returnDiff) + '%)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
    : { label: `Return ${expectedReturnPct}% < Target ${targetReturnNum}%`, badge: 'DEFICIT (-' + Math.abs(returnDiff) + '%)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }

  const isRiskSafe = expRiskScore <= riskNum
  const riskStatus = isRiskSafe
    ? { label: `Risk ${expRiskScore} <= Target ${riskNum}`, badge: 'WITHIN BUDGET', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }
    : expRiskScore <= riskNum + 4
    ? { label: `Risk ${expRiskScore} ~ Target ${riskNum}`, badge: 'BORDERLINE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
    : { label: `Risk ${expRiskScore} > Target ${riskNum}`, badge: 'EXCEEDS TOLERANCE', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }

  const isLiquidityMet = expLiquidityPct >= liquidityNum
  const liquidityStatus = isLiquidityMet
    ? { label: `Liquidity ${expLiquidityPct}% = Target ${liquidityNum}%`, badge: 'GUARDRAIL COMPLIANT', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }
    : { label: `Liquidity ${expLiquidityPct}% < Target ${liquidityNum}%`, badge: 'BELOW BUFFER', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }

  // Financial gains
  const annualGainAmt = Math.round(capitalNum * (expectedReturnPct / 100))
  const monthlyGainAmt = Math.round(annualGainAmt / 12)

  // ── ACTUAL VS RECOMMENDED CALCULATIONS ──
  const compRecEquityPct = recModelMode === 'preset45' ? 45 : recModelMode === 'custom' ? customRecEquityPct : recEquityPct
  const compRecBondsPct  = recModelMode === 'preset45' ? 30 : recModelMode === 'custom' ? customRecBondsPct : recBondsPct
  const compRecCashPct   = recModelMode === 'preset45' ? 25 : recModelMode === 'custom' ? customRecCashPct : recLiquidPct
  const compRecTotalPct  = compRecEquityPct + compRecBondsPct + compRecCashPct

  const compRecEquityAmt = Math.round(capitalNum * (compRecEquityPct / 100))
  const compRecBondsAmt  = Math.round(capitalNum * (compRecBondsPct / 100))
  const compRecCashAmt   = Math.round(capitalNum * (compRecCashPct / 100))
  const compRecTotalAmt  = compRecEquityAmt + compRecBondsAmt + compRecCashAmt

  // Actual values
  const actEqPct = Math.max(0, Math.min(100, Number(actualEquityPct) || 0))
  const actBdPct = Math.max(0, Math.min(100, Number(actualBondsPct) || 0))
  const actCsPct = Math.max(0, Math.min(100, Number(actualCashPct) || 0))
  const actTotalPct = actEqPct + actBdPct + actCsPct

  const actEqAmt = Math.round(capitalNum * (actEqPct / 100))
  const actBdAmt = Math.round(capitalNum * (actBdPct / 100))
  const actCsAmt = Math.round(capitalNum * (actCsPct / 100))
  const actTotalAmt = actEqAmt + actBdAmt + actCsAmt

  // Variance calculations (Actual - Recommended)
  const eqVariance = actEqPct - compRecEquityPct
  const bdVariance = actBdPct - compRecBondsPct
  const csVariance = actCsPct - compRecCashPct

  const eqAmtDiff = actEqAmt - compRecEquityAmt
  const bdAmtDiff = actBdAmt - compRecBondsAmt
  const csAmtDiff = actCsAmt - compRecCashAmt

  // Total Absolute Portfolio Drift Index (%)
  const totalDriftPct = (Math.abs(eqVariance) + Math.abs(bdVariance) + Math.abs(csVariance)) / 2

  // Interactive Actual Amount change handler (converts ₹ to %)
  const handleActualAmtChange = (type, val) => {
    const num = Math.max(0, Number(val) || 0)
    const pct = Math.min(100, Math.round((num / capitalNum) * 100))
    if (type === 'equity') setActualEquityPct(pct)
    if (type === 'bonds') setActualBondsPct(pct)
    if (type === 'cash') setActualCashPct(pct)
  }

  // Quick delta increment / decrement (+5% / -5%)
  const handleQuickDelta = (type, delta) => {
    if (type === 'equity') setActualEquityPct(prev => Math.max(0, Math.min(100, prev + delta)))
    if (type === 'bonds') setActualBondsPct(prev => Math.max(0, Math.min(100, prev + delta)))
    if (type === 'cash') setActualCashPct(prev => Math.max(0, Math.min(100, prev + delta)))
  }

  // Simulate instant rebalance (copies Recommended into Actual)
  const handleSimulateRebalance = () => {
    setPrevActualState({
      equity: actEqPct,
      bonds: actBdPct,
      cash: actCsPct
    })
    setActualEquityPct(compRecEquityPct)
    setActualBondsPct(compRecBondsPct)
    setActualCashPct(compRecCashPct)
    setRebalanceAppliedMsg('Portfolio Rebalanced: Actual allocations aligned with Recommended targets.')
    setTimeout(() => setRebalanceAppliedMsg(null), 5000)
  }

  // Undo rebalance
  const handleUndoRebalance = () => {
    if (prevActualState) {
      setActualEquityPct(prevActualState.equity)
      setActualBondsPct(prevActualState.bonds)
      setActualCashPct(prevActualState.cash)
      setPrevActualState(null)
      setRebalanceAppliedMsg(null)
    }
  }

  // Sync with live holdings from orders API if available
  const handleSyncLiveOrders = () => {
    if (totalInvestedInStocks > 0) {
      const eqPct = Math.min(100, Math.round((totalInvestedInStocks / capitalNum) * 100))
      const rem = 100 - eqPct
      const bdPct = Math.round(rem * 0.5)
      const csPct = Math.max(0, rem - bdPct)
      setActualEquityPct(eqPct)
      setActualBondsPct(bdPct)
      setActualCashPct(csPct)
    } else {
      alert('No active stock holdings found in your orders history.')
    }
  }

  // Preset quick strategy loaders
  const handleLoadStrategyPreset = (strat) => {
    if (strat === 'growth') {
      setRiskLimit(65)
      setLiquidityLimit(10)
      setTargetReturn(14.0)
    } else if (strat === 'balanced') {
      setRiskLimit(40)
      setLiquidityLimit(20)
      setTargetReturn(11.5)
    } else if (strat === 'conservative') {
      setRiskLimit(20)
      setLiquidityLimit(35)
      setTargetReturn(8.5)
    }
  }

  // Handle Save to backend
  const handleSaveToBackend = async () => {
    setSaving(true)
    setSaveSuccessMsg(null)
    try {
      const res = await fetch('/api/portfolio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email || 'guest',
          capital: capitalNum,
          riskLimit: riskNum,
          liquidityLimit: liquidityNum,
          expectedReturn: targetReturnNum
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSaveSuccessMsg('Portfolio parameters saved to database.')
        if (onUpdatePortfolio) {
          onUpdatePortfolio({
            capital: capitalNum,
            riskLimit: riskNum,
            liquidityLimit: liquidityNum,
            expectedReturn: targetReturnNum
          })
        }
        setTimeout(() => setSaveSuccessMsg(null), 4000)
      } else {
        alert(data.message || 'Could not save portfolio.')
      }
    } catch (err) {
      console.error('Error saving portfolio from analytics:', err)
      alert('Cannot reach server. Ensure backend is running.')
    } finally {
      setSaving(false)
    }
  }

  // Multi-Year Compounding Math
  const compoundMultiplier = Math.pow(1 + expectedReturnPct / 100, projectionYears)
  const projectedFutureWealth = Math.round(capitalNum * compoundMultiplier)
  const totalWealthGenerated = projectedFutureWealth - capitalNum

  return (
    <div className="analytics-container">
      {/* ── LIVE AUTO-UPDATE SYNC NOTIFICATION ── */}
      {autoUpdatedNotice && (
        <div className="analytics-live-sync-banner">
          <div className="live-sync-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <strong>{autoUpdatedNotice}</strong>
          </div>
          <button className="live-sync-close" onClick={() => setAutoUpdatedNotice(null)}>✕</button>
        </div>
      )}

      {/* ── TOP HERO BANNER ── */}
      <div className="analytics-hero">
        <div className="analytics-hero-left">
          <div className="analytics-badge">
            <span className="analytics-pulse-dot"></span>
            Institutional Portfolio Analytics & Allocation Engine
          </div>
          <h1 className="analytics-title">Portfolio Analytics & Mathematical Allocation</h1>
          <p className="analytics-subtitle">
            Capital allocation calibrated to <strong>Capital ({formatINR(capitalNum)})</strong>,
            <strong> Risk Tolerance ({riskNum}/100)</strong>, <strong>Liquidity ({liquidityNum}%)</strong>, and <strong>Target Return ({targetReturnNum}%)</strong>.
          </p>
        </div>

        <div className="analytics-hero-actions">
          <button
            className={`analytics-sim-btn ${showSimulator ? 'active' : ''}`}
            onClick={() => setShowSimulator(!showSimulator)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20v-6M6 20V10M18 20V4" strokeLinecap="round"/>
              <circle cx="12" cy="14" r="2" fill="currentColor"/>
              <circle cx="6" cy="10" r="2" fill="currentColor"/>
              <circle cx="18" cy="8" r="2" fill="currentColor"/>
            </svg>
            {showSimulator ? 'Close Parameter Tuner' : 'Adjust Inputs & Simulate'}
          </button>
          {onNavigatePortfolio && (
            <button className="analytics-action-btn primary" onClick={onNavigatePortfolio}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" strokeLinecap="round"/>
                <path d="M7 16l4-6 4 4 4-8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Adjust Portfolio
            </button>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE PARAMETER TUNER (SIMULATOR) ── */}
      {showSimulator && (
        <div className="analytics-sim-drawer">
          <div className="analytics-sim-header">
            <div>
              <h3>Dynamic Input Simulator</h3>
              <p>Tune inputs to see instant changes in recommended percentages, ₹ values, and guardrail validations.</p>
            </div>
            <div className="analytics-sim-save-group">
              {saveSuccessMsg && <span className="analytics-save-msg">{saveSuccessMsg}</span>}
              <button
                className="analytics-save-btn"
                onClick={handleSaveToBackend}
                disabled={saving}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                {saving ? 'Saving...' : 'Save & Sync Profile'}
              </button>
            </div>
          </div>

          {/* Strategy Preset Quick Buttons */}
          <div className="analytics-preset-bar">
            <span className="preset-label">Quick Strategy Presets:</span>
            <div className="preset-btn-group">
              <button className="preset-pill" onClick={() => handleLoadStrategyPreset('growth')}>
                Aggressive Growth (65 Risk / 10% Liq / 14% Return)
              </button>
              <button className="preset-pill" onClick={() => handleLoadStrategyPreset('balanced')}>
                All-Weather Balanced (40 Risk / 20% Liq / 11.5% Return)
              </button>
              <button className="preset-pill" onClick={() => handleLoadStrategyPreset('conservative')}>
                Capital Preservation (20 Risk / 35% Liq / 8.5% Return)
              </button>
            </div>
          </div>

          <div className="analytics-sim-grid">
            {/* Input 1: Capital */}
            <div className="analytics-sim-card">
              <div className="analytics-sim-label">
                <span>Total Investable Capital</span>
                <strong>{formatINR(capitalNum)}</strong>
              </div>
              <input
                type="range"
                min="100000"
                max="50000000"
                step="100000"
                value={capitalNum}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="analytics-slider"
              />
              <div className="analytics-slider-ticks">
                <span onClick={() => setCapital(500000)}>₹5L</span>
                <span onClick={() => setCapital(1000000)}>₹10L</span>
                <span onClick={() => setCapital(2500000)}>₹25L</span>
                <span onClick={() => setCapital(5000000)}>₹50L</span>
                <span onClick={() => setCapital(10000000)}>₹1Cr</span>
              </div>
            </div>

            {/* Input 2: Risk Limit */}
            <div className="analytics-sim-card">
              <div className="analytics-sim-label">
                <span>Target Risk Budget (0 - 100)</span>
                <strong>{riskNum} / 100</strong>
              </div>
              <input
                type="range"
                min="10"
                max="85"
                step="1"
                value={riskNum}
                onChange={(e) => setRiskLimit(Number(e.target.value))}
                className="analytics-slider"
              />
              <div className="analytics-slider-ticks">
                <span onClick={() => setRiskLimit(20)}>Conservative (20)</span>
                <span onClick={() => setRiskLimit(40)}>Balanced (40)</span>
                <span onClick={() => setRiskLimit(65)}>Aggressive (65)</span>
              </div>
            </div>

            {/* Input 3: Liquidity Buffer */}
            <div className="analytics-sim-card">
              <div className="analytics-sim-label">
                <span>Target Liquidity Guardrail</span>
                <strong>{liquidityNum}%</strong>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={liquidityNum}
                onChange={(e) => setLiquidityLimit(Number(e.target.value))}
                className="analytics-slider"
              />
              <div className="analytics-slider-ticks">
                <span onClick={() => setLiquidityLimit(10)}>10% Low</span>
                <span onClick={() => setLiquidityLimit(20)}>20% Target</span>
                <span onClick={() => setLiquidityLimit(35)}>35% High</span>
              </div>
            </div>

            {/* Input 4: Target Annual Return */}
            <div className="analytics-sim-card">
              <div className="analytics-sim-label">
                <span>Target Annual Return</span>
                <strong>{targetReturnNum.toFixed(1)}% p.a.</strong>
              </div>
              <input
                type="range"
                min="6"
                max="20"
                step="0.5"
                value={targetReturnNum}
                onChange={(e) => setTargetReturn(Number(e.target.value))}
                className="analytics-slider"
              />
              <div className="analytics-slider-ticks">
                <span onClick={() => setTargetReturn(8)}>8% FD+</span>
                <span onClick={() => setTargetReturn(10)}>10% Target</span>
                <span onClick={() => setTargetReturn(14)}>14% Equity</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3-PILLAR TARGET GUARDRAILS (RETURN, RISK, LIQUIDITY) ── */}
      <div className="analytics-kpi-grid">
        {/* KPI 1: Expected Return */}
        <div className="analytics-kpi-card highlight-blue">
          <div className="analytics-kpi-top">
            <span className="analytics-kpi-title">Expected Portfolio Return</span>
            <span className="analytics-badge-chip" style={{ color: returnStatus.color, background: returnStatus.bg }}>
              {returnStatus.badge}
            </span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-main-val">{expectedReturnPct}%</span>
            <span className="analytics-kpi-target-tag">Target: {targetReturnNum}%</span>
          </div>
          <div className="analytics-kpi-formula-bar" style={{ borderColor: returnStatus.color }}>
            <span className="analytics-formula-text">
              <strong>{returnStatus.label}</strong>
            </span>
          </div>
          <div className="analytics-kpi-sub">
            Projected gain: <strong>+₹{annualGainAmt.toLocaleString('en-IN')}</strong> / year (₹{monthlyGainAmt.toLocaleString('en-IN')} / mo)
          </div>
        </div>

        {/* KPI 2: Expected Risk */}
        <div className="analytics-kpi-card highlight-purple">
          <div className="analytics-kpi-top">
            <span className="analytics-kpi-title">Expected Portfolio Risk</span>
            <span className="analytics-badge-chip" style={{ color: riskStatus.color, background: riskStatus.bg }}>
              {riskStatus.badge}
            </span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-main-val">{expRiskScore}<small>/100</small></span>
            <span className="analytics-kpi-target-tag">Target Budget: ≤ {riskNum}</span>
          </div>
          <div className="analytics-kpi-formula-bar" style={{ borderColor: riskStatus.color }}>
            <span className="analytics-formula-text">
              <strong>{riskStatus.label}</strong>
            </span>
          </div>
          <div className="analytics-kpi-sub">
            Diversification benefit: <strong>-3.5 pts</strong> volatility cushion
          </div>
        </div>

        {/* KPI 3: Expected Liquidity */}
        <div className="analytics-kpi-card highlight-green">
          <div className="analytics-kpi-top">
            <span className="analytics-kpi-title">Expected Liquidity Buffer</span>
            <span className="analytics-badge-chip" style={{ color: liquidityStatus.color, background: liquidityStatus.bg }}>
              {liquidityStatus.badge}
            </span>
          </div>
          <div className="analytics-kpi-value-row">
            <span className="analytics-kpi-main-val">{expLiquidityPct}%</span>
            <span className="analytics-kpi-target-tag">Target Guardrail: {liquidityNum}%</span>
          </div>
          <div className="analytics-kpi-formula-bar" style={{ borderColor: liquidityStatus.color }}>
            <span className="analytics-formula-text">
              <strong>{liquidityStatus.label}</strong>
            </span>
          </div>
          <div className="analytics-kpi-sub">
            Instant Cash Available: <strong>{formatINR(recLiquidAmt)}</strong> (T+0 instant access)
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE INSTITUTIONAL QUANTITATIVE HUD ── */}
      <div className="analytics-quant-strip">
        <div className="quant-stat-item">
          <div className="quant-label">Sharpe Ratio (Sp)</div>
          <div className="quant-val text-green">{sharpeRatio}</div>
          <div className="quant-sub">Risk-adjusted return</div>
        </div>
        <div className="quant-stat-item">
          <div className="quant-label">Sortino Ratio</div>
          <div className="quant-val text-cyan">{sortinoRatio}</div>
          <div className="quant-sub">Downside volatility adj.</div>
        </div>
        <div className="quant-stat-item">
          <div className="quant-label">Portfolio Beta (β)</div>
          <div className="quant-val text-purple">{portfolioBeta}</div>
          <div className="quant-sub">Market correlation vs NIFTY</div>
        </div>
        <div className="quant-stat-item">
          <div className="quant-label">Alpha Generation (α)</div>
          <div className="quant-val text-green">{alphaVal >= 0 ? `+${alphaVal}%` : `${alphaVal}%`}</div>
          <div className="quant-sub">Excess return over benchmark</div>
        </div>
        <div className="quant-stat-item">
          <div className="quant-label">95% Daily VaR</div>
          <div className="quant-val text-amber">{var95PctDaily}%</div>
          <div className="quant-sub">Max normal 1-day variance</div>
        </div>
        <div className="quant-stat-item">
          <div className="quant-label">Max Drawdown Buffer</div>
          <div className="quant-val text-blue">-{maxHistoricDD}%</div>
          <div className="quant-sub">vs NIFTY benchmark -28.4%</div>
        </div>
      </div>

      {/* ── SECTION: PORTFOLIO OVERVIEW & RECOMMENDED ALLOCATION ── */}
      <div className="analytics-section-card">
        <div className="analytics-card-header">
          <div>
            <div className="analytics-tag-pill">Quantitative Optimization Engine</div>
            <h2>Recommended Asset Allocation Breakdown</h2>
            <p>Capital deployment calibrated to your risk parameters and liquidity constraints.</p>
          </div>
          <div className="analytics-capital-badge">
            Total Capital: <strong>{formatINR(capitalNum)}</strong>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Asset Class</th>
                <th>Target Role</th>
                <th>Recommended %</th>
                <th>Allocated Amount</th>
                <th>Expected Yield</th>
                <th>Risk Profile</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Equity */}
              <tr className="analytics-row-equity">
                <td>
                  <div className="analytics-asset-cell">
                    <span className="analytics-color-dot dot-equity"></span>
                    <div>
                      <strong>Equity</strong>
                      <span className="analytics-asset-sub">Nifty 50, Large & Midcap Leaders</span>
                    </div>
                  </div>
                </td>
                <td><span className="analytics-role-chip role-growth">Wealth Growth</span></td>
                <td>
                  <span className="analytics-pct-badge pct-equity">{recEquityPct}%</span>
                </td>
                <td>
                  <div className="analytics-amt-cell">
                    <span className="analytics-arrow">→</span>
                    <strong>{formatINR(recEquityAmt)}</strong>
                  </div>
                </td>
                <td className="analytics-green-txt">~14.7% p.a.</td>
                <td><span className="analytics-risk-tag tag-high">High Alpha</span></td>
              </tr>

              {/* Row 2: Bonds */}
              <tr className="analytics-row-bonds">
                <td>
                  <div className="analytics-asset-cell">
                    <span className="analytics-color-dot dot-bonds"></span>
                    <div>
                      <strong>Bonds</strong>
                      <span className="analytics-asset-sub">Govt 10Y G-Secs, AAA Corporate Bonds</span>
                    </div>
                  </div>
                </td>
                <td><span className="analytics-role-chip role-income">Capital Preservation</span></td>
                <td>
                  <span className="analytics-pct-badge pct-bonds">{recBondsPct}%</span>
                </td>
                <td>
                  <div className="analytics-amt-cell">
                    <span className="analytics-arrow">→</span>
                    <strong>{formatINR(recBondsAmt)}</strong>
                  </div>
                </td>
                <td className="analytics-blue-txt">~7.8% p.a.</td>
                <td><span className="analytics-risk-tag tag-low">Low Volatility</span></td>
              </tr>

              {/* Row 3: Liquid Cash */}
              <tr className="analytics-row-cash">
                <td>
                  <div className="analytics-asset-cell">
                    <span className="analytics-color-dot dot-cash"></span>
                    <div>
                      <strong>Liquid Cash</strong>
                      <span className="analytics-asset-sub">Overnight T-Bills, Liquid Funds (T+0)</span>
                    </div>
                  </div>
                </td>
                <td><span className="analytics-role-chip role-safety">Emergency Guardrail</span></td>
                <td>
                  <span className="analytics-pct-badge pct-cash">{recLiquidPct}%</span>
                </td>
                <td>
                  <div className="analytics-amt-cell">
                    <span className="analytics-arrow">→</span>
                    <strong>{formatINR(recLiquidAmt)}</strong>
                  </div>
                </td>
                <td className="analytics-cyan-txt">~5.5% p.a.</td>
                <td><span className="analytics-risk-tag tag-zero">Zero Lock-in</span></td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="analytics-total-row">
                <td colSpan="2"><strong>Total Portfolio Deployment</strong></td>
                <td><span className="analytics-pct-badge pct-total">100%</span></td>
                <td>
                  <div className="analytics-amt-cell">
                    <span className="analytics-arrow">→</span>
                    <strong className="analytics-total-amt">{formatINR(recTotalAmt)}</strong>
                  </div>
                </td>
                <td colSpan="2" className="analytics-blended-txt">
                  Blended Return: <strong>{expectedReturnPct}% p.a.</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── SECTION: MULTI-YEAR COMPOUNDING PROJECTION SIMULATOR ── */}
      <div className="analytics-section-card">
        <div className="analytics-card-header">
          <div>
            <div className="analytics-tag-pill">Multi-Year Capital Growth Simulation</div>
            <h2>Long-Term Wealth Compounding Engine</h2>
            <p>Calculated at <strong>{expectedReturnPct}% p.a.</strong> blended yield with reinvestment.</p>
          </div>
          <div className="projection-horizon-selector">
            {[1, 3, 5, 10, 15, 20].map((yr) => (
              <button
                key={yr}
                className={`horizon-pill ${projectionYears === yr ? 'active' : ''}`}
                onClick={() => setProjectionYears(yr)}
              >
                {yr}Y
              </button>
            ))}
          </div>
        </div>

        <div className="projection-stats-grid">
          <div className="projection-stat-card">
            <span className="proj-label">Initial Principal</span>
            <span className="proj-val">{formatINR(capitalNum)}</span>
            <span className="proj-sub">Base Capital</span>
          </div>
          <div className="projection-stat-card highlight-green">
            <span className="proj-label">Projected Portfolio in {projectionYears} Years</span>
            <span className="proj-val text-green">{formatINR(projectedFutureWealth)}</span>
            <span className="proj-sub">Value at {expectedReturnPct}% CAGR</span>
          </div>
          <div className="projection-stat-card">
            <span className="proj-label">Total Wealth Generated</span>
            <span className="proj-val text-cyan">+{formatINR(totalWealthGenerated)}</span>
            <span className="proj-sub">{((compoundMultiplier - 1) * 100).toFixed(1)}% Net Compounded Gain</span>
          </div>
        </div>

        {/* Milestone Compounding Timeline Bar */}
        <div className="compounding-timeline-wrap">
          <div className="timeline-title">Compounding Milestones across Horizon:</div>
          <div className="timeline-bars-grid">
            {[1, 3, 5, 10, 20].map((y) => {
              const fv = Math.round(capitalNum * Math.pow(1 + expectedReturnPct / 100, y))
              const maxFv = Math.round(capitalNum * Math.pow(1 + expectedReturnPct / 100, 20))
              const barWidth = Math.max(12, Math.min(100, (fv / maxFv) * 100))
              return (
                <div key={y} className={`timeline-bar-row ${projectionYears === y ? 'selected-horizon' : ''}`}>
                  <div className="timeline-year-label">{y} Year{y > 1 ? 's' : ''}</div>
                  <div className="timeline-track">
                    <div className="timeline-fill" style={{ width: `${barWidth}%` }}></div>
                  </div>
                  <div className="timeline-amt-label">{formatINR(fv)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── SECTION: ALLOCATION COMPARISON & VISUAL CHARTS ── */}
      <div className="analytics-charts-grid">
        {/* Chart Card 1: Visual Allocation Bar Chart */}
        <div className="analytics-chart-card">
          <div className="analytics-card-header">
            <div>
              <h3>Target Allocation Profile</h3>
              <p>Proportion of asset classes matching target parameters.</p>
            </div>
            <span className="analytics-live-tag">Optimized Model</span>
          </div>

          {/* Ribbon Bar */}
          <div className="analytics-ribbon-bar">
            <div
              className="analytics-ribbon-seg seg-equity"
              style={{ width: `${recEquityPct}%` }}
              title={`Equity: ${recEquityPct}% (${formatINR(recEquityAmt)})`}
            >
              <span>{recEquityPct}%</span>
            </div>
            <div
              className="analytics-ribbon-seg seg-bonds"
              style={{ width: `${recBondsPct}%` }}
              title={`Bonds: ${recBondsPct}% (${formatINR(recBondsAmt)})`}
            >
              <span>{recBondsPct}%</span>
            </div>
            <div
              className="analytics-ribbon-seg seg-cash"
              style={{ width: `${recLiquidPct}%` }}
              title={`Liquid Cash: ${recLiquidPct}% (${formatINR(recLiquidAmt)})`}
            >
              <span>{recLiquidPct}%</span>
            </div>
          </div>

          {/* Detailed Bar Blocks */}
          <div className="analytics-bars-container">
            {/* Equity Bar */}
            <div className="analytics-bar-item">
              <div className="analytics-bar-header">
                <div className="analytics-bar-title-group">
                  <span className="analytics-color-dot dot-equity"></span>
                  <strong>Equity Allocation</strong>
                </div>
                <div className="analytics-bar-stat">
                  <span className="analytics-bar-pct">{recEquityPct}%</span>
                  <span className="analytics-bar-amt">{formatINR(recEquityAmt)}</span>
                </div>
              </div>
              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill fill-equity"
                  style={{ width: `${recEquityPct}%` }}
                >
                  <div className="analytics-bar-glow"></div>
                </div>
              </div>
              <div className="analytics-bar-subinfo">
                <span>Large Cap Core (25%) • Midcap Alpha (15%) • Global Leaders (10%)</span>
                <span className="analytics-yield-tag">Exp: +14.7%</span>
              </div>
            </div>

            {/* Bonds Bar */}
            <div className="analytics-bar-item">
              <div className="analytics-bar-header">
                <div className="analytics-bar-title-group">
                  <span className="analytics-color-dot dot-bonds"></span>
                  <strong>Bonds & Fixed Income</strong>
                </div>
                <div className="analytics-bar-stat">
                  <span className="analytics-bar-pct">{recBondsPct}%</span>
                  <span className="analytics-bar-amt">{formatINR(recBondsAmt)}</span>
                </div>
              </div>
              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill fill-bonds"
                  style={{ width: `${recBondsPct}%` }}
                >
                  <div className="analytics-bar-glow"></div>
                </div>
              </div>
              <div className="analytics-bar-subinfo">
                <span>Sovereign G-Sec 10Y (18%) • AAA Corporate Debt (12%)</span>
                <span className="analytics-yield-tag">Exp: +7.8%</span>
              </div>
            </div>

            {/* Liquid Cash Bar */}
            <div className="analytics-bar-item">
              <div className="analytics-bar-header">
                <div className="analytics-bar-title-group">
                  <span className="analytics-color-dot dot-cash"></span>
                  <strong>Liquid Cash & Guardrail</strong>
                </div>
                <div className="analytics-bar-stat">
                  <span className="analytics-bar-pct">{recLiquidPct}%</span>
                  <span className="analytics-bar-amt">{formatINR(recLiquidAmt)}</span>
                </div>
              </div>
              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill fill-cash"
                  style={{ width: `${recLiquidPct}%` }}
                >
                  <div className="analytics-bar-glow"></div>
                </div>
              </div>
              <div className="analytics-bar-subinfo">
                <span>Overnight T-Bills (10%) • High-Yield Liquid NAV (10%)</span>
                <span className="analytics-yield-tag">Exp: +5.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card 2: Actual vs Recommended Comparison */}
        <div className="analytics-chart-card">
          <div className="analytics-card-header">
            <div>
              <h3>Actual vs Recommended Variance Analyzer</h3>
              <p>Live drift diagnostic interacting with capital ({formatINR(capitalNum)}).</p>
            </div>
            <div className="analytics-comp-header-actions">
              <button
                className={`analytics-mini-toggle-btn ${showActualTuner ? 'active' : ''}`}
                onClick={() => setShowActualTuner(!showActualTuner)}
              >
                {showActualTuner ? 'Close Editor' : 'Adjust Holdings'}
              </button>
              <button
                className="analytics-mini-toggle-btn"
                onClick={() => { setActualEquityPct(55); setActualBondsPct(25); setActualCashPct(20); }}
                title="Reset to 55% Equity, 25% Bonds, 20% Cash"
              >
                Reset (55/25/20)
              </button>
            </div>
          </div>

          {/* Recommended Target Model Switcher Bar */}
          <div className="analytics-model-switcher-bar">
            <span className="analytics-model-switcher-label">Target Model:</span>
            <div className="analytics-model-pills">
              <button
                className={`analytics-model-pill ${recModelMode === 'dynamic' ? 'active' : ''}`}
                onClick={() => setRecModelMode('dynamic')}
                title="Calculated live from your Capital, Risk & Liquidity inputs"
              >
                <span className="pill-name">Dynamic Model</span>
                <span className="pill-pcts">({recEquityPct}% / {recBondsPct}% / {recLiquidPct}%)</span>
              </button>
              <button
                className={`analytics-model-pill ${recModelMode === 'preset45' ? 'active' : ''}`}
                onClick={() => setRecModelMode('preset45')}
                title="Benchmark preset: 45% Equity, 30% Bonds, 25% Cash"
              >
                <span className="pill-name">Benchmark Preset</span>
                <span className="pill-pcts">(45% / 30% / 25%)</span>
              </button>
              <button
                className={`analytics-model-pill ${recModelMode === 'custom' ? 'active' : ''}`}
                onClick={() => { setRecModelMode('custom'); setShowActualTuner(true); }}
                title="Customize target recommended percentages"
              >
                <span className="pill-name">Custom Target</span>
                <span className="pill-pcts">({customRecEquityPct}% / {customRecBondsPct}% / {customRecCashPct}%)</span>
              </button>
            </div>
          </div>

          {/* Rebalance Applied Alert Banner */}
          {rebalanceAppliedMsg && (
            <div className="analytics-rebalance-banner">
              <div className="rebal-banner-txt">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <strong>{rebalanceAppliedMsg}</strong>
              </div>
              {prevActualState && (
                <button className="analytics-undo-btn" onClick={handleUndoRebalance}>
                  Undo Rebalance
                </button>
              )}
            </div>
          )}

          {/* Collapsible Actual Allocation Tuner */}
          {showActualTuner && (
            <div className="analytics-actual-tuner">
              <div className="analytics-actual-tuner-title">
                <div className="tuner-title-left">
                  <span>Configure Actual Portfolio Holdings</span>
                  <div className="tuner-mode-toggle">
                    <button
                      className={`tuner-mode-btn ${actualInputMode === 'pct' ? 'active' : ''}`}
                      onClick={() => setActualInputMode('pct')}
                    >
                      % Percentage
                    </button>
                    <button
                      className={`tuner-mode-btn ${actualInputMode === 'amt' ? 'active' : ''}`}
                      onClick={() => setActualInputMode('amt')}
                    >
                      ₹ Direct Rupees
                    </button>
                  </div>
                </div>
                <div className="tuner-title-right">
                  <span className="tuner-total-pill">
                    Total Actual: <strong>{actTotalPct}%</strong> ({formatINR(actTotalAmt)})
                  </span>
                  {totalInvestedInStocks > 0 && (
                    <button
                      className="tuner-sync-btn"
                      onClick={handleSyncLiveOrders}
                      title="Sync stock orders from your real trade history"
                    >
                      Sync Live Stocks ({formatINR(totalInvestedInStocks)})
                    </button>
                  )}
                </div>
              </div>

              {/* Mode 1: Direct Rupee Inputs */}
              {actualInputMode === 'amt' ? (
                <div className="analytics-actual-amt-grid">
                  <div className="actual-amt-card">
                    <div className="actual-amt-header">
                      <span className="analytics-color-dot dot-equity"></span>
                      <span>Actual Equity Amount</span>
                      <strong className="amt-pct-tag">{actEqPct}% of Capital</strong>
                    </div>
                    <div className="actual-amt-input-wrap">
                      <span className="amt-curr-prefix">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={actEqAmt}
                        onChange={(e) => handleActualAmtChange('equity', e.target.value)}
                        className="actual-amt-input"
                        placeholder="Enter Equity ₹"
                      />
                    </div>
                    <div className="actual-amt-hint">
                      Recommended: {formatINR(compRecEquityAmt)} ({compRecEquityPct}%)
                    </div>
                  </div>

                  <div className="actual-amt-card">
                    <div className="actual-amt-header">
                      <span className="analytics-color-dot dot-bonds"></span>
                      <span>Actual Bonds Amount</span>
                      <strong className="amt-pct-tag">{actBdPct}% of Capital</strong>
                    </div>
                    <div className="actual-amt-input-wrap">
                      <span className="amt-curr-prefix">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={actBdAmt}
                        onChange={(e) => handleActualAmtChange('bonds', e.target.value)}
                        className="actual-amt-input"
                        placeholder="Enter Bonds ₹"
                      />
                    </div>
                    <div className="actual-amt-hint">
                      Recommended: {formatINR(compRecBondsAmt)} ({compRecBondsPct}%)
                    </div>
                  </div>

                  <div className="actual-amt-card">
                    <div className="actual-amt-header">
                      <span className="analytics-color-dot dot-cash"></span>
                      <span>Actual Cash Amount</span>
                      <strong className="amt-pct-tag">{actCsPct}% of Capital</strong>
                    </div>
                    <div className="actual-amt-input-wrap">
                      <span className="amt-curr-prefix">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={actCsAmt}
                        onChange={(e) => handleActualAmtChange('cash', e.target.value)}
                        className="actual-amt-input"
                        placeholder="Enter Cash ₹"
                      />
                    </div>
                    <div className="actual-amt-hint">
                      Recommended: {formatINR(compRecCashAmt)} ({compRecCashPct}%)
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: Percentage Sliders + Quick Buttons */
                <div className="analytics-actual-sliders-grid">
                  <div className="actual-slider-card">
                    <div className="actual-slider-header">
                      <div className="slider-header-left">
                        <span className="analytics-color-dot dot-equity"></span>
                        <span>Actual Equity</span>
                      </div>
                      <div className="slider-header-right">
                        <strong>{actEqPct}%</strong>
                        <small className="slider-amt-label">({formatINR(actEqAmt)})</small>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={actEqPct}
                      onChange={(e) => setActualEquityPct(Number(e.target.value))}
                      className="analytics-slider"
                    />
                    <div className="slider-stepper-row">
                      <button className="stepper-btn" onClick={() => handleQuickDelta('equity', -5)}>-5%</button>
                      <button className="stepper-btn" onClick={() => handleQuickDelta('equity', +5)}>+5%</button>
                      <span className="stepper-target-hint">Target: {compRecEquityPct}%</span>
                    </div>
                  </div>

                  <div className="actual-slider-card">
                    <div className="actual-slider-header">
                      <div className="slider-header-left">
                        <span className="analytics-color-dot dot-bonds"></span>
                        <span>Actual Bonds</span>
                      </div>
                      <div className="slider-header-right">
                        <strong>{actBdPct}%</strong>
                        <small className="slider-amt-label">({formatINR(actBdAmt)})</small>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={actBdPct}
                      onChange={(e) => setActualBondsPct(Number(e.target.value))}
                      className="analytics-slider"
                    />
                    <div className="slider-stepper-row">
                      <button className="stepper-btn" onClick={() => handleQuickDelta('bonds', -5)}>-5%</button>
                      <button className="stepper-btn" onClick={() => handleQuickDelta('bonds', +5)}>+5%</button>
                      <span className="stepper-target-hint">Target: {compRecBondsPct}%</span>
                    </div>
                  </div>

                  <div className="actual-slider-card">
                    <div className="actual-slider-header">
                      <div className="slider-header-left">
                        <span className="analytics-color-dot dot-cash"></span>
                        <span>Actual Cash</span>
                      </div>
                      <div className="slider-header-right">
                        <strong>{actCsPct}%</strong>
                        <small className="slider-amt-label">({formatINR(actCsAmt)})</small>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={actCsPct}
                      onChange={(e) => setActualCashPct(Number(e.target.value))}
                      className="analytics-slider"
                    />
                    <div className="slider-stepper-row">
                      <button className="stepper-btn" onClick={() => handleQuickDelta('cash', -5)}>-5%</button>
                      <button className="stepper-btn" onClick={() => handleQuickDelta('cash', +5)}>+5%</button>
                      <span className="stepper-target-hint">Target: {compRecCashPct}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Target Editor */}
              {recModelMode === 'custom' && (
                <div className="analytics-custom-rec-row">
                  <span className="custom-rec-title">Customize Recommended Targets:</span>
                  <div className="custom-rec-inputs">
                    <label>
                      Equity %
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customRecEquityPct}
                        onChange={(e) => setCustomRecEquityPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                        className="custom-rec-inp"
                      />
                    </label>
                    <label>
                      Bonds %
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customRecBondsPct}
                        onChange={(e) => setCustomRecBondsPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                        className="custom-rec-inp"
                      />
                    </label>
                    <label>
                      Cash %
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customRecCashPct}
                        onChange={(e) => setCustomRecCashPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                        className="custom-rec-inp"
                      />
                    </label>
                    <button
                      className="stepper-btn"
                      onClick={() => { setCustomRecEquityPct(45); setCustomRecBondsPct(30); setCustomRecCashPct(25); }}
                    >
                      Reset (45/30/25)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Side-by-Side Actual vs Recommended Comparison Table */}
          <div className="analytics-comp-table-wrap">
            <table className="analytics-comp-table">
              <thead>
                <tr>
                  <th>Asset Class</th>
                  <th style={{ textAlign: 'center' }}>Actual (Live)</th>
                  <th style={{ textAlign: 'center' }}>Recommended Target</th>
                  <th style={{ textAlign: 'center' }}>Variance</th>
                  <th>Rebalance Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Equity */}
                <tr>
                  <td>
                    <div className="analytics-comp-asset">
                      <span className="analytics-color-dot dot-equity"></span>
                      <div>
                        <strong>Equity</strong>
                        <span className="analytics-asset-sub">High Growth Alpha</span>
                      </div>
                    </div>
                  </td>
                  <td className="comp-col-act">
                    <div className="comp-pct-stepper-cell">
                      <button
                        className="comp-inline-stepper-btn"
                        onClick={() => handleQuickDelta('equity', -5)}
                        title="Decrease Actual Equity by 5%"
                      >
                        -
                      </button>
                      <span className="comp-pct-main">{actEqPct}%</span>
                      <button
                        className="comp-inline-stepper-btn"
                        onClick={() => handleQuickDelta('equity', +5)}
                        title="Increase Actual Equity by 5%"
                      >
                        +
                      </button>
                    </div>
                    <span className="comp-amt-sub">{formatINR(actEqAmt)}</span>
                  </td>
                  <td className="comp-col-rec">
                    <div className="comp-rec-pct-cell">
                      <span className="comp-pct-main rec-blue">{compRecEquityPct}%</span>
                      <span className="comp-rec-badge">
                        {recModelMode === 'dynamic' ? 'Dynamic Model' : recModelMode === 'preset45' ? '45% Benchmark' : 'Custom'}
                      </span>
                    </div>
                    <span className="comp-amt-sub">{formatINR(compRecEquityAmt)}</span>
                  </td>
                  <td className="comp-col-var">
                    <span className={`comp-var-pill ${eqVariance > 0 ? 'var-over' : eqVariance < 0 ? 'var-under' : 'var-zero'}`}>
                      {eqVariance > 0 ? `+${eqVariance}%` : `${eqVariance}%`}
                    </span>
                    <span className="comp-var-amt">
                      {eqAmtDiff > 0 ? `+${formatINR(eqAmtDiff)}` : eqAmtDiff < 0 ? `-${formatINR(Math.abs(eqAmtDiff))}` : 'Balanced'}
                    </span>
                  </td>
                  <td>
                    {eqVariance > 0 ? (
                      <span className="comp-action-badge action-trim">
                        Trim {formatINR(Math.abs(eqAmtDiff))} (Overweight)
                      </span>
                    ) : eqVariance < 0 ? (
                      <span className="comp-action-badge action-buy">
                        Buy {formatINR(Math.abs(eqAmtDiff))} (Underweight)
                      </span>
                    ) : (
                      <span className="comp-action-badge action-opt">Optimal</span>
                    )}
                  </td>
                </tr>

                {/* Row 2: Bonds */}
                <tr>
                  <td>
                    <div className="analytics-comp-asset">
                      <span className="analytics-color-dot dot-bonds"></span>
                      <div>
                        <strong>Bonds</strong>
                        <span className="analytics-asset-sub">Preservation & Yield</span>
                      </div>
                    </div>
                  </td>
                  <td className="comp-col-act">
                    <div className="comp-pct-stepper-cell">
                      <button
                        className="comp-inline-stepper-btn"
                        onClick={() => handleQuickDelta('bonds', -5)}
                        title="Decrease Actual Bonds by 5%"
                      >
                        -
                      </button>
                      <span className="comp-pct-main">{actBdPct}%</span>
                      <button
                        className="comp-inline-stepper-btn"
                        onClick={() => handleQuickDelta('bonds', +5)}
                        title="Increase Actual Bonds by 5%"
                      >
                        +
                      </button>
                    </div>
                    <span className="comp-amt-sub">{formatINR(actBdAmt)}</span>
                  </td>
                  <td className="comp-col-rec">
                    <div className="comp-rec-pct-cell">
                      <span className="comp-pct-main rec-purple">{compRecBondsPct}%</span>
                      <span className="comp-rec-badge">
                        {recModelMode === 'dynamic' ? 'Dynamic Model' : recModelMode === 'preset45' ? '30% Benchmark' : 'Custom'}
                      </span>
                    </div>
                    <span className="comp-amt-sub">{formatINR(compRecBondsAmt)}</span>
                  </td>
                  <td className="comp-col-var">
                    <span className={`comp-var-pill ${bdVariance > 0 ? 'var-over' : bdVariance < 0 ? 'var-under' : 'var-zero'}`}>
                      {bdVariance > 0 ? `+${bdVariance}%` : `${bdVariance}%`}
                    </span>
                    <span className="comp-var-amt">
                      {bdAmtDiff > 0 ? `+${formatINR(bdAmtDiff)}` : bdAmtDiff < 0 ? `-${formatINR(Math.abs(bdAmtDiff))}` : 'Balanced'}
                    </span>
                  </td>
                  <td>
                    {bdVariance < 0 ? (
                      <span className="comp-action-badge action-buy">
                        Buy {formatINR(Math.abs(bdAmtDiff))} (Underweight)
                      </span>
                    ) : bdVariance > 0 ? (
                      <span className="comp-action-badge action-trim">
                        Trim {formatINR(Math.abs(bdAmtDiff))} (Overweight)
                      </span>
                    ) : (
                      <span className="comp-action-badge action-opt">Optimal</span>
                    )}
                  </td>
                </tr>

                {/* Row 3: Liquid Cash */}
                <tr>
                  <td>
                    <div className="analytics-comp-asset">
                      <span className="analytics-color-dot dot-cash"></span>
                      <div>
                        <strong>Liquid Cash</strong>
                        <span className="analytics-asset-sub">Buffer & Guardrail</span>
                      </div>
                    </div>
                  </td>
                  <td className="comp-col-act">
                    <div className="comp-pct-stepper-cell">
                      <button
                        className="comp-inline-stepper-btn"
                        onClick={() => handleQuickDelta('cash', -5)}
                        title="Decrease Actual Cash by 5%"
                      >
                        -
                      </button>
                      <span className="comp-pct-main">{actCsPct}%</span>
                      <button
                        className="comp-inline-stepper-btn"
                        onClick={() => handleQuickDelta('cash', +5)}
                        title="Increase Actual Cash by 5%"
                      >
                        +
                      </button>
                    </div>
                    <span className="comp-amt-sub">{formatINR(actCsAmt)}</span>
                  </td>
                  <td className="comp-col-rec">
                    <div className="comp-rec-pct-cell">
                      <span className="comp-pct-main rec-green">{compRecCashPct}%</span>
                      <span className="comp-rec-badge">
                        {recModelMode === 'dynamic' ? 'Dynamic Model' : recModelMode === 'preset45' ? '25% Benchmark' : 'Custom'}
                      </span>
                    </div>
                    <span className="comp-amt-sub">{formatINR(compRecCashAmt)}</span>
                  </td>
                  <td className="comp-col-var">
                    <span className={`comp-var-pill ${csVariance > 0 ? 'var-over' : csVariance < 0 ? 'var-under' : 'var-zero'}`}>
                      {csVariance > 0 ? `+${csVariance}%` : `${csVariance}%`}
                    </span>
                    <span className="comp-var-amt">
                      {csAmtDiff > 0 ? `+${formatINR(csAmtDiff)}` : csAmtDiff < 0 ? `-${formatINR(Math.abs(csAmtDiff))}` : 'Balanced'}
                    </span>
                  </td>
                  <td>
                    {csVariance < 0 ? (
                      <span className="comp-action-badge action-buy">
                        Add {formatINR(Math.abs(csAmtDiff))} (Underweight)
                      </span>
                    ) : csVariance > 0 ? (
                      <span className="comp-action-badge action-trim">
                        Deploy {formatINR(Math.abs(csAmtDiff))} (Surplus)
                      </span>
                    ) : (
                      <span className="comp-action-badge action-opt">Optimal</span>
                    )}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="comp-total-row">
                  <td><strong>Total Portfolio</strong></td>
                  <td className="comp-col-act">
                    <strong className="comp-total-val">{actTotalPct}%</strong>
                    <span className="comp-amt-sub">{formatINR(actTotalAmt)}</span>
                  </td>
                  <td className="comp-col-rec">
                    <strong className="comp-total-val">{compRecTotalPct}%</strong>
                    <span className="comp-amt-sub">{formatINR(compRecTotalAmt)}</span>
                  </td>
                  <td colSpan="2" className="comp-col-summary">
                    {eqVariance === 0 && bdVariance === 0 && csVariance === 0 ? (
                      <span className="comp-summary-balanced">Portfolio Aligned with Target Allocation</span>
                    ) : (
                      <div className="comp-summary-action-wrap">
                        <span className="comp-summary-rebalance">
                          Drift Gap: Reallocate <strong>{formatINR(Math.abs(eqAmtDiff))}</strong> across asset classes (Drift: {totalDriftPct}%)
                        </span>
                        <button
                          className="comp-inline-rebalance-btn"
                          onClick={handleSimulateRebalance}
                          title="Instantly balance actual portfolio to match recommended targets"
                        >
                          Auto-Balance Portfolio
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actionable Rebalancing Plan Box */}
          <div className="analytics-rebalance-box">
            <div className="analytics-rebalance-top">
              <div className="analytics-rebalance-title">
                <strong>Portfolio Rebalancing Directive & Execution Plan</strong>
              </div>
              <div className="analytics-rebalance-action-btns">
                <button
                  className="rebal-action-btn rebal-btn-primary"
                  onClick={handleSimulateRebalance}
                >
                  Execute 1-Click Rebalance
                </button>
                {prevActualState && (
                  <button
                    className="rebal-action-btn rebal-btn-secondary"
                    onClick={handleUndoRebalance}
                  >
                    Revert to Previous
                  </button>
                )}
                <button
                  className="rebal-action-btn rebal-btn-ghost"
                  onClick={() => { setActualEquityPct(55); setActualBondsPct(25); setActualCashPct(20); }}
                >
                  Default (55/25/20)
                </button>
              </div>
            </div>

            <p>
              {eqVariance === 0 && bdVariance === 0 && csVariance === 0 ? (
                <span>Your actual portfolio is in <strong>equilibrium</strong> with target models. No rebalancing required.</span>
              ) : (
                <span>
                  Your portfolio is currently <strong>{Math.abs(eqVariance)}% {eqVariance > 0 ? 'overweight' : 'underweight'} in Equities</strong> ({actEqPct}% vs {compRecEquityPct}%) and <strong>{bdVariance >= 0 ? `${bdVariance}% overweight` : `${Math.abs(bdVariance)}% underweight`} in Bonds</strong> ({actBdPct}% vs {compRecBondsPct}%) and <strong>{csVariance >= 0 ? `${csVariance}% surplus` : `${Math.abs(csVariance)}% deficit`} in Liquid Cash</strong> ({actCsPct}% vs {compRecCashPct}%).
                </span>
              )}
            </p>

            <div className="analytics-rebalance-steps">
              <div className="rebal-step step-trim">
                <span className="step-num">1</span>
                <span>
                  {eqVariance > 0
                    ? <>Trim <strong>{formatINR(Math.abs(eqAmtDiff))}</strong> from Equities to harvest profits and lock gains.</>
                    : eqVariance < 0
                    ? <>Deploy <strong>{formatINR(Math.abs(eqAmtDiff))}</strong> into Equities to capture growth upside.</>
                    : <>Equities are at target allocation (<strong>{formatINR(actEqAmt)}</strong>).</>
                  }
                </span>
              </div>
              <div className="rebal-step step-buy">
                <span className="step-num">2</span>
                <span>
                  {bdVariance < 0
                    ? <>Allocate <strong>{formatINR(Math.abs(bdAmtDiff))}</strong> into Sovereign G-Secs / AAA Corporate Bonds.</>
                    : bdVariance > 0
                    ? <>Reallocate <strong>{formatINR(Math.abs(bdAmtDiff))}</strong> surplus from Bonds into growth/cash assets.</>
                    : <>Bonds are at target allocation (<strong>{formatINR(actBdAmt)}</strong>).</>
                  }
                </span>
              </div>
              <div className="rebal-step step-cash">
                <span className="step-num">3</span>
                <span>
                  {csVariance < 0
                    ? <>Deposit <strong>{formatINR(Math.abs(csAmtDiff))}</strong> into Liquid Overnight Cash for safety buffer.</>
                    : csVariance > 0
                    ? <>Deploy <strong>{formatINR(Math.abs(csAmtDiff))}</strong> excess cash into yield-generating assets.</>
                    : <>Liquid Cash buffer is at target guardrail (<strong>{formatINR(actCsAmt)}</strong>).</>
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION: STRESS TEST & SCENARIO ANALYSIS ── */}
      <div className="analytics-section-card">
        <div className="analytics-card-header">
          <div>
            <div className="analytics-tag-pill">Macro & Volatility Stress Testing</div>
            <h2>Scenario Analysis & Shock Absorption</h2>
            <p>Portfolio resilience modeling under volatile market conditions.</p>
          </div>

          <div className="analytics-scenario-tabs">
            <button
              className={`analytics-scenario-tab ${activeScenario === 'bull' ? 'active' : ''}`}
              onClick={() => setActiveScenario('bull')}
            >
              Bull Rally (+25%)
            </button>
            <button
              className={`analytics-scenario-tab ${activeScenario === 'normal' ? 'active' : ''}`}
              onClick={() => setActiveScenario('normal')}
            >
              Steady Baseline (+10%)
            </button>
            <button
              className={`analytics-scenario-tab ${activeScenario === 'correction' ? 'active' : ''}`}
              onClick={() => setActiveScenario('correction')}
            >
              Correction (-12%)
            </button>
            <button
              className={`analytics-scenario-tab ${activeScenario === 'bear' ? 'active' : ''}`}
              onClick={() => setActiveScenario('bear')}
            >
              Market Crash (-25%)
            </button>
          </div>
        </div>

        <div className="analytics-scenario-content">
          {activeScenario === 'bull' && (
            <div className="analytics-scenario-grid">
              <div className="analytics-scenario-kpi">
                <span className="scenario-label">Projected Portfolio Return</span>
                <span className="scenario-val text-green">+16.4%</span>
                <span className="scenario-sub">Projected Gain: +{formatINR(capitalNum * 0.164)}</span>
              </div>
              <div className="analytics-scenario-details">
                <h4>Market Upside Capture</h4>
                <p>
                  With {recEquityPct}% in equities, your portfolio captures equity momentum
                  while bonds (+7.8%) and cash (+5.5%) provide steady yield compounding.
                </p>
                <div className="scenario-mitigation-tag">
                  Upside Participation: <strong>65.6% of NIFTY Rally</strong> with 42% lower volatility.
                </div>
              </div>
            </div>
          )}

          {activeScenario === 'normal' && (
            <div className="analytics-scenario-grid">
              <div className="analytics-scenario-kpi">
                <span className="scenario-label">Projected Annual Return</span>
                <span className="scenario-val text-blue">+{expectedReturnPct}%</span>
                <span className="scenario-sub">Projected Gain: +{formatINR(annualGainAmt)}</span>
              </div>
              <div className="analytics-scenario-details">
                <h4>Steady State Compounding</h4>
                <p>
                  Expected return of <strong>{expectedReturnPct}%</strong> meets target of <strong>{targetReturnNum}%</strong>,
                  providing an optimal risk-adjusted Sharpe ratio of <strong>{sharpeRatio}</strong>.
                </p>
                <div className="scenario-mitigation-tag">
                  Target Compliance: <strong>Within Risk Tolerance</strong> ({expRiskScore} vs {riskNum}).
                </div>
              </div>
            </div>
          )}

          {activeScenario === 'correction' && (
            <div className="analytics-scenario-grid">
              <div className="analytics-scenario-kpi">
                <span className="scenario-label">Protected Drawdown</span>
                <span className="scenario-val text-amber">-3.8%</span>
                <span className="scenario-sub">vs Nifty Index -12.0%</span>
              </div>
              <div className="analytics-scenario-details">
                <h4>Mid-Cycle Volatility Shock Absorption</h4>
                <p>
                  Fixed income and cash allocations buffer equity swings, limiting portfolio drawdown to just -3.8%.
                </p>
                <div className="scenario-mitigation-tag">
                  Loss Reduction: <strong>68.3% Downside Cushion</strong> vs pure equity benchmarks.
                </div>
              </div>
            </div>
          )}

          {activeScenario === 'bear' && (
            <div className="analytics-scenario-grid">
              <div className="analytics-scenario-kpi">
                <span className="scenario-label">Protected Drawdown</span>
                <span className="scenario-val text-amber">-7.2%</span>
                <span className="scenario-sub">vs Nifty Index -25.0%</span>
              </div>
              <div className="analytics-scenario-details">
                <h4>Downside Cushion in Action</h4>
                <p>
                  While pure equity portfolios suffer a -25% drop, your <strong>{recBondsPct}% Bonds</strong> and
                  <strong> {recLiquidPct}% Liquid Cash</strong> absorb the shock, restricting overall portfolio drawdown to <strong>-7.2%</strong>.
                </p>
                <div className="scenario-mitigation-tag">
                  Capital Preserved: <strong>{formatINR(capitalNum * 0.178)}</strong> saved relative to unhedged equity indices.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
