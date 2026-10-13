import { useState } from 'react'
import AdminVoucherPanel from './AdminVoucherPanel'
import AdminUserPanel from './AdminUserPanel'
import '../pages/admin.css'
import '../pages/staff.css'

const TABS = [
  { id: 'vouchers', label: 'Quản lý voucher', icon: '🎫' },
  { id: 'users', label: 'Quản lý người dùng', icon: '👥' },
]

export default function AdminPortal({ user, onClose }) {
  const [tab, setTab] = useState(TABS[0].id)

  return (
    <div className="staff-root">
      <div className="admin-portal">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <span className="admin-sidebar__logo">🍟</span>
            <div>
              <strong>FoodRush</strong>
              <span>Bảng quản trị</span>
            </div>
          </div>

          <nav className="admin-sidebar__nav">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-sidebar__link ${tab === item.id ? 'is-active' : ''}`}
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
              >
                <span className="admin-sidebar__icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar__foot">
            <button type="button" className="staff-btn staff-btn--ghost staff-btn--block" onClick={onClose}>
              ← Về trang chính
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <header className="admin-header staff-header">
            <div className="admin-header__title">
              <span className="admin-header__icon">🛠️</span>
              <div>
                <h2>{TABS.find((t) => t.id === tab)?.label}</h2>
                <p>Five Star • Bảng điều khiển quản trị viên</p>
              </div>
            </div>
            <div className="staff-header__actions">
              <div className="staff-header__user">
                <span className="staff-header__avatar">🛡️</span>
                {user?.displayName || user?.username}
              </div>
            </div>
          </header>

          <div className="admin-main__body">
            {tab === 'vouchers' ? (
              <AdminVoucherPanel />
            ) : (
              <AdminUserPanel currentUserId={user?.id} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}