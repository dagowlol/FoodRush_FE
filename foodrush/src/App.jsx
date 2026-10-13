import { useEffect, useState } from 'react'
import FoodDefenderGame from './game/FoodDefenderGame'
import GoogleCallback from './auth/GoogleCallback'
import AdminVouchersPage from './pages/AdminVouchersPage'
import StaffCouponsPage from './pages/StaffCouponsPage'

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (path === '/auth/callback' || path.startsWith('/auth/callback?')) {
    return <GoogleCallback />
  }

  if (path === '/admin' || path.startsWith('/admin/')) {
    return <AdminVouchersPage />
  }

  if (path === '/staff' || path.startsWith('/staff/')) {
    return <StaffCouponsPage />
  }

  return <FoodDefenderGame />
}

export default App
