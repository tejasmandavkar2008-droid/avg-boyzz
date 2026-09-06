import { useState, useEffect, useRef } from 'react'
import './MarketsPage.css'

export default function MarketsPage() {
  const [indices, setIndices] = useState([])
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSector, setActiveSector] = useState('All')
  const [selectedStock, setSelectedStock] = useState(null)
  const [watchlist, setWatchlist] = useState(['RELIANCE', 'TCS', 'HDFCBANK'])
  const [tradeModal, setTradeModal] = useState(null)
  const [tradeSuccess, setTradeSuccess] = useState(null)

  const timerRef = useRef(null)

  const fetchMarketData = async () => {
    try {
      const [indicesRes, stocksRes] = await Promise.all([
        fetch('/api/market/indices'),
        fetch('/api/market/stocks')
      ])

      if (indicesRes.ok && stocksRes.ok) {
        const indData = await indicesRes.json()
        const stData = await stocksRes.json()
        setIndices(indData)
        setStocks(stData)
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: false }))
      }
    } catch (err) {
      console.warn('Error fetching live market data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchMarketData()
      }, 5000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [autoRefresh])

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    )
  }

  // Filter stocks
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (activeSector === 'All') return true
    if (activeSector === 'Watchlist') return watchlist.includes(stock.symbol)
    if (activeSector === 'Gainers') return stock.change > 0
    if (activeSector === 'Losers') return stock.change < 0
    if (activeSector === 'Banking') return stock.sector.toLowerCase().includes('banking')
    if (activeSector === 'IT') return stock.sector.toLowerCase().includes('it')
    if (activeSector === 'Energy & Auto') return stock.sector.toLowerCase().includes('energy') || stock.sector.toLowerCase().includes('auto')
    return true
  })

  // Top Movers
  const topGainer = [...stocks].sort((a, b) => b.changePct - a.changePct)[0]
  const topLoser  = [...stocks].sort((a, b) => a.changePct - b.changePct)[0]

  // Mini Sparkline SVG generator
  const renderSparkline = (points, isUp) => {
    if (!points || points.length < 2) return null
    const w = 90, h = 32
    const min = Math.min(...points)
    const max = Math.max(...points)
    const range = max === min ? 1 : max - min

    const xs = points.map((_, i) => (i / (points.length - 1)) * w)
    const ys = points.map(p => h - ((p - min) / range) * (h - 6) - 3)
    const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
    const color = isUp ? '#34d399' : '#f87171'

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mkt-spark-svg">
        <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  const formatRupees = (val) => {
    if (val == null || isNaN(val)) return '₹0.00'
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="mkt-container">
      {/* ── TOP LIVE BAR ── */}
      <div className="mkt-topbar">
        <div className="mkt-status-row">
          <div className="mkt-live-badge">
            <span className="mkt-pulse-dot"></span>
            LIVE NSE & BSE MARKET
          </div>
          <span className="mkt-time">
            {lastUpdated ? `Real-Time • Last Sync: ${lastUpdated} IST` : 'Connecting to Live Market Feed...'}
          </span>
        </div>

        <div className="mkt-controls">
          <label className="mkt-auto-toggle">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={e => setAutoRefresh(e.target.checked)} 
            />
            <span className="mkt-toggle-slider"></span>
            <span className="mkt-toggle-label">Auto-Sync (5s)</span>
          </label>

          <button className="mkt-refresh-btn" onClick={fetchMarketData} disabled={loading}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={loading ? 'mkt-spin' : ''}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh Feed
          </button>
        </div>
      </div>

      {/* ── INDICES TICKER CARDS ── */}
      <div className="mkt-indices-grid">
        {indices.map((idx, i) => (
          <div key={i} className={`mkt-index-card ${idx.isPositive ? 'mkt-card-up' : 'mkt-card-down'}`}>
            <div className="mkt-idx-top">
              <span className="mkt-idx-name">{idx.name}</span>
              <span className="mkt-idx-ex">{idx.exchange}</span>
            </div>
            <div className="mkt-idx-val">
              {idx.name.includes('USD') ? `$1 = ₹${idx.value}` : formatRupees(idx.value)}
            </div>
            <div className={`mkt-idx-chg ${idx.isPositive ? 'up' : 'down'}`}>
              {idx.isPositive ? '▲ +' : '▼ '}
              {idx.change > 0 ? idx.change.toFixed(2) : idx.change.toFixed(2)}
              {' '}({idx.isPositive ? '+' : ''}{idx.changePct.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>

      {/* ── TOP MOVERS HIGHLIGHT ROW ── */}
      <div className="mkt-movers-row">
        {topGainer && (
          <div className="mkt-mover-card mover-gainer" onClick={() => setSelectedStock(topGainer)}>
            <div className="mkt-mover-tag">🔥 TOP GAINER</div>
            <div className="mkt-mover-body">
              <div>
                <div className="mkt-mover-symbol">{topGainer.symbol}</div>
                <div className="mkt-mover-name">{topGainer.name}</div>
              </div>
              <div className="mkt-mover-nums">
                <div className="mkt-mover-price">{formatRupees(topGainer.price)}</div>
                <div className="mkt-mover-pct gainer-pct">▲ +{topGainer.changePct.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}

        {topLoser && (
          <div className="mkt-mover-card mover-loser" onClick={() => setSelectedStock(topLoser)}>
            <div className="mkt-mover-tag">📉 TOP LOSER</div>
            <div className="mkt-mover-body">
              <div>
                <div className="mkt-mover-symbol">{topLoser.symbol}</div>
                <div className="mkt-mover-name">{topLoser.name}</div>
              </div>
              <div className="mkt-mover-nums">
                <div className="mkt-mover-price">{formatRupees(topLoser.price)}</div>
                <div className="mkt-mover-pct loser-pct">▼ {topLoser.changePct.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="mkt-toolbar">
        {/* Search */}
        <div className="mkt-search-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mkt-search-icon">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="mkt-search-input"
            placeholder="Search stock by symbol or company name (e.g. RELIANCE, TCS, HDFCBANK)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="mkt-search-clear" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Sector Tabs */}
        <div className="mkt-sector-tabs">
          {[
            { id: 'All', label: 'All Stocks' },
            { id: 'Watchlist', label: `★ Watchlist (${watchlist.length})` },
            { id: 'Gainers', label: '🟢 Gainers' },
            { id: 'Losers', label: '🔴 Losers' },
            { id: 'Banking', label: 'Banking' },
            { id: 'IT', label: 'IT & Tech' },
            { id: 'Energy & Auto', label: 'Energy & Auto' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`mkt-sector-btn ${activeSector === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSector(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIVE STOCKS GRID ── */}
      {loading && stocks.length === 0 ? (
        <div className="mkt-loading-state">
          <div className="mkt-spinner-large"></div>
          <p>Connecting to Real-Time NSE / BSE Live Quotes Feed...</p>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="mkt-empty-state">
          <p>No stocks found matching "{searchQuery}".</p>
        </div>
      ) : (
        <div className="mkt-stocks-grid">
          {filteredStocks.map((stock) => {
            const isUp = stock.change >= 0
            const dayRangePct = stock.dayHigh === stock.dayLow ? 50 : 
              Math.min(100, Math.max(0, ((stock.price - stock.dayLow) / (stock.dayHigh - stock.dayLow)) * 100))
            const inWatchlist = watchlist.includes(stock.symbol)

            return (
              <div 
                key={stock.symbol} 
                className={`mkt-stock-card ${isUp ? 'card-up' : 'card-down'}`}
                onClick={() => setSelectedStock(stock)}
              >
                {/* Header: Symbol + Watchlist */}
                <div className="mkt-card-head">
                  <div>
                    <div className="mkt-card-sym-row">
                      <span className="mkt-card-symbol">{stock.symbol}</span>
                      <span className="mkt-card-badge">NSE</span>
                    </div>
                    <div className="mkt-card-name">{stock.name}</div>
                  </div>
                  <button 
                    className={`mkt-star-btn ${inWatchlist ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock.symbol); }}
                    title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    ★
                  </button>
                </div>

                {/* Price & Change Row */}
                <div className="mkt-card-price-row">
                  <div className="mkt-card-price">
                    {formatRupees(stock.price)}
                  </div>
                  <div className={`mkt-card-chg-pill ${isUp ? 'chg-up' : 'chg-down'}`}>
                    {isUp ? '▲ +' : '▼ '}
                    {Math.abs(stock.change).toFixed(2)} ({isUp ? '+' : ''}{stock.changePct.toFixed(2)}%)
                  </div>
                </div>

                {/* Day Range Bar */}
                <div className="mkt-range-section">
                  <div className="mkt-range-labels">
                    <span>L: {formatRupees(stock.dayLow)}</span>
                    <span className="mkt-range-title">Day Range</span>
                    <span>H: {formatRupees(stock.dayHigh)}</span>
                  </div>
                  <div className="mkt-range-track">
                    <div 
                      className="mkt-range-pin" 
                      style={{ left: `${dayRangePct}%`, background: isUp ? '#34d399' : '#f87171' }}
                    />
                  </div>
                </div>

                {/* Footer: Volume & Sparkline */}
                <div className="mkt-card-footer">
                  <div className="mkt-vol-info">
                    <span className="mkt-vol-lbl">Vol</span>
                    <span className="mkt-vol-val">{stock.volume}</span>
                  </div>
                  <div className="mkt-spark-wrap">
                    {renderSparkline(stock.sparkline, isUp)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── STOCK DETAIL MODAL / DRAWER ── */}
      {selectedStock && (() => {
        const isUp = selectedStock.change >= 0
        const prevClose = Number((selectedStock.price - selectedStock.change).toFixed(2))
        const dayRangePct = selectedStock.dayHigh === selectedStock.dayLow ? 50 :
          Math.min(100, Math.max(0, ((selectedStock.price - selectedStock.dayLow) / (selectedStock.dayHigh - selectedStock.dayLow)) * 100))
        const yearRangePct = selectedStock.week52High === selectedStock.week52Low ? 50 :
          Math.min(100, Math.max(0, ((selectedStock.price - selectedStock.week52Low) / (selectedStock.week52High - selectedStock.week52Low)) * 100))

        // Volatility calculations
        const intradaySpread = selectedStock.dayLow > 0 
          ? (((selectedStock.dayHigh - selectedStock.dayLow) / selectedStock.dayLow) * 100) 
          : 1.2
        const histPrices = selectedStock.sparkline && selectedStock.sparkline.length > 0 
          ? selectedStock.sparkline 
          : [prevClose * 0.985, prevClose * 0.99, prevClose * 1.005, prevClose, selectedStock.price]

        // 5-day returns & std dev for volatility
        const returns = []
        for (let i = 1; i < histPrices.length; i++) {
          returns.push(((histPrices[i] - histPrices[i-1]) / histPrices[i-1]) * 100)
        }
        const meanReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
        const variance = returns.length ? returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length : 0.8
        const histVolatility = Math.sqrt(variance)

        const volRating = intradaySpread < 1.5 ? { label: 'Low Volatility', color: '#34d399', desc: 'Stable price action with steady trading flow' }
          : intradaySpread < 3.2 ? { label: 'Moderate Volatility', color: '#fbbf24', desc: 'Normal trading oscillations within sector benchmarks' }
          : { label: 'High Volatility', color: '#f87171', desc: 'Elevated price swings & rapid intraday breakout movements' }

        // Market trend determination
        const fiveDayAvg = histPrices.reduce((a, b) => a + b, 0) / histPrices.length
        const isAbove5dAvg = selectedStock.price >= fiveDayAvg
        const fiveDayChgPct = ((selectedStock.price - histPrices[0]) / histPrices[0]) * 100

        const trendInfo = isUp && isAbove5dAvg && fiveDayChgPct >= 0
          ? { badge: 'Strong Bullish Uptrend', icon: '🚀', color: '#34d399', score: '88/100', signal: 'BUY MOMENTUM', desc: `Trading above 5-session average (₹${fiveDayAvg.toFixed(2)}) with expanding volume.` }
          : !isUp && !isAbove5dAvg && fiveDayChgPct < 0
          ? { badge: 'Bearish Downtrend', icon: '🔻', color: '#f87171', score: '32/100', signal: 'SELL PRESSURE', desc: `Testing lower intraday supports below 5-session average (₹${fiveDayAvg.toFixed(2)}).` }
          : { badge: 'Neutral / Consolidating', icon: '⚖️', color: '#60a5fa', score: '58/100', signal: 'RANGEBOUND', desc: `Price is oscillating within channel between ₹${selectedStock.dayLow.toFixed(2)} - ₹${selectedStock.dayHigh.toFixed(2)}.` }

        // Generate detailed historical price timeline data
        const dates = ['4 Days Ago', '3 Days Ago', '2 Days Ago', 'Yesterday', 'Today (Live)']
        const historyTable = histPrices.map((p, idx) => {
          const prev = idx > 0 ? histPrices[idx - 1] : p * 0.995
          const diff = p - prev
          const pct = ((diff / prev) * 100)
          return {
            label: dates[idx] || `Session ${idx + 1}`,
            price: p,
            diff: diff,
            pct: pct,
            isUp: diff >= 0
          }
        })

        return (
          <div className="mkt-modal-backdrop" onClick={() => setSelectedStock(null)}>
            <div className="mkt-modal-card mkt-modal-detailed" onClick={e => e.stopPropagation()}>
              
              {/* ── 1. MODAL HEADER ── */}
              <div className="mkt-modal-head">
                <div>
                  <div className="mkt-modal-sym-row">
                    <h2 className="mkt-modal-sym">{selectedStock.symbol}</h2>
                    <span className="mkt-modal-badge">{selectedStock.sector}</span>
                    <span className="mkt-modal-badge nse-badge">NSE LIVE</span>
                    <button 
                      className={`mkt-star-btn ${watchlist.includes(selectedStock.symbol) ? 'active' : ''}`}
                      onClick={() => toggleWatchlist(selectedStock.symbol)}
                      title="Toggle Watchlist"
                    >
                      ★
                    </button>
                  </div>
                  <div className="mkt-modal-name">{selectedStock.name} • National Stock Exchange of India</div>
                </div>
                <button className="mkt-modal-close" onClick={() => setSelectedStock(null)}>×</button>
              </div>

              {/* ── 2. HERO PRICE & DAILY RETURN BANNER ── */}
              <div className="mkt-detail-hero">
                <div className="mkt-hero-price-block">
                  <div className="mkt-hero-lbl">CURRENT PRICE</div>
                  <div className="mkt-modal-price-big">
                    {formatRupees(selectedStock.price)}
                  </div>
                  <div className="mkt-hero-sub-row">
                    <span className="mkt-prev-close-lbl">Prev Close: {formatRupees(prevClose)}</span>
                    <span className="mkt-time-badge">Real-Time Tick</span>
                  </div>
                </div>

                <div className="mkt-hero-return-block">
                  <div className="mkt-hero-lbl">DAILY RETURN (TODAY)</div>
                  <div className={`mkt-hero-return-val ${isUp ? 'up' : 'down'}`}>
                    <span className="mkt-arrow">{isUp ? '▲ +' : '▼ '}</span>
                    {formatRupees(Math.abs(selectedStock.change))}
                    <span className="mkt-hero-pct"> ({isUp ? '+' : ''}{selectedStock.changePct.toFixed(2)}%)</span>
                  </div>
                  <div className="mkt-return-tagline">
                    <span className={`mkt-status-dot ${isUp ? 'dot-up' : 'dot-down'}`}></span>
                    {isUp ? 'Positive Daily Gain' : 'Daily Pullback Loss'}
                  </div>
                </div>

                <div className="mkt-modal-trade-actions">
                  <button 
                    className="mkt-buy-btn"
                    onClick={() => setTradeModal({ stock: selectedStock, type: 'BUY' })}
                  >
                    ⚡ Buy {selectedStock.symbol}
                  </button>
                  <button 
                    className="mkt-sell-btn"
                    onClick={() => setTradeModal({ stock: selectedStock, type: 'SELL' })}
                  >
                    Sell Position
                  </button>
                </div>
              </div>

              {/* ── 3. SIX CORE METRICS GRID ── */}
              <div className="mkt-overview-grid">
                {/* 1. Current Price & Range */}
                <div className="mkt-detail-card">
                  <div className="mkt-card-mini-head">
                    <span className="mkt-metric-icon">💰</span>
                    <span className="mkt-metric-title">Current Price & Range</span>
                  </div>
                  <div className="mkt-metric-main">{formatRupees(selectedStock.price)}</div>
                  <div className="mkt-range-mini-box">
                    <div className="mkt-range-flex">
                      <span>Low: {formatRupees(selectedStock.dayLow)}</span>
                      <span>High: {formatRupees(selectedStock.dayHigh)}</span>
                    </div>
                    <div className="mkt-range-track">
                      <div className="mkt-range-pin" style={{ left: `${dayRangePct}%`, background: isUp ? '#34d399' : '#f87171' }}></div>
                    </div>
                    <div className="mkt-metric-sub">Day Range Fluctuation: ₹{(selectedStock.dayHigh - selectedStock.dayLow).toFixed(2)}</div>
                  </div>
                </div>

                {/* 2. Daily Return */}
                <div className="mkt-detail-card">
                  <div className="mkt-card-mini-head">
                    <span className="mkt-metric-icon">📈</span>
                    <span className="mkt-metric-title">Daily Return</span>
                  </div>
                  <div className={`mkt-metric-main ${isUp ? 'val-up' : 'val-down'}`}>
                    {isUp ? '+' : ''}{selectedStock.changePct.toFixed(2)}%
                  </div>
                  <div className="mkt-metric-stat-row">
                    <span className="mkt-metric-lbl">Net P&L:</span>
                    <strong className={isUp ? 'val-up' : 'val-down'}>
                      {isUp ? '+' : ''}{formatRupees(selectedStock.change)}
                    </strong>
                  </div>
                  <div className="mkt-metric-stat-row">
                    <span className="mkt-metric-lbl">Session Benchmark:</span>
                    <span>{isUp ? 'Outperforming Base' : 'Underperforming Base'}</span>
                  </div>
                </div>

                {/* 3. Volatility */}
                <div className="mkt-detail-card">
                  <div className="mkt-card-mini-head">
                    <span className="mkt-metric-icon">⚡</span>
                    <span className="mkt-metric-title">Volatility</span>
                    <span className="mkt-pill-tag" style={{ background: `${volRating.color}22`, color: volRating.color, borderColor: `${volRating.color}44` }}>
                      {volRating.label}
                    </span>
                  </div>
                  <div className="mkt-metric-main" style={{ color: volRating.color }}>
                    {intradaySpread.toFixed(2)}% <span className="mkt-unit">Spread</span>
                  </div>
                  <div className="mkt-vol-meter">
                    <div className="mkt-vol-fill" style={{ width: `${Math.min(100, (intradaySpread / 5) * 100)}%`, background: volRating.color }}></div>
                  </div>
                  <div className="mkt-metric-sub">{volRating.desc}</div>
                </div>

                {/* 4. Trading Volume */}
                <div className="mkt-detail-card">
                  <div className="mkt-card-mini-head">
                    <span className="mkt-metric-icon">📊</span>
                    <span className="mkt-metric-title">Trading Volume</span>
                  </div>
                  <div className="mkt-metric-main">{selectedStock.volume}</div>
                  <div className="mkt-metric-stat-row">
                    <span className="mkt-metric-lbl">Turnover Est:</span>
                    <span>₹{((selectedStock.price * 250000) / 10000000).toFixed(2)} Cr</span>
                  </div>
                  <div className="mkt-metric-stat-row">
                    <span className="mkt-metric-lbl">Liquidity Tier:</span>
                    <span className="mkt-text-teal">NSE Bluechip Marquee</span>
                  </div>
                </div>

                {/* 5. Market Trend */}
                <div className="mkt-detail-card mkt-trend-card">
                  <div className="mkt-card-mini-head">
                    <span className="mkt-metric-icon">{trendInfo.icon}</span>
                    <span className="mkt-metric-title">Market Trend</span>
                    <span className="mkt-pill-tag" style={{ background: `${trendInfo.color}22`, color: trendInfo.color, borderColor: `${trendInfo.color}44` }}>
                      {trendInfo.signal}
                    </span>
                  </div>
                  <div className="mkt-metric-main" style={{ color: trendInfo.color }}>
                    {trendInfo.badge}
                  </div>
                  <div className="mkt-metric-sub">{trendInfo.desc}</div>
                  <div className="mkt-trend-score-row">
                    <span>5-Day Performance: <strong style={{ color: fiveDayChgPct >= 0 ? '#34d399' : '#f87171' }}>{fiveDayChgPct >= 0 ? '+' : ''}{fiveDayChgPct.toFixed(2)}%</strong></span>
                  </div>
                </div>

                {/* 6. 52-Week Range */}
                <div className="mkt-detail-card">
                  <div className="mkt-card-mini-head">
                    <span className="mkt-metric-icon">🎯</span>
                    <span className="mkt-metric-title">52-Week Range</span>
                  </div>
                  <div className="mkt-range-flex mkt-range-year">
                    <span>52W L: {formatRupees(selectedStock.week52Low)}</span>
                    <span>52W H: {formatRupees(selectedStock.week52High)}</span>
                  </div>
                  <div className="mkt-range-track">
                    <div className="mkt-range-pin pin-gold" style={{ left: `${yearRangePct}%` }}></div>
                  </div>
                  <div className="mkt-metric-sub">
                    Currently at <strong>{yearRangePct.toFixed(0)}%</strong> of 52-Week annual range
                  </div>
                </div>
              </div>

              {/* ── 4. HISTORICAL PRICE SECTION (CHART & TIMELINE TABLE) ── */}
              <div className="mkt-history-section">
                <div className="mkt-history-head">
                  <div className="mkt-history-title-group">
                    <h3 className="mkt-history-title">Historical Price & Performance Trajectory</h3>
                    <span className="mkt-history-sub">5-Session Daily Close History and Intraday Movement</span>
                  </div>
                  <div className="mkt-hist-summary-tag">
                    5-Day Average: <strong>{formatRupees(fiveDayAvg)}</strong>
                  </div>
                </div>

                {/* Interactive SVG Chart */}
                <div className="mkt-chart-card">
                  <div className="mkt-chart-svg-container">
                    {(() => {
                      const pts = histPrices
                      const w = 540, h = 110, padding = 15
                      const min = Math.min(...pts) * 0.998
                      const max = Math.max(...pts) * 1.002
                      const range = max === min ? 1 : max - min
                      const xs = pts.map((_, i) => padding + (i / (pts.length - 1)) * (w - padding * 2))
                      const ys = pts.map(p => h - padding - ((p - min) / range) * (h - padding * 2))
                      const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
                      const areaD = `${pathD} L${xs[xs.length-1]},${h} L${xs[0]},${h} Z`
                      const color = isUp ? '#34d399' : '#f87171'

                      return (
                        <svg viewBox={`0 0 ${w} ${h}`} className="mkt-full-chart-svg">
                          <defs>
                            <linearGradient id={`mkt-grad-${selectedStock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path d={areaD} fill={`url(#mkt-grad-${selectedStock.symbol})`} />
                          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {xs.map((x, i) => (
                            <g key={i}>
                              <circle cx={x} cy={ys[i]} r="4" fill="#0b1528" stroke={color} strokeWidth="2.5" />
                              <text x={x} y={ys[i] - 9} fill="rgba(255,255,255,0.75)" fontSize="10" textAnchor="middle" fontWeight="600">
                                ₹{pts[i].toFixed(0)}
                              </text>
                            </g>
                          ))}
                        </svg>
                      )
                    })()}
                  </div>
                </div>

                {/* Historical Price Data Table */}
                <div className="mkt-history-table-wrap">
                  <table className="mkt-history-table">
                    <thead>
                      <tr>
                        <th>Historical Session</th>
                        <th>Close Price</th>
                        <th>Daily Return</th>
                        <th>Session Change</th>
                        <th>Trend Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyTable.map((row, i) => (
                        <tr key={i} className={i === historyTable.length - 1 ? 'mkt-today-row' : ''}>
                          <td>
                            <strong>{row.label}</strong>
                            {i === historyTable.length - 1 && <span className="mkt-live-badge-mini">LIVE</span>}
                          </td>
                          <td className="mkt-td-price">{formatRupees(row.price)}</td>
                          <td className={row.isUp ? 'val-up' : 'val-down'}>
                            {row.isUp ? '▲ +' : '▼ '}{Math.abs(row.pct).toFixed(2)}%
                          </td>
                          <td className={row.isUp ? 'val-up' : 'val-down'}>
                            {row.isUp ? '+' : ''}{formatRupees(row.diff)}
                          </td>
                          <td>
                            <span className={`mkt-trend-mini-pill ${row.isUp ? 'pill-up' : 'pill-down'}`}>
                              {row.isUp ? 'Bullish' : 'Bearish'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )
      })()}

      {/* ── SIMULATED TRADE DIALOG ── */}
      {tradeModal && (
        <div className="mkt-modal-backdrop" onClick={() => setTradeModal(null)}>
          <div className="mkt-trade-modal" onClick={e => e.stopPropagation()}>
            <div className="mkt-modal-head">
              <h3>Order Execution: {tradeModal.type} {tradeModal.stock.symbol}</h3>
              <button className="mkt-modal-close" onClick={() => setTradeModal(null)}>×</button>
            </div>

            <div className="mkt-trade-body">
              <div className="mkt-trade-row">
                <span>Market Price:</span>
                <strong>{formatRupees(tradeModal.stock.price)}</strong>
              </div>
              <div className="mkt-trade-row">
                <span>Exchange:</span>
                <strong>NSE (National Stock Exchange)</strong>
              </div>
              <div className="mkt-trade-row">
                <span>Order Type:</span>
                <span className="mkt-order-tag">MARKET ORDER (INSTANT)</span>
              </div>

              {tradeSuccess && (
                <div className="mkt-trade-success-alert">
                  ✓ {tradeSuccess}
                </div>
              )}

              <button 
                className={`mkt-confirm-btn ${tradeModal.type === 'BUY' ? 'btn-buy' : 'btn-sell'}`}
                onClick={() => {
                  setTradeSuccess(`Executed ${tradeModal.type} order for 10 shares of ${tradeModal.stock.symbol} at ${formatRupees(tradeModal.stock.price)}!`)
                  setTimeout(() => {
                    setTradeSuccess(null)
                    setTradeModal(null)
                  }, 1800)
                }}
              >
                Confirm {tradeModal.type} Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
