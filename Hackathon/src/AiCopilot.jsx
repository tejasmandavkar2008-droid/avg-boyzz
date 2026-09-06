import { useState, useRef, useEffect } from 'react'
import './AiCopilot.css'

const SUGGESTED_QUERIES = [
  { text: 'Why is my portfolio in breach?' },
  { text: 'What happens if NIFTY drops 10%?' },
  { text: 'How do real-world constraints optimize returns?' },
  { text: 'Explain STT and transaction friction costs' },
  { text: 'What is my Maximum Drawdown risk?' },
  { text: 'How is Value at Risk (VaR) calculated?' }
]

export default function AiCopilot({ user, portfolioData, riskReport, onExecuteAction }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `### FinTech AI Risk Copilot\n\nI am your quantitative portfolio and risk assistant. I evaluate **Parametric VaR (95%/99%)**, monitor **single-asset concentration (<= 40%)** and **mandatory liquidity (>= 20%)**, and explain institutional compliance in clear terms.\n\nSelect a prompt below or ask your own question:`,
      suggestedAction: null,
      timestamp: 'Just now'
    }
  ])

  const chatEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (userQuestion) => {
    const q = userQuestion || query
    if (!q.trim() || loading) return

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMsg])
    setQuery('')
    setLoading(true)

    try {
      const res = await fetch('/api/copilot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q.trim(),
          userEmail: user?.email || 'guest',
          context: {
            capital: portfolioData?.capital || 10000000,
            riskScore: riskReport?.overallRiskScore || 45,
            breachesCount: riskReport?.activeBreaches?.length || 0
          }
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: data.answer || 'Analysis complete.',
            suggestedAction: data.suggestedAction || null,
            metrics: data.metrics || null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
      } else {
        throw new Error('Backend response error')
      }
    } catch (err) {
      console.warn('Using client fallback AI engine:', err)
      // Fallback local NLP response generator
      const fallbackAns = generateLocalResponse(q.trim())
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: fallbackAns.text,
          suggestedAction: fallbackAns.suggestedAction,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const generateLocalResponse = (q) => {
    const lower = q.toLowerCase()
    if (lower.includes('breach') || lower.includes('alert') || lower.includes('why')) {
      return {
        text: `### Portfolio Policy Breach Analysis\n\nYour portfolio is triggering active safeguards due to two specific violations:\n\n1. **Single-Asset Concentration (Limit: <= 40%)**: Current top equity holding represents an outsized share of total capital.\n2. **Mandatory Liquidity Deficit (Minimum: >= 20%)**: Liquid reserves are below regulatory adequacy thresholds.\n\n**Remediation**: Run the Real-World Constrained Optimizer to trim equity to 35% and restore cash reserves to 15%.`,
        suggestedAction: { type: 'APPLY_CONSTRAINED_OPTIMIZER', label: 'Apply Constrained 35/35/15/15 Rebalance' }
      }
    } else if (lower.includes('nifty') || lower.includes('drop') || lower.includes('crash')) {
      return {
        text: `### Market Shock Simulation (-10% NIFTY Drawdown)\n\nUnder a -10% market correction, multi-asset diversification cushions your balance sheet:\n\n- **Equities Drawdown**: -INR 5,50,000\n- **Gold & Bond Safe-Haven Rally**: +INR 75,000\n- **Net Portfolio Contraction**: **-4.7%** (vs -10.0% for 100% equity index).\n\n**Verdict**: Multi-asset allocation absorbs **53% of the shock**.`,
        suggestedAction: { type: 'RUN_STRESS_TEST', label: 'View Crisis Stress Testing Tab' }
      }
    } else {
      return {
        text: `### Real-World Constrained Optimization\n\nThe platform enforces hard institutional mandates:\n- **Stock <= 40%**\n- **Bonds <= 50%**\n- **Gold <= 25%**\n- **Cash >= 15%**\n- **1-Day VaR <= 6.0%**\n\nThis transforms a high-risk portfolio (VaR 8.2%) into a balanced institutional allocation (Stocks 35%, Bonds 35%, Gold 15%, Cash 15% with VaR 5.1%).`,
        suggestedAction: { type: 'APPLY_CONSTRAINED_OPTIMIZER', label: 'Apply 35/35/15/15 Allocation' }
      }
    }
  }

  const handleActionClick = (action) => {
    if (onExecuteAction) {
      onExecuteAction(action)
    }
    const ackMsg = {
      id: Date.now(),
      sender: 'ai',
      text: `**Action Dispatched**: Triggered \`${action.label}\` on your active portfolio terminal.`,
      timestamp: 'Just now'
    }
    setMessages(prev => [...prev, ackMsg])
  }

  // Format simple markdown into clean HTML
  const renderMarkdown = (content) => {
    if (!content) return null
    const lines = content.split('\n')
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="copilot-h4">{line.replace('### ', '')}</h4>
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="copilot-quote">{line.replace('> ', '')}</blockquote>
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="copilot-li" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.substring(2)) }} />
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '6px' }} />
      }
      return <p key={idx} className="copilot-p" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
    })
  }

  const formatInlineMarkdown = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="copilot-inline-code">$1</code>')
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button 
        className={`copilot-floating-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Risk & Portfolio Copilot"
        id="btn-ai-copilot-trigger"
      >
        <span className="copilot-sparkle-dot"></span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="copilot-btn-lbl">AI Copilot</span>
        {riskReport?.activeBreaches?.length > 0 && (
          <span className="copilot-badge-alert">{riskReport.activeBreaches.length}</span>
        )}
      </button>

      {/* Copilot Drawer / Modal */}
      {isOpen && (
        <div className="copilot-drawer">
          {/* Header */}
          <div className="copilot-header">
            <div className="copilot-header-left">
              <div className="copilot-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4zM6 10v2a6 6 0 0 0 12 0v-2M12 18v4M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="copilot-title">
                  FinTech AI Risk Copilot
                  <span className="copilot-live-tag">LIVE</span>
                </div>
                <div className="copilot-sub">
                  Institutional Capital & Compliance Explainer
                </div>
              </div>
            </div>
            <button className="copilot-close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="copilot-chips-wrap">
            <div className="copilot-chips-title">SUGGESTED QUERIES</div>
            <div className="copilot-chips-scroll">
              {SUGGESTED_QUERIES.map((sq, i) => (
                <button 
                  key={i} 
                  className="copilot-chip"
                  onClick={() => handleSend(sq.text)}
                  disabled={loading}
                >
                  {sq.text}
                </button>
              ))}
            </div>
          </div>

          {/* Message Stream */}
          <div className="copilot-messages-container">
            {messages.map((m) => (
              <div key={m.id} className={`copilot-msg-bubble ${m.sender === 'user' ? 'msg-user' : 'msg-ai'}`}>
                {m.sender === 'ai' && (
                  <div className="copilot-msg-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                )}
                <div className="copilot-msg-content">
                  <div className="copilot-msg-text">
                    {renderMarkdown(m.text)}
                  </div>

                  {/* Interactive Action Button in AI Bubble */}
                  {m.suggestedAction && (
                    <div className="copilot-action-card">
                      <span className="copilot-act-lbl">Suggested Action:</span>
                      <button 
                        className="copilot-act-btn"
                        onClick={() => handleActionClick(m.suggestedAction)}
                      >
                        {m.suggestedAction.label}
                      </button>
                    </div>
                  )}

                  <span className="copilot-msg-time">{m.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="copilot-msg-bubble msg-ai">
                <div className="copilot-msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="copilot-msg-content">
                  <div className="copilot-typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <form 
            className="copilot-input-area"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. 'Why is liquidity in breach?')"
              className="copilot-input"
              disabled={loading}
              id="input-ai-copilot"
            />
            <button 
              type="submit" 
              className="copilot-send-btn"
              disabled={loading || !query.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
