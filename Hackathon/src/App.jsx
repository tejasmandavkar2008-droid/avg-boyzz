import { useState } from 'react'
import LandingPage   from './LandingPage'
import LoginPage     from './LoginPage'
import SignupPage    from './SignupPage'
import DashboardPage from './DashboardPage'

function App() {
  const [page, setPage]   = useState('landing') // 'landing'|'login'|'signup'|'dashboard'
  const [user, setUser]   = useState(null)       // { name, email }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setPage('dashboard')
  }

  const handleLogout = () => {
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
