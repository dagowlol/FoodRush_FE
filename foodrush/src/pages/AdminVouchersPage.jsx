import { useEffect, useState } from 'react'
import AdminPortal from '../game/AdminPortal'
import { getStoredUser, fetchMeApi } from '../game/authApi'
import './staff.css'

function GateScreen({ icon, title, description }) {
  return (
    <div className="staff-gate">
      <div className="staff-gate__card">
        <div className="staff-gate__icon">{icon}</div>
        <h2>{title}</h2>
        <p>{description}</p>
        <button type="button" className="staff-btn" onClick={() => window.location.assign('/')}>
          ← Về trang chính
        </button>
      </div>
    </div>
  )
}

export default function AdminVouchersPage() {
  const [user, setUser] = useState(() => getStoredUser())

  useEffect(() => {
    fetchMeApi().then((fresh) => {
      if (fresh) setUser(fresh)
    })
  }, [])

  const goHome = () => window.location.assign('/')

  if (!user) {
    return (
      <GateScreen
        icon="🔐"
        title="Vui lòng đăng nhập"
        description="Bạn cần đăng nhập bằng tài khoản quản trị viên để truy cập."
      />
    )
  }

  if (user.role !== 'ADMIN') {
    return (
      <GateScreen
        icon="⛔"
        title="Không có quyền truy cập"
        description="Trang này chỉ dành cho tài khoản ADMIN."
      />
    )
  }

  return <AdminPortal user={user} onClose={goHome} />
}