import { lazy, Suspense, useEffect, useState } from 'react'
import FoodDefenderGame from './game/FoodDefenderGame'

// Lazy load: chỉ tải khi user truy cập /admin, /staff, /auth/callback, /stack-attack
const GoogleCallback = lazy(() => import('./auth/GoogleCallback'))
const OperationsDashboard = lazy(() => import('./pages/OperationsDashboard'))
const StackAttackGame = lazy(() => import('./game/StackAttackGame'))

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F7F3E9',
      fontFamily: 'sans-serif',
      color: '#77736B',
      fontSize: '1rem',
    }}>
      Đang tải...
    </div>
  )
}

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (path === '/auth/callback' || path.startsWith('/auth/callback?')) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <GoogleCallback />
      </Suspense>
    )
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OperationsDashboard initialTab="overview" />
      </Suspense>
    )
  }

  if (path === '/staff' || path.startsWith('/staff/')) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OperationsDashboard initialTab="redeem" />
      </Suspense>
    )
  }

  if (path === '/stack-attack' || path.startsWith('/stack-attack')) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <StackAttackGame
          onExit={() => {
            window.history.pushState({}, '', '/')
            setPath('/')
          }}
        />
      </Suspense>
    )
  }

  return <FoodDefenderGame />
}

export default App
