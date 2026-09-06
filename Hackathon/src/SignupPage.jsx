import { useState } from 'react'
import './App.css'
import './SignupPage.css'

function SignupPage({ onBack, onGoLogin }) {
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [showPass, setShowPass]   = useState(false)
  const [focusedField, setFocusedField] = useState('')
  const [error, setError]         = useState('')
  const [errorType, setErrorType] = useState('')
  const [success, setSuccess]     = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setError(''); setErrorType(''); setSuccess('')

    if (!name.trim()) {
      setError('Please enter your full name.')
      setErrorType('name')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      setErrorType('confirm')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setErrorType('password')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      let data = {}
      try {
        data = await res.json()
      } catch {
        data = { message: `Server returned status ${res.status} (${res.statusText || 'Bad Response'})` }
      }

      if (res.status === 409) {
        setError(data.message || 'Email is already registered. Please log in.')
        setErrorType('email')
      } else if (res.ok) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('auth_user', JSON.stringify({ name: data.name, email: data.email, token: data.token }))
        }
        setSuccess(data.message || 'Account created successfully! Please log in.')
        setTimeout(() => onGoLogin(), 2000)
      } else {
        setError(data.message || 'Something went wrong.')
        setErrorType('general')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('Cannot reach the server. Make sure the backend is running on port 1111.')
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

      <button className="back-btn" onClick={onGoLogin} aria-label="Back to login">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Login
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

        <h2 className="login-title">Create Account</h2>
        <p className="login-subtitle">Start managing your assets today</p>

        {/* Success banner */}
        {success && (
          <div className="success-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {success} Redirecting to login…
          </div>
        )}

        {/* General error */}
        {error && errorType === 'general' && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="login-form">

          {/* Full Name */}
          <div className={`input-group ${focusedField === 'name' ? 'focused' : ''} ${errorType === 'name' ? 'error' : ''}`}>
            <label htmlFor="su-name">Full Name</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <input
                id="su-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); setErrorType('') }}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField('')}
                required
              />
            </div>
            {errorType === 'name' && (
              <div className="field-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}
          </div>

          {/* Email */}
          <div className={`input-group ${focusedField === 'email' ? 'focused' : ''} ${errorType === 'email' ? 'error' : ''}`}>
            <label htmlFor="su-email">Email</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                id="su-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); setErrorType('') }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                required
              />
            </div>
            {errorType === 'email' && (
              <div className="field-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}&nbsp;
                <button type="button" className="inline-link" onClick={onGoLogin}>Log in →</button>
              </div>
            )}
          </div>

          {/* Password */}
          <div className={`input-group ${focusedField === 'password' ? 'focused' : ''} ${errorType === 'password' ? 'error' : ''}`}>
            <label htmlFor="su-password">Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                id="su-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); setErrorType('') }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                required
              />
              <button type="button" className="eye-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? (
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

          {/* Confirm Password */}
          <div className={`input-group ${focusedField === 'confirm' ? 'focused' : ''} ${errorType === 'confirm' ? 'error' : ''}`}>
            <label htmlFor="su-confirm">Confirm Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                id="su-confirm"
                type={showPass ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(''); setErrorType('') }}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField('')}
                required
              />
            </div>
            {errorType === 'confirm' && (
              <div className="field-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}
          </div>

          <button type="submit" className={`login-btn ${loading ? 'loading' : ''}`} disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? <span className="spinner"></span> : (
              <>
                <span>CREATE ACCOUNT</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="signup-text">
          Already have an account?{' '}
          <button type="button" className="inline-link bold" onClick={onGoLogin}>Log in</button>
        </p>
      </div>
    </div>
  )
}

export default SignupPage
