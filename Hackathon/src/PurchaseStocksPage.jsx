import { useState, useEffect } from 'react'
import { formatINR, formatINRShorthand } from './PortfolioPanel'
import './PurchaseStocksPage.css'

export default function PurchaseStocksPage({ user }) {
  const [stocks, setStocks] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE')
  const [quantity, setQuantity] = useState(10)
  const [orderType, setOrderType] = useState('MARKET')
  const [ordersData, setOrdersData] = useState({
    availableCash: 500000,
    totalCapital: 500000,
    totalInvestedInStocks: 0,
    orders: [],
    holdings: []
  })

  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [sellModal, setSellModal] = useState(null)
  const [sellQty, setSellQty] = useState(1)

  const userEmail = user?.email || 'guest'

  // Fetch live stocks from Yahoo Finance feed
  const loadMarketStocks = async () => {
    try {
      const res = await fetch('/api/market/stocks')
      if (res.ok) {
        const data = await res.json()
        setStocks(data)
      }
    } catch (err) {
      console.warn('Error fetching live stocks:', err)
    }
  }

  // Fetch user orders, active holdings, and available cash
  const loadUserOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders?email=${encodeURIComponent(userEmail)}`)
      if (res.ok) {
        const data = await res.json()
        setOrdersData(data)
      }
    } catch (err) {
      console.warn('Error fetching user orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarketStocks()
    loadUserOrders()
    const interval = setInterval(() => {
      loadMarketStocks()
    }, 8000)
    return () => clearInterval(interval)
  }, [userEmail])

  // Current selected stock object
  const currentStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0] || {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    price: 1322.00,
    change: 45.00,
    changePct: 3.52,
    dayHigh: 1333.00,
    dayLow: 1304.10,
    sector: 'Energy & Conglomerate'
  }

  const livePrice = Number(currentStock.price) || 1000
  const qtyNum = Math.max(1, parseInt(quantity) || 1)
  const grossTotal = Math.round(qtyNum * livePrice * 100) / 100
  const brokerage = 20.00
  const sttLevy = Math.round(grossTotal * 0.001 * 100) / 100
  const netTotalPayable = Math.round((grossTotal + brokerage + sttLevy) * 100) / 100

  const availableCash = ordersData.availableCash || 0
  const hasEnoughFunds = availableCash >= netTotalPayable

  // Quick preset button for maximum affordable shares
  const handleMaxAffordable = () => {
    if (availableCash <= 0 || livePrice <= 0) return
    const maxQty = Math.floor(availableCash / livePrice)
    setQuantity(Math.max(1, maxQty))
  }

  // Execute Buy Order
  const handleBuy = async (e) => {
    e.preventDefault()
    if (qtyNum <= 0) return

    setActionLoading(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/orders/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          symbol: currentStock.symbol,
          stockName: currentStock.name,
          quantity: qtyNum,
          price: livePrice
        })
      })

      const data = await res.json()
      if (res.ok) {
        setFeedback({ type: 'success', message: data.message })
        loadUserOrders()
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to execute buy order.' })
      }
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', message: 'Network error executing purchase.' })
    } finally {
      setActionLoading(false)
    }
  }

  // Execute Sell Order
  const handleSell = async () => {
    if (!sellModal || sellQty <= 0) return

    setActionLoading(true)
    setFeedback(null)

    const holding = sellModal
    const stockLive = stocks.find(s => s.symbol === holding.symbol)
    const currentPrice = stockLive ? stockLive.price : (holding.avgBuyPrice || 1000)

    try {
      const res = await fetch('/api/orders/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          symbol: holding.symbol,
          stockName: holding.stockName,
          quantity: sellQty,
          price: currentPrice
        })
      })

      const data = await res.json()
      if (res.ok) {
        setFeedback({ type: 'success', message: data.message })
        setSellModal(null)
        loadUserOrders()
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to execute sell order.' })
      }
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', message: 'Network error executing sell order.' })
    } finally {
      setActionLoading(false)
    }
  }

  // Calculate live portfolio P&L
  let totalCurrentVal = 0
  let totalInvestedVal = 0

  const enrichedHoldings = ordersData.holdings.map(h => {
    const live = stocks.find(s => s.symbol === h.symbol)
    const curP = live ? live.price : (h.avgBuyPrice || 0)
    const curVal = curP * h.quantity
    const invVal = h.totalInvested || 0
    const pnl = curVal - invVal
    const pnlPct = invVal > 0 ? (pnl / invVal) * 100 : 0

    totalCurrentVal += curVal
    totalInvestedVal += invVal

    return {
      ...h,
      currentPrice: curP,
      currentValue: curVal,
      pnl,
      pnlPct,
      changeToday: live ? live.changePct : 0
    }
  })

  const totalPnL = totalCurrentVal - totalInvestedVal
  const totalPnLPct = totalInvestedVal > 0 ? (totalPnL / totalInvestedVal) * 100 : 0

  return (
    <div className="ps-container">
      {/* ── HEADER ── */}
      <div className="ps-header">
        <div>
          <div className="ps-pill">
            <span className="ps-pill-dot"></span>
            Real-Time Live Order Execution • NSE / BSE
          </div>
          <h1 className="ps-title">Stock Purchase & Trade Terminal</h1>
          <p className="ps-subtitle">
            Purchase live Indian stocks at real exchange market prices. Monitor your acquired shares, manage active positions, and track real-time P&L.
          </p>
        </div>

        <button className="ps-refresh-btn" onClick={() => { loadMarketStocks(); loadUserOrders(); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sync Orders
        </button>
      </div>

      {/* ── TOP STAT SUMMARY CARDS ── */}
      <div className="ps-stats-grid">
        {/* Card 1: Available Buying Power */}
        <div className="ps-stat-card card-glow-emerald">
          <span className="ps-stat-label">Available Buying Power (Cash)</span>
          <div className="ps-stat-val text-emerald">{formatINR(ordersData.availableCash)}</div>
          <span className="ps-stat-sub">Ready for immediate stock purchase</span>
        </div>

        {/* Card 2: Total Invested in Stocks */}
        <div className="ps-stat-card card-glow-blue">
          <span className="ps-stat-label">Current Stock Holdings Value</span>
          <div className="ps-stat-val text-blue">{formatINR(totalCurrentVal)}</div>
          <span className="ps-stat-sub">Invested: {formatINR(totalInvestedVal)}</span>
        </div>

        {/* Card 3: Total Portfolio Capital */}
        <div className="ps-stat-card card-glow-purple">
          <span className="ps-stat-label">Configured Total Capital</span>
          <div className="ps-stat-val text-purple">{formatINR(ordersData.totalCapital)}</div>
          <span className="ps-stat-sub">Configured in Portfolio Setup</span>
        </div>

        {/* Card 4: Total Unrealized P&L */}
        <div className="ps-stat-card card-glow-amber">
          <span className="ps-stat-label">Unrealized Profit & Loss (P&L)</span>
          <div className={`ps-stat-val ${totalPnL >= 0 ? 'text-emerald' : 'text-rose'}`}>
            {totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}
          </div>
          <span className={`ps-stat-sub ${totalPnL >= 0 ? 'text-emerald' : 'text-rose'}`}>
            {totalPnL >= 0 ? '▲ +' : '▼ '}{totalPnLPct.toFixed(2)}% Overall
          </span>
        </div>
      </div>

      {/* ── NOTIFICATION FEEDBACK ── */}
      {feedback && (
        <div className={`ps-alert ${feedback.type === 'success' ? 'ps-alert-success' : 'ps-alert-error'}`}>
          <span>{feedback.message}</span>
          <button className="ps-alert-close" onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      {/* ── MAIN 2-COLUMN TRADING WORKSPACE ── */}
      <div className="ps-workspace">

        {/* ── LEFT COLUMN: INSTANT BUY TERMINAL ── */}
        <div className="ps-card ps-buy-card">
          <div className="ps-card-title-row">
            <div className="ps-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h2 className="ps-card-title">Instant Stock Buy Order</h2>
              <p className="ps-card-desc">Execute instant market purchases routed to National Stock Exchange.</p>
            </div>
          </div>

          <form onSubmit={handleBuy} className="ps-buy-form">
            {/* 1. SELECT STOCK */}
            <div className="ps-field">
              <label className="ps-label">Select Stock / Equity</label>
              <div className="ps-select-wrap">
                <select 
                  className="ps-select" 
                  value={selectedSymbol} 
                  onChange={e => setSelectedSymbol(e.target.value)}
                >
                  {stocks.map(s => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} - {s.name} (Live: ₹{Number(s.price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Stock Quote Banner */}
            <div className="ps-stock-preview-banner">
              <div className="ps-sp-left">
                <div className="ps-sp-sym-row">
                  <span className="ps-sp-sym">{currentStock.symbol}</span>
                  <span className="ps-sp-tag">NSE LIVE</span>
                </div>
                <div className="ps-sp-name">{currentStock.name}</div>
              </div>
              <div className="ps-sp-right">
                <div className="ps-sp-price">₹{livePrice.toFixed(2)}</div>
                <div className={`ps-sp-chg ${currentStock.change >= 0 ? 'up' : 'down'}`}>
                  {currentStock.change >= 0 ? '▲ +' : '▼ '}
                  {Math.abs(currentStock.change || 0).toFixed(2)} ({currentStock.change >= 0 ? '+' : ''}{Number(currentStock.changePct || 0).toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* 2. ORDER TYPE */}
            <div className="ps-field">
              <label className="ps-label">Order Type</label>
              <div className="ps-btn-group">
                <button 
                  type="button" 
                  className={`ps-grp-btn ${orderType === 'MARKET' ? 'active' : ''}`}
                  onClick={() => setOrderType('MARKET')}
                >
                  Market (Instant)
                </button>
                <button 
                  type="button" 
                  className={`ps-grp-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
                  onClick={() => setOrderType('LIMIT')}
                >
                  Limit Order
                </button>
              </div>
            </div>

            {/* 3. QUANTITY */}
            <div className="ps-field">
              <div className="ps-field-head">
                <label className="ps-label" htmlFor="qtyInput">Number of Shares (Quantity)</label>
                <span className="ps-label-hint">Available Cash: {formatINR(availableCash)}</span>
              </div>

              <div className="ps-input-wrap">
                <input
                  id="qtyInput"
                  type="number"
                  min="1"
                  step="1"
                  className="ps-input"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
                <span className="ps-input-unit">Shares</span>
              </div>

              {/* Quantity quick chips */}
              <div className="ps-chips-row">
                {[1, 5, 10, 25, 50, 100].map(n => (
                  <button 
                    key={n} 
                    type="button" 
                    className={`ps-chip ${qtyNum === n ? 'active' : ''}`}
                    onClick={() => setQuantity(n)}
                  >
                    +{n}
                  </button>
                ))}
                <button 
                  type="button" 
                  className="ps-chip chip-max"
                  onClick={handleMaxAffordable}
                >
                  Max Affordable
                </button>
              </div>
            </div>

            {/* Order Cost Breakdown Card */}
            <div className="ps-breakdown-card">
              <div className="ps-bd-row">
                <span>Gross Purchase Value ({qtyNum} × ₹{livePrice.toFixed(2)}):</span>
                <strong>{formatINR(grossTotal)}</strong>
              </div>
              <div className="ps-bd-row">
                <span>Exchange Brokerage:</span>
                <span>₹{brokerage.toFixed(2)}</span>
              </div>
              <div className="ps-bd-row">
                <span>Securities Transaction Tax (STT):</span>
                <span>₹{sttLevy.toFixed(2)}</span>
              </div>
              <div className="ps-bd-divider"></div>
              <div className="ps-bd-row ps-bd-total">
                <span>Total Net Payable:</span>
                <strong>{formatINR(netTotalPayable)}</strong>
              </div>
            </div>

            {/* Funds check message */}
            {!hasEnoughFunds && (
              <div className="ps-funds-warning">
                ⚠️ Insufficient available cash ({formatINR(availableCash)}) to execute this purchase. Decrease quantity or adjust portfolio limits.
              </div>
            )}

            {/* Buy Action Button */}
            <button 
              type="submit" 
              className="ps-submit-buy-btn"
              disabled={actionLoading || !hasEnoughFunds || qtyNum <= 0}
            >
              {actionLoading ? (
                <>
                  <span className="ps-spinner"></span>
                  Executing Purchase on NSE...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Confirm & Buy {qtyNum} {currentStock.symbol} Shares
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── RIGHT COLUMN: ACTIVE HOLDINGS / PURCHASED STOCKS ── */}
        <div className="ps-card ps-holdings-card">
          <div className="ps-card-title-row">
            <div className="ps-card-icon icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h2 className="ps-card-title">Your Active Stock Holdings</h2>
              <p className="ps-card-desc">Stocks currently owned in your investment account.</p>
            </div>
          </div>

          {enrichedHoldings.length === 0 ? (
            <div className="ps-empty-holdings">
              <div className="ps-empty-icon">📦</div>
              <h3>No Purchased Stocks Yet</h3>
              <p>Select a stock from the terminal on the left and click <strong>Confirm & Buy</strong> to purchase your first shares.</p>
            </div>
          ) : (
            <div className="ps-holdings-list">
              {enrichedHoldings.map(holding => (
                <div key={holding.symbol} className="ps-holding-item">
                  <div className="ps-h-top">
                    <div>
                      <div className="ps-h-sym-row">
                        <span className="ps-h-sym">{holding.symbol}</span>
                        <span className="ps-h-qty-pill">{holding.quantity} Shares</span>
                      </div>
                      <div className="ps-h-name">{holding.stockName}</div>
                    </div>

                    <button 
                      className="ps-h-sell-btn"
                      onClick={() => {
                        setSellModal(holding)
                        setSellQty(holding.quantity)
                      }}
                    >
                      Sell
                    </button>
                  </div>

                  <div className="ps-h-metrics-grid">
                    <div className="ps-hm-item">
                      <span className="ps-hm-lbl">Avg Buy Price</span>
                      <span className="ps-hm-val">₹{holding.avgBuyPrice?.toFixed(2)}</span>
                    </div>
                    <div className="ps-hm-item">
                      <span className="ps-hm-lbl">Live Market Price</span>
                      <span className="ps-hm-val">₹{holding.currentPrice?.toFixed(2)}</span>
                    </div>
                    <div className="ps-hm-item">
                      <span className="ps-hm-lbl">Current Value</span>
                      <span className="ps-hm-val">{formatINR(holding.currentValue)}</span>
                    </div>
                    <div className="ps-hm-item">
                      <span className="ps-hm-lbl">Unrealized P&L</span>
                      <span className={`ps-hm-val ${holding.pnl >= 0 ? 'text-emerald' : 'text-rose'}`}>
                        {holding.pnl >= 0 ? '+' : ''}{formatINR(holding.pnl)} ({holding.pnl >= 0 ? '+' : ''}{holding.pnlPct?.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── BOTTOM ROW: RECENT ORDERS LOG ── */}
      <div className="ps-card ps-orders-card">
        <div className="ps-card-title-row">
          <div>
            <h2 className="ps-card-title">Order Execution History & Purchase Details</h2>
            <p className="ps-card-desc">Complete audit log of all your stock buy and sell orders.</p>
          </div>
        </div>

        {ordersData.orders.length === 0 ? (
          <div className="ps-empty-orders">
            <p>No transactions recorded yet.</p>
          </div>
        ) : (
          <div className="ps-table-responsive">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Symbol & Asset</th>
                  <th>Quantity</th>
                  <th>Execution Price</th>
                  <th>Total Cost / Return</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersData.orders.map(order => {
                  const isBuy = order.orderType === 'BUY'
                  return (
                    <tr key={order.id}>
                      <td><span className="ps-oid">#ORD-{order.id}</span></td>
                      <td>{order.orderTime ? new Date(order.orderTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Today'}</td>
                      <td>
                        <span className={`ps-type-badge ${isBuy ? 'type-buy' : 'type-sell'}`}>
                          {order.orderType}
                        </span>
                      </td>
                      <td>
                        <strong>{order.symbol}</strong>
                        <div className="ps-order-name">{order.stockName}</div>
                      </td>
                      <td><strong>{order.quantity}</strong> Shares</td>
                      <td>₹{order.price?.toFixed(2)}</td>
                      <td><strong>{formatINR(order.totalCost)}</strong></td>
                      <td>
                        <span className="ps-status-pill">
                          <span className="ps-status-dot"></span>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SELL MODAL ── */}
      {sellModal && (
        <div className="ps-modal-backdrop" onClick={() => setSellModal(null)}>
          <div className="ps-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="ps-modal-head">
              <h3>Liquidate / Sell Shares: {sellModal.symbol}</h3>
              <button className="ps-modal-close" onClick={() => setSellModal(null)}>×</button>
            </div>

            <div className="ps-modal-body">
              <div className="ps-m-row">
                <span>Company:</span>
                <strong>{sellModal.stockName}</strong>
              </div>
              <div className="ps-m-row">
                <span>Total Shares Held:</span>
                <strong>{sellModal.quantity} Shares</strong>
              </div>
              <div className="ps-m-row">
                <span>Current Live Market Price:</span>
                <strong>₹{sellModal.currentPrice?.toFixed(2)}</strong>
              </div>

              <div className="ps-m-field">
                <label>Number of Shares to Sell:</label>
                <div className="ps-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max={sellModal.quantity}
                    value={sellQty}
                    onChange={e => setSellQty(Math.min(sellModal.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="ps-input"
                  />
                  <span className="ps-input-unit">Shares</span>
                </div>
              </div>

              <div className="ps-m-row ps-m-payout">
                <span>Estimated Cash Returned to Wallet:</span>
                <strong className="text-emerald">{formatINR(sellQty * sellModal.currentPrice)}</strong>
              </div>

              <button 
                className="ps-confirm-sell-btn"
                onClick={handleSell}
                disabled={actionLoading || sellQty <= 0}
              >
                {actionLoading ? 'Selling Shares...' : `Confirm & Sell ${sellQty} Shares`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
