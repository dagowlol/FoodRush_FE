import { useEffect, useState } from 'react'
import AdminVoucherPanel from '../game/AdminVoucherPanel'
import { getStoredUser, fetchMeApi } from '../game/authApi'

export default function AdminVouchersPage() {
  const [user, setUser] = useState(() => getStoredUser())

  useEffect(() => {
    fetchMeApi().then((fresh) => { if (fresh) setUser(fresh) })
  }, [])

  const goHome = () => { window.location.assign('/') }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Vui lòng đăng nhập</h2>
          <button onClick={goHome}>Về trang chính</button>
        </div>
      </div>
    )
  }

  if (user.role !== 'ADMIN') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Không có quyền truy cập (chỉ ADMIN)</h2>
          <button onClick={goHome}>Về trang chính</button>
        </div>
      </div>
    )
  }

  return <AdminVoucherPanel onClose={goHome} />
}
