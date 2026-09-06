import { useState, useEffect } from 'react'
import LandingPage   from './LandingPage'
import LoginPage     from './LoginPage'
import SignupPage    from './SignupPage'
import DashboardPage from './DashboardPage'

function App() {
  const [page, setPage]   = useState('landing') // 'landing'|'login'|'signup'|'dashboard'
  const [user, setUser]   = useState(null)       // { name, email, token }

  // Check and restore JWT session on app load
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('auth_token')
      const savedUser = localStorage.getItem('auth_user')

      if (savedToken && savedUser) {
        const parsed = JSON.parse(savedUser)
        if (parsed && parsed.email) {
          setUser({ ...parsed, token: savedToken })
          setPage('dashboard')

          // Background verification with backend
          fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          })
            .then(res => res.json())
            .then(data => {
              if (data && data.authenticated) {
                setUser({ name: data.name, email: data.email, token: savedToken })
              } else if (data && data.authenticated === false) {
                // Token expired
                localStorage.removeItem('auth_token')
                localStorage.removeItem('auth_user')
                setUser(null)
                setPage('landing')
              }
            })
            .catch(() => {
              // Server unreachable, keep cached session
            })
        }
      }
    } catch (e) {
      console.warn('Session check error:', e)
    }
  }, [])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
    setPage('landing')
  }

  return (
    <>
      {page === 'landing'   && <LandingPage onGetStarted={() => setPage('login')} />}
      {page === 'login'     && <LoginPage onBack={() => setPage('landing')} onGoSignup={() => setPage('signup')} onLoginSuccess={handleLoginSuccess} />}
      {page === 'signup'    && <SignupPage onBack={() => setPage('landing')} onGoLogin={() => setPage('login')} />}
      {page === 'dashboard' && <DashboardPage user={user} onLogout={handleLogout} />}
    </>
  )
}

export default App
