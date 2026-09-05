import { useState } from 'react'
import './App.css'

function LoginPage({ onBack, onGoSignup, onLoginSuccess }) {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  const [error, setError]           = useState('')       // inline error message
  const [errorType, setErrorType]   = useState('')       // 'email' | 'password' | 'general'

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setErrorType('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.status === 404) {
        // Email not registered
        setError(data.message)
        setErrorType('email')
      } else if (res.status === 401) {
        // Wrong password
        setError(data.message)
        setErrorType('password')
      } else if (res.ok) {
        setError('')
        onLoginSuccess({ name: data.name, email: data.email })
      } else {
        setError(data.message || 'Something went wrong.')
        setErrorType('general')
      }
    } catch (err) {
      setError('Cannot reach the server. Make sure the backend is running.')
      setErrorType('general')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* Back button */}
      <button className="back-btn" onClick={onBack} aria-label="Back to home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Home
      </button>

      <div className="login-card">

        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">FINTECH</span>
            <span className="brand-sub">ASSET MANAGER</span>
          </div>
        </div>

        <div className="divider-line"></div>

        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in to manage your portfolio</p>

        {/* General error banner */}
        {error && errorType === 'general' && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">

          {/* Email Field */}
          <div className={`input-group ${focusedField === 'email' ? 'focused' : ''} ${errorType === 'email' ? 'error' : ''}`}>
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); setErrorType('') }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                required
              />
            </div>
            {/* Email not registered error + signup nudge */}
            {errorType === 'email' && (
              <div className="field-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}&nbsp;
                <button type="button" className="inline-link" onClick={onGoSignup}>
                  Sign up here →
                </button>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className={`input-group ${focusedField === 'password' ? 'focused' : ''} ${errorType === 'password' ? 'error' : ''}`}>
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); setErrorType('') }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                required
              />
              <button type="button" className="eye-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
            {/* Wrong password error */}
            {errorType === 'password' && (
              <div className="field-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}
          </div>

          <div className="forgot-row">
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>

          <button type="submit" className={`login-btn ${loading ? 'loading' : ''}`} disabled={loading}>
            {loading ? <span className="spinner"></span> : (
              <>
                <span>LOGIN</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="signup-text">
          Don't have an account?{' '}
          <button type="button" className="inline-link bold" onClick={onGoSignup}>Sign up</button>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
