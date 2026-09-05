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
      {selectedStock && (
        <div className="mkt-modal-backdrop" onClick={() => setSelectedStock(null)}>
          <div className="mkt-modal-card" onClick={e => e.stopPropagation()}>
            <div className="mkt-modal-head">
              <div>
                <div className="mkt-modal-sym-row">
                  <h2 className="mkt-modal-sym">{selectedStock.symbol}</h2>
                  <span className="mkt-modal-badge">{selectedStock.sector}</span>
                  <span className="mkt-modal-badge nse-badge">NSE LIVE</span>
                </div>
                <div className="mkt-modal-name">{selectedStock.name}</div>
              </div>
              <button className="mkt-modal-close" onClick={() => setSelectedStock(null)}>×</button>
            </div>

            {/* Price banner in modal */}
            <div className="mkt-modal-price-banner">
              <div>
                <div className="mkt-modal-price-big">
                  {formatRupees(selectedStock.price)}
                </div>
                <div className={`mkt-modal-chg-big ${selectedStock.change >= 0 ? 'up' : 'down'}`}>
                  {selectedStock.change >= 0 ? '▲ +' : '▼ '}
                  {selectedStock.change.toFixed(2)} ({selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePct.toFixed(2)}%) Today
                </div>
              </div>

              <div className="mkt-modal-trade-actions">
                <button 
                  className="mkt-buy-btn"
                  onClick={() => {
                    setTradeModal({ stock: selectedStock, type: 'BUY' })
                  }}
                >
                  Buy {selectedStock.symbol}
                </button>
                <button 
                  className="mkt-sell-btn"
                  onClick={() => {
                    setTradeModal({ stock: selectedStock, type: 'SELL' })
                  }}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Key Technicals Grid */}
            <div className="mkt-modal-stats-grid">
              <div className="mkt-stat-box">
                <span className="mkt-stat-box-lbl">Day High</span>
                <span className="mkt-stat-box-val">{formatRupees(selectedStock.dayHigh)}</span>
              </div>
              <div className="mkt-stat-box">
                <span className="mkt-stat-box-lbl">Day Low</span>
                <span className="mkt-stat-box-val">{formatRupees(selectedStock.dayLow)}</span>
              </div>
              <div className="mkt-stat-box">
                <span className="mkt-stat-box-lbl">52-Week High</span>
                <span className="mkt-stat-box-val">{formatRupees(selectedStock.week52High)}</span>
              </div>
              <div className="mkt-stat-box">
                <span className="mkt-stat-box-lbl">52-Week Low</span>
                <span className="mkt-stat-box-val">{formatRupees(selectedStock.week52Low)}</span>
              </div>
              <div className="mkt-stat-box">
                <span className="mkt-stat-box-lbl">Traded Volume</span>
                <span className="mkt-stat-box-val">{selectedStock.volume}</span>
              </div>
              <div className="mkt-stat-box">
                <span className="mkt-stat-box-lbl">Market Status</span>
                <span className="mkt-stat-box-val" style={{ color: '#34d399' }}>Live Trading</span>
              </div>
            </div>

            {/* Sparkline Expanded Preview */}
            <div className="mkt-chart-preview-box">
              <div className="mkt-chart-head">
                <span>5-Day Intraday Trend</span>
                <span style={{ color: selectedStock.change >= 0 ? '#34d399' : '#f87171' }}>
                  {selectedStock.change >= 0 ? 'Bullish' : 'Bearish'} Momentum
                </span>
              </div>
              <div className="mkt-chart-svg-wrap">
                {renderSparkline(selectedStock.sparkline, selectedStock.change >= 0)}
              </div>
            </div>
          </div>
        </div>
      )}

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
