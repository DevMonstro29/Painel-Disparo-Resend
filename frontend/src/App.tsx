import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { EmailsPage } from './pages/EmailsPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { ContactsPage } from './pages/ContactsPage'
import { BroadcastsPage } from './pages/BroadcastsPage'
import { DomainsPage } from './pages/DomainsPage'
import { LogsPage } from './pages/LogsPage'
import { WebhooksPage } from './pages/WebhooksPage'
import { SettingsPage } from './pages/SettingsPage'
import { MetricsPage } from './pages/MetricsPage'
import { LoginPage } from './pages/LoginPage'
import { authService } from './services/authService'

function App() {
  const [activePage, setActivePage] = useState('emails')
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())

  useEffect(() => {
    const handleAuthExpired = () => {
      setIsAuthenticated(false)
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const renderPage = () => {
    switch (activePage) {
      case 'emails':
        return <EmailsPage />
      case 'templates':
        return <TemplatesPage />
      case 'contacts':
        return <ContactsPage />
      case 'broadcasts':
        return <BroadcastsPage />
      case 'domains':
        return <DomainsPage />
      case 'logs':
        return <LogsPage />
      case 'api-keys':
        return <SettingsPage />
      case 'webhooks':
        return <WebhooksPage />
      case 'metrics':
        return <MetricsPage />
      default:
        return <EmailsPage />
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="flex min-h-screen bg-canvas font-sans text-ink antialiased">
      <Sidebar onNavigate={setActivePage} activePage={activePage} />

      <main className="main-content ml-60 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-8 py-10">{renderPage()}</div>
      </main>
    </div>
  )
}

export default App
