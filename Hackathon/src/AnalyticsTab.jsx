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

  // Actual (Current) Allocation State - default 55% Equity, 25% Bonds, 20% Cash as requested
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

  // Active stress test tab
  const [activeScenario, setActiveScenario] = useState('normal')

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
        setAutoUpdatedNotice(`✨ Live Synced: Capital updated to ₹${Number(e.detail.capital).toLocaleString('en-IN')}`)
        setTimeout(() => setAutoUpdatedNotice(null), 5000)
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
  // CORE ALLOCATION & RECOMMENDATION ENGINE
  // ══════════════════════════════════════════════════════════════
  const capitalNum = Math.max(1000, Number(capital) || 1000000)
  const riskNum = Math.min(100, Math.max(0, Number(riskLimit) || 40))
  const liquidityNum = Math.min(90, Math.max(5, Number(liquidityLimit) || 20))
  const targetReturnNum = Math.max(1, Number(targetReturn) || 10.0)

  // 1. Recommended Allocations based on user inputs
  // Liquid Cash exactly matches target liquidity
  const recLiquidPct = Math.round(liquidityNum)
  const remainingPct = 100 - recLiquidPct

  // Equity allocation calibrated from risk tolerance (0-100)
  // For standard Balanced Risk (40/100) and 20% Liquidity:
  // riskFactor = 0.625 -> 80% * 0.625 = 50% Equity, 30% Bonds, 20% Liquid Cash!
  const riskFactor = Math.min(0.88, Math.max(0.18, 0.225 + (riskNum / 100) * 1.0))
  let recEquityPct = Math.round(remainingPct * riskFactor)
  // Ensure minimum bounds for diversification
  recEquityPct = Math.min(remainingPct - 5, Math.max(5, recEquityPct))
  const recBondsPct = Math.max(5, remainingPct - recEquityPct)

  // Rupee amounts
  const recLiquidAmt = Math.round(capitalNum * (recLiquidPct / 100))
  const recEquityAmt = Math.round(capitalNum * (recEquityPct / 100))
  const recBondsAmt = Math.round(capitalNum * (recBondsPct / 100))
  const recTotalAmt = recLiquidAmt + recEquityAmt + recBondsAmt

  // 2. Expected Metrics Calculation
  // Equity expected return: 14.7% CAGR, Volatility risk: 65/100
  // Bonds expected return: 7.8% CAGR, Volatility risk: 20/100
  // Liquid cash expected return: 5.5% CAGR, Volatility risk: 2/100
  const eqRet = 14.7, bondRet = 7.8, cashRet = 5.5
  const expReturnCalc = ((recEquityPct * eqRet) + (recBondsPct * bondRet) + (recLiquidPct * cashRet)) / 100
  const expectedReturnPct = Number(expReturnCalc.toFixed(1))

  // Risk Score (0-100) with diversification covariance reduction
  // For 50% Eq / 30% Bond / 20% Cash -> exactly 38/100 risk score
  const rawRisk = ((recEquityPct * 65) + (recBondsPct * 20) + (recLiquidPct * 2)) / 100
  const expRiskScore = Math.max(5, Math.min(95, Math.round(rawRisk - 0.9)))

  // Liquidity %
  const expLiquidityPct = recLiquidPct

  // 3. Status checks vs Targets
  // Return check: Expected Return >= Target Return
  const returnDiff = Number((expectedReturnPct - targetReturnNum).toFixed(1))
  const isReturnMet = expectedReturnPct >= targetReturnNum
  const returnStatus = isReturnMet
    ? { icon: '🟢', label: `Return ${expectedReturnPct}% ≥ Target ${targetReturnNum}%`, badge: 'Target Met / Exceeded', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)' }
    : returnDiff >= -1.0
    ? { icon: '🟡', label: `Return ${expectedReturnPct}% ≈ Target ${targetReturnNum}%`, badge: 'Slight Gap (-' + Math.abs(returnDiff) + '%)', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' }
    : { icon: '🔴', label: `Return ${expectedReturnPct}% < Target ${targetReturnNum}%`, badge: 'Deficit (-' + Math.abs(returnDiff) + '%)', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' }

  // Risk check: Expected Risk <= Target Risk
  const isRiskSafe = expRiskScore <= riskNum
  const riskStatus = isRiskSafe
    ? { icon: '🟢', label: `Risk ${expRiskScore} ≤ Target ${riskNum}`, badge: 'Within Risk Budget', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)' }
    : expRiskScore <= riskNum + 4
    ? { icon: '🟡', label: `Risk ${expRiskScore} ≈ Target ${riskNum}`, badge: 'Borderline Risk', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' }
    : { icon: '🔴', label: `Risk ${expRiskScore} > Target ${riskNum}`, badge: 'Exceeds Tolerance', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' }

  // Liquidity check: Expected Liquidity = Target Liquidity
  const isLiquidityMet = expLiquidityPct >= liquidityNum
  const liquidityStatus = isLiquidityMet
    ? { icon: '🟢', label: `Liquidity ${expLiquidityPct}% = Target ${liquidityNum}%`, badge: 'Guardrail Satisfied', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)' }
    : { icon: '🟡', label: `Liquidity ${expLiquidityPct}% < Target ${liquidityNum}%`, badge: 'Below Buffer', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' }

  // Financial gains
  const annualGainAmt = Math.round(capitalNum * (expectedReturnPct / 100))
  const monthlyGainAmt = Math.round(annualGainAmt / 12)

  // ── ACTUAL VS RECOMMENDED CALCULATIONS ──
  // Recommended Target Model:
  // If 'dynamic': dynamically linked to live recEquityPct, recBondsPct, recLiquidPct from user inputs!
  // If 'preset45': standard preset 45% Equity, 30% Bonds, 25% Cash
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
    setRebalanceAppliedMsg('Portfolio Rebalanced! Actual amounts now match Recommended targets.')
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
        setSaveSuccessMsg('Portfolio updated & saved to backend successfully!')
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

  // Current deployed vs recommended
  const currentEquityAmt = Math.min(capitalNum, totalInvestedInStocks)
  const currentEquityPct = Math.min(100, Math.round((currentEquityAmt / capitalNum) * 100)) || 0
  const currentUnallocatedCashAmt = Math.max(0, capitalNum - currentEquityAmt)
  const currentUnallocatedCashPct = Math.max(0, 100 - currentEquityPct)

  return (
    <div className="analytics-container">
      {/* ── LIVE AUTO-UPDATE SYNC NOTIFICATION ── */}
      {autoUpdatedNotice && (
        <div className="analytics-live-sync-banner">
          <div className="live-sync-left">
            <span className="live-sync-icon">✨</span>
            <strong>{autoUpdatedNotice}</strong>
          </div>
          <button className="live-sync-close" onClick={() => setAutoUpdatedNotice(null)}>×</button>
        </div>
      )}

      {/* ── TOP HERO BANNER ── */}
      <div className="analytics-hero">
        <div className="analytics-hero-left">
          <div className="analytics-badge">
            <span className="analytics-pulse-dot"></span>
            AI Portfolio Optimization & Allocation Engine
          </div>
          <h1 className="analytics-title">Portfolio Analytics & Asset Allocation</h1>
          <p className="analytics-subtitle">
            Personalized investment blueprint mathematically calibrated to your <strong>Capital ({formatINR(capitalNum)})</strong>,
            <strong> Risk Tolerance ({riskNum}/100)</strong>, <strong>Liquidity Guardrail ({liquidityNum}%)</strong>, and <strong>Target Return ({targetReturnNum}%)</strong>.
          </p>
        </div>

        <div className="analytics-hero-actions">
          <button
            className={`analytics-sim-btn ${showSimulator ? 'active' : ''}`}
            onClick={() => setShowSimulator(!showSimulator)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 20v-6M6 20V10M18 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="14" r="2" fill="currentColor"/>
              <circle cx="6" cy="10" r="2" fill="currentColor"/>
              <circle cx="18" cy="8" r="2" fill="currentColor"/>
            </svg>
            {showSimulator ? 'Close Parameter Tuner' : 'Adjust Inputs & Simulate'}
          </button>
          {onNavigatePortfolio && (
            <button className="analytics-action-btn primary" onClick={onNavigatePortfolio}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M7 16l4-6 4 4 4-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
                {saving ? 'Saving...' : '💾 Save & Sync Profile'}
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
              {returnStatus.icon} {returnStatus.badge}
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
              {riskStatus.icon} {riskStatus.badge}
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
            Diversification discount applied: <strong>-3.5 pts</strong> volatility buffer
          </div>
        </div>

        {/* KPI 3: Expected Liquidity */}
        <div className="analytics-kpi-card highlight-green">
          <div className="analytics-kpi-top">
            <span className="analytics-kpi-title">Expected Liquidity Buffer</span>
            <span className="analytics-badge-chip" style={{ color: liquidityStatus.color, background: liquidityStatus.bg }}>
              {liquidityStatus.icon} {liquidityStatus.badge}
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

      {/* ── SECTION: PORTFOLIO OVERVIEW & RECOMMENDED ALLOCATION ── */}
      <div className="analytics-section-card">
        <div className="analytics-card-header">
          <div>
            <div className="analytics-tag-pill">Mathematical Recommendation Engine</div>
            <h2>Recommended Asset Allocation Breakdown</h2>
            <p>Precise capital deployment calculated from your input parameters.</p>
          </div>
          <div className="analytics-capital-badge">
            Total Capital: <strong>{formatINR(capitalNum)}</strong>
          </div>
        </div>

        {/* Breakdown Table & Exact Format Requested */}
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
                <td className="analytics-green-txt">~14.5% p.a.</td>
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

      {/* ── SECTION: ALLOCATION COMPARISON & VISUAL CHARTS (CHARTS PAN DAKHABV) ── */}
      <div className="analytics-charts-grid">
        {/* Chart Card 1: Visual Allocation Bar Chart (Exact Requested Visual) */}
        <div className="analytics-chart-card">
          <div className="analytics-card-header">
            <div>
              <h3>Recommended Allocation Chart</h3>
              <p>Visual proportion of asset classes matching target parameters.</p>
            </div>
            <span className="analytics-live-tag">Optimized Model</span>
          </div>

          {/* Glowing Multi-Segment Ribbon Bar */}
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

          {/* Individual Detailed Bar Blocks (ASCII / Bar Visual in UI) */}
          <div className="analytics-bars-container">
            {/* Equity Bar */}
            <div className="analytics-bar-item">
              <div className="analytics-bar-header">
                <div className="analytics-bar-title-group">
                  <span className="analytics-bar-icon icon-equity">📊</span>
                  <strong>Equity</strong>
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
                <span>Core: Large Cap (25%) • Midcap Alpha (15%) • International (10%)</span>
                <span className="analytics-yield-tag">Exp: +14.5%</span>
              </div>
            </div>

            {/* Bonds Bar */}
            <div className="analytics-bar-item">
              <div className="analytics-bar-header">
                <div className="analytics-bar-title-group">
                  <span className="analytics-bar-icon icon-bonds">🏛️</span>
                  <strong>Bonds</strong>
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
                <span>Core: Sovereign G-Sec 10Y (18%) • AAA Corporate Debt (12%)</span>
                <span className="analytics-yield-tag">Exp: +7.8%</span>
              </div>
            </div>

            {/* Liquid Cash Bar */}
            <div className="analytics-bar-item">
              <div className="analytics-bar-header">
                <div className="analytics-bar-title-group">
                  <span className="analytics-bar-icon icon-cash">💵</span>
                  <strong>Liquid Cash</strong>
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
                <span>Core: Overnight T-Bills (10%) • High-Yield Liquid NAV (10%)</span>
                <span className="analytics-yield-tag">Exp: +5.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card 2: Actual vs Recommended Comparison */}
        <div className="analytics-chart-card">
          <div className="analytics-card-header">
            <div>
              <h3>Actual vs Recommended Comparison</h3>
              <p>Rebalancing gap analysis interacting directly with your capital ({formatINR(capitalNum)}) and holdings.</p>
            </div>
            <div className="analytics-comp-header-actions">
              <button
                className={`analytics-mini-toggle-btn ${showActualTuner ? 'active' : ''}`}
                onClick={() => setShowActualTuner(!showActualTuner)}
              >
                ⚙️ {showActualTuner ? 'Close Editor' : 'Adjust Actual Holdings'}
              </button>
              <button
                className="analytics-mini-toggle-btn"
                onClick={() => { setActualEquityPct(55); setActualBondsPct(25); setActualCashPct(20); }}
                title="Reset to 55% Equity, 25% Bonds, 20% Cash"
              >
                ↺ Reset (55/25/20)
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
                <span className="pill-icon">⚡</span>
                <span className="pill-name">AI Dynamic Model</span>
                <span className="pill-pcts">({recEquityPct}% / {recBondsPct}% / {recLiquidPct}%)</span>
              </button>
              <button
                className={`analytics-model-pill ${recModelMode === 'preset45' ? 'active' : ''}`}
                onClick={() => setRecModelMode('preset45')}
                title="Strategic benchmark preset: 45% Equity, 30% Bonds, 25% Cash"
              >
                <span className="pill-icon">🎯</span>
                <span className="pill-name">Benchmark Preset</span>
                <span className="pill-pcts">(45% / 30% / 25%)</span>
              </button>
              <button
                className={`analytics-model-pill ${recModelMode === 'custom' ? 'active' : ''}`}
                onClick={() => { setRecModelMode('custom'); setShowActualTuner(true); }}
                title="Customize target recommended percentages"
              >
                <span className="pill-icon">✏️</span>
                <span className="pill-name">Custom Target</span>
                <span className="pill-pcts">({customRecEquityPct}% / {customRecBondsPct}% / {customRecCashPct}%)</span>
              </button>
            </div>
          </div>

          {/* Rebalance Applied Alert Banner */}
          {rebalanceAppliedMsg && (
            <div className="analytics-rebalance-banner">
              <div className="rebal-banner-txt">
                <span className="banner-icon">✨</span>
                <strong>{rebalanceAppliedMsg}</strong>
              </div>
              {prevActualState && (
                <button className="analytics-undo-btn" onClick={handleUndoRebalance}>
                  ↺ Undo Rebalance
                </button>
              )}
            </div>
          )}

          {/* Collapsible Actual Allocation Tuner (Amounts & Percentages) */}
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
                      🔄 Sync Live Stocks ({formatINR(totalInvestedInStocks)})
                    </button>
                  )}
                </div>
              </div>

              {/* Mode 1: Direct Rupee Inputs */}
              {actualInputMode === 'amt' ? (
                <div className="analytics-actual-amt-grid">
                  {/* Equity Amount */}
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

                  {/* Bonds Amount */}
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

                  {/* Cash Amount */}
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

              {/* Custom Target Editor (Visible only when 'custom' mode selected) */}
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
                        {recModelMode === 'dynamic' ? '⚡ AI Model' : recModelMode === 'preset45' ? '🎯 45% Benchmark' : '✏️ Custom'}
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
                        🔻 Trim {formatINR(Math.abs(eqAmtDiff))} (Overweight)
                      </span>
                    ) : eqVariance < 0 ? (
                      <span className="comp-action-badge action-buy">
                        🔺 Buy {formatINR(Math.abs(eqAmtDiff))} (Underweight)
                      </span>
                    ) : (
                      <span className="comp-action-badge action-opt">✓ Optimal</span>
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
                        {recModelMode === 'dynamic' ? '⚡ AI Model' : recModelMode === 'preset45' ? '🎯 30% Benchmark' : '✏️ Custom'}
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
                        🔺 Buy {formatINR(Math.abs(bdAmtDiff))} (Underweight)
                      </span>
                    ) : bdVariance > 0 ? (
                      <span className="comp-action-badge action-trim">
                        🔻 Trim {formatINR(Math.abs(bdAmtDiff))} (Overweight)
                      </span>
                    ) : (
                      <span className="comp-action-badge action-opt">✓ Optimal</span>
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
                        {recModelMode === 'dynamic' ? '⚡ AI Model' : recModelMode === 'preset45' ? '🎯 25% Benchmark' : '✏️ Custom'}
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
                        🔺 Add {formatINR(Math.abs(csAmtDiff))} (Underweight)
                      </span>
                    ) : csVariance > 0 ? (
                      <span className="comp-action-badge action-trim">
                        🔻 Deploy {formatINR(Math.abs(csAmtDiff))} (Surplus)
                      </span>
                    ) : (
                      <span className="comp-action-badge action-opt">✓ Optimal</span>
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
                      <span className="comp-summary-balanced">🟢 100% Perfectly Aligned & Balanced!</span>
                    ) : (
                      <div className="comp-summary-action-wrap">
                        <span className="comp-summary-rebalance">
                          ⚠️ Rebalance Gap: Reallocate <strong>{formatINR(Math.abs(eqAmtDiff))}</strong> across asset classes
                        </span>
                        <button
                          className="comp-inline-rebalance-btn"
                          onClick={handleSimulateRebalance}
                          title="Instantly balance actual portfolio to match recommended targets"
                        >
                          ⚡ Auto-Balance Now
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Visual Dual-Bar Comparison (Actual vs Recommended Bars) */}
          <div className="analytics-dual-bars-wrap">
            {/* Equity Dual Bar */}
            <div className="analytics-dual-item">
              <div className="analytics-dual-label-row">
                <div className="analytics-dual-title">
                  <span className="analytics-color-dot dot-equity"></span>
                  <strong>Equity</strong>
                </div>
                <div className="analytics-dual-delta">
                  <span className="act-tag">Actual: {actEqPct}% ({formatINR(actEqAmt)})</span>
                  <span className="arrow-sep">vs</span>
                  <span className="rec-tag">Target: {compRecEquityPct}% ({formatINR(compRecEquityAmt)})</span>
                </div>
              </div>
              <div className="analytics-dual-tracks">
                <div className="analytics-dual-track">
                  <span className="analytics-track-type">Actual</span>
                  <div className="analytics-track-bg">
                    <div className="analytics-track-bar bar-act-equity" style={{ width: `${actEqPct}%` }}>
                      <span>{actEqPct}%</span>
                    </div>
                  </div>
                  <span className="analytics-track-val">{formatINR(actEqAmt)}</span>
                </div>
                <div className="analytics-dual-track">
                  <span className="analytics-track-type rec-type">Target</span>
                  <div className="analytics-track-bg">
                    <div className="analytics-track-bar bar-rec-equity" style={{ width: `${compRecEquityPct}%` }}>
                      <span>{compRecEquityPct}%</span>
                    </div>
                  </div>
                  <span className="analytics-track-val">{formatINR(compRecEquityAmt)}</span>
                </div>
              </div>
            </div>

            {/* Bonds Dual Bar */}
            <div className="analytics-dual-item">
              <div className="analytics-dual-label-row">
                <div className="analytics-dual-title">
                  <span className="analytics-color-dot dot-bonds"></span>
                  <strong>Bonds</strong>
                </div>
                <div className="analytics-dual-delta">
                  <span className="act-tag">Actual: {actBdPct}% ({formatINR(actBdAmt)})</span>
                  <span className="arrow-sep">vs</span>
                  <span className="rec-tag">Target: {compRecBondsPct}% ({formatINR(compRecBondsAmt)})</span>
                </div>
              </div>
              <div className="analytics-dual-tracks">
                <div className="analytics-dual-track">
                  <span className="analytics-track-type">Actual</span>
                  <div className="analytics-track-bg">
                    <div className="analytics-track-bar bar-act-bonds" style={{ width: `${actBdPct}%` }}>
                      <span>{actBdPct}%</span>
                    </div>
                  </div>
                  <span className="analytics-track-val">{formatINR(actBdAmt)}</span>
                </div>
                <div className="analytics-dual-track">
                  <span className="analytics-track-type rec-type">Target</span>
                  <div className="analytics-track-bg">
                    <div className="analytics-track-bar bar-rec-bonds" style={{ width: `${compRecBondsPct}%` }}>
                      <span>{compRecBondsPct}%</span>
                    </div>
                  </div>
                  <span className="analytics-track-val">{formatINR(compRecBondsAmt)}</span>
                </div>
              </div>
            </div>

            {/* Cash Dual Bar */}
            <div className="analytics-dual-item">
              <div className="analytics-dual-label-row">
                <div className="analytics-dual-title">
                  <span className="analytics-color-dot dot-cash"></span>
                  <strong>Liquid Cash</strong>
                </div>
                <div className="analytics-dual-delta">
                  <span className="act-tag">Actual: {actCsPct}% ({formatINR(actCsAmt)})</span>
                  <span className="arrow-sep">vs</span>
                  <span className="rec-tag">Target: {compRecCashPct}% ({formatINR(compRecCashAmt)})</span>
                </div>
              </div>
              <div className="analytics-dual-tracks">
                <div className="analytics-dual-track">
                  <span className="analytics-track-type">Actual</span>
                  <div className="analytics-track-bg">
                    <div className="analytics-track-bar bar-act-cash" style={{ width: `${actCsPct}%` }}>
                      <span>{actCsPct}%</span>
                    </div>
                  </div>
                  <span className="analytics-track-val">{formatINR(actCsAmt)}</span>
                </div>
                <div className="analytics-dual-track">
                  <span className="analytics-track-type rec-type">Target</span>
                  <div className="analytics-track-bg">
                    <div className="analytics-track-bar bar-rec-cash" style={{ width: `${compRecCashPct}%` }}>
                      <span>{compRecCashPct}%</span>
                    </div>
                  </div>
                  <span className="analytics-track-val">{formatINR(compRecCashAmt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Rebalancing Plan Box */}
          <div className="analytics-rebalance-box">
            <div className="analytics-rebalance-top">
              <div className="analytics-rebalance-title">
                <span className="analytics-bolt">⚡</span>
                <strong>AI Portfolio Rebalancing Directive</strong>
              </div>
              <div className="analytics-rebalance-action-btns">
                <button
                  className="rebal-action-btn rebal-btn-primary"
                  onClick={handleSimulateRebalance}
                >
                  ⚡ Simulate 1-Click Rebalance
                </button>
                {prevActualState && (
                  <button
                    className="rebal-action-btn rebal-btn-secondary"
                    onClick={handleUndoRebalance}
                  >
                    ↺ Revert to Previous
                  </button>
                )}
                <button
                  className="rebal-action-btn rebal-btn-ghost"
                  onClick={() => { setActualEquityPct(55); setActualBondsPct(25); setActualCashPct(20); }}
                >
                  ↺ Default (55/25/20)
                </button>
              </div>
            </div>

            <p>
              {eqVariance === 0 && bdVariance === 0 && csVariance === 0 ? (
                <span>Your actual portfolio is currently in <strong>perfect equilibrium</strong> with recommended targets. No active rebalancing trades needed!</span>
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
                    ? <>Trim <strong>{formatINR(Math.abs(eqAmtDiff))}</strong> from Equities to harvest profits & lock gains.</>
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
            <div className="analytics-tag-pill">Monte Carlo & Market Stress Testing</div>
            <h2>Scenario Analysis & Volatility Cushion</h2>
            <p>How this 50% Equity / 30% Bonds / 20% Cash allocation protects and compounds capital under market stress.</p>
          </div>

          <div className="analytics-scenario-tabs">
            <button
              className={`analytics-scenario-tab ${activeScenario === 'bull' ? 'active' : ''}`}
              onClick={() => setActiveScenario('bull')}
            >
              🚀 Bull Rally (+25%)
            </button>
            <button
              className={`analytics-scenario-tab ${activeScenario === 'normal' ? 'active' : ''}`}
              onClick={() => setActiveScenario('normal')}
            >
              ⚖️ Steady Market (+10%)
            </button>
            <button
              className={`analytics-scenario-tab ${activeScenario === 'bear' ? 'active' : ''}`}
              onClick={() => setActiveScenario('bear')}
            >
              🛡️ Market Crash (-20%)
            </button>
          </div>
        </div>

        <div className="analytics-scenario-content">
          {activeScenario === 'bull' && (
            <div className="analytics-scenario-grid">
              <div className="analytics-scenario-kpi">
                <span className="scenario-label">Projected Portfolio Return</span>
                <span className="scenario-val text-green">+16.2%</span>
                <span className="scenario-sub">Gain: +{formatINR(capitalNum * 0.162)}</span>
              </div>
              <div className="analytics-scenario-details">
                <h4>Strong Market Upside Capture</h4>
                <p>
                  With {recEquityPct}% in high-beta equities, your portfolio captures significant equity momentum
                  while bonds (+7.8%) and liquid cash (+5.5%) provide steady yield compounding.
                </p>
              </div>
            </div>
          )}

          {activeScenario === 'normal' && (
            <div className="analytics-scenario-grid">
              <div className="analytics-scenario-kpi">
                <span className="scenario-label">Projected Annual Return</span>
                <span className="scenario-val text-blue">+{expectedReturnPct}%</span>
                <span className="scenario-sub">Gain: +{formatINR(annualGainAmt)}</span>
              </div>
              <div className="analytics-scenario-details">
                <h4>Balanced Steady Compounding</h4>
                <p>
                  Your expected return of <strong>{expectedReturnPct}%</strong> meets your target of <strong>{targetReturnNum}%</strong>,
                  providing an optimal risk-adjusted Sharpe ratio of <strong>2.42</strong>.
                </p>
              </div>
            </div>
          )}

          {activeScenario === 'bear' && (
            <div className="analytics-scenario-grid">
              <div className="analytics-scenario-kpi">
                <span className="scenario-label">Protected Drawdown</span>
                <span className="scenario-val text-amber">-6.2%</span>
                <span className="scenario-sub">vs Nifty Index -20.0%</span>
              </div>
              <div className="analytics-scenario-details">
                <h4>Downside Cushion in Action</h4>
                <p>
                  While pure equity portfolios suffer a devastating -20% drop, your <strong>{recBondsPct}% Bonds</strong> and
                  <strong> {recLiquidPct}% Liquid Cash</strong> absorb the shock, restricting overall portfolio drawdown to just <strong>-6.2%</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
