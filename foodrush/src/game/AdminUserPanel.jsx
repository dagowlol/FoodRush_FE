import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminListUsers, adminUpdateUser, adminSetUserActive, adminUserStats, adminCreateUser } from './voucherApi'

const PAGE_SIZES = [10, 20, 50]

const EMPTY_CREATE_FORM = {
  username: '',
  email: '',
  password: '',
  displayName: '',
  role: 'CUSTOMER',
  coinBalance: 0,
}

const ROLES = [
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'STAFF', label: 'Nhân viên' },
  { value: 'ADMIN', label: 'Quản trị' },
]

const ROLE_CLASS = {
  CUSTOMER: 'is-customer',
  STAFF: 'is-staff',
  ADMIN: 'is-admin',
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('vi-VN')
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

export default function AdminUserPanel({ currentUserId }) {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [stats, setStats] = useState({ total: 0, locked: 0, staff: 0, coins: 0 })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ role: 'CUSTOMER', coinBalance: 0 })
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM)
  const [creating, setCreating] = useState(false)

  // targetPage cho phép lấy lại dữ liệu của một trang khác trong lúc state chưa kịp cập nhật.
  const refresh = useCallback(async (targetPage = page) => {
    setLoading(true)
    try {
      const result = await adminListUsers({ keyword, role: roleFilter, page: targetPage, size })
      setUsers(result.content)
      setTotalItems(result.totalItems)
      setTotalPages(result.totalPages)
      // Bộ lọc có thể làm trang hiện tại vượt quá trang cuối -> lùi về trang hợp lệ.
      if (result.content.length === 0 && result.totalPages > 0 && page > result.totalPages - 1) {
        setPage(result.totalPages - 1)
      }
    } finally {
      setLoading(false)
    }
  }, [keyword, roleFilter, page, size])

  const refreshStats = useCallback(async () => {
    const data = await adminUserStats()
    if (data) {
      setStats({
        total: data.totalUsers ?? 0,
        locked: data.lockedUsers ?? 0,
        staff: data.staffUsers ?? 0,
        coins: data.totalCoins ?? 0,
      })
    }
  }, [])

  // Debounce so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(refresh, keyword ? 300 : 0)
    return () => clearTimeout(timer)
  }, [refresh, keyword])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  const rangeStart = totalItems === 0 ? 0 : page * size + 1
  const rangeEnd = Math.min((page + 1) * size, totalItems)

  const pageNumbers = useMemo(() => {
    const total = Math.max(totalPages, 1)
    const span = 2
    let start = Math.max(page - span, 0)
    const end = Math.min(start + span * 2 + 1, total)
    start = Math.max(end - (span * 2 + 1), 0)
    return Array.from({ length: end - start }, (_, i) => start + i)
  }, [page, totalPages])

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPage(0)
  }

  const startEdit = (user) => {
    setEditing(user.id)
    setEditForm({ role: user.role, coinBalance: user.coinBalance })
    setMessage('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (editing == null || saving) return
    setSaving(true)
    setMessage('')
    try {
      const payload = { coinBalance: Number(editForm.coinBalance) }
      if (editForm.role) payload.role = editForm.role
      await adminUpdateUser(editing, payload)
      setEditing(null)
      await Promise.all([refresh(), refreshStats()])
    } catch (err) {
      setMessage(err.message || 'Không cập nhật được người dùng.')
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE_FORM)
    setMessage('')
    setShowCreate(true)
  }

  const closeCreate = () => {
    if (creating) return
    setShowCreate(false)
    setCreateForm(EMPTY_CREATE_FORM)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setMessage('')
    try {
      await adminCreateUser({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        displayName: createForm.displayName.trim() || createForm.username.trim(),
        role: createForm.role,
        coinBalance: Number(createForm.coinBalance) || 0,
      })
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE_FORM)
      // Người mới có id lớn nhất nên nằm ở trang đầu tiên.
      setPage(0)
      await Promise.all([refresh(0), refreshStats()])
    } catch (err) {
      setMessage(err.message || 'Không tạo được người dùng.')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (user) => {
    if (togglingId != null) return
    setTogglingId(user.id)
    setMessage('')
    try {
      await adminSetUserActive(user.id, !user.active)
      await Promise.all([refresh(), refreshStats()])
    } catch (err) {
      setMessage(err.message || 'Không đổi được trạng thái tài khoản.')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <>
      {message && <div className="staff-alert is-error">⚠️ {message}</div>}

      <section className="admin-summary">
        <div className="admin-card">
          <span>Người dùng</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="admin-card">
          <span>Nhân viên</span>
          <strong>{stats.staff}</strong>
        </div>
        <div className="admin-card">
          <span>Đang bị khoá</span>
          <strong>{stats.locked}</strong>
        </div>
        <div className="admin-card">
          <span>Tổng coin đang lưu hành</span>
          <strong>{formatNumber(stats.coins)}</strong>
        </div>
      </section>

      <div className="admin-filters">
        <input
          type="search"
          className="shop-filter-input"
          placeholder="Tìm theo tên, username hoặc email..."
          value={keyword}
          onChange={handleFilterChange(setKeyword)}
          aria-label="Tìm người dùng"
        />
        <select
          className="shop-filter-select"
          value={roleFilter}
          onChange={handleFilterChange(setRoleFilter)}
          aria-label="Lọc theo vai trò"
        >
          <option value="">Tất cả vai trò</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          className="shop-filter-select"
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value))
            setPage(0)
          }}
          aria-label="Số bản ghi mỗi trang"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s} / trang</option>
          ))}
        </select>
        <button type="button" className="staff-btn staff-btn--ghost" onClick={() => refresh()} disabled={loading}>
          {loading ? 'Đang tải...' : '↻ Làm mới'}
        </button>
        <button type="button" className="staff-btn" onClick={openCreate} disabled={creating}>
          ＋ Tạo người dùng
        </button>
      </div>

      {loading ? (
        <p className="staff-empty">Đang tải...</p>
      ) : users.length === 0 ? (
        <p className="staff-empty">Không tìm thấy người dùng nào.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Username</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Điểm</th>
                <th>Coin</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.active ? '' : 'is-locked'}>
                  <td>#{u.id}</td>
                  <td>{u.displayName}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`staff-badge ${ROLE_CLASS[u.role] ?? 'is-customer'}`}>
                      {ROLES.find((r) => r.value === u.role)?.label ?? u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'active' : 'inactive'}`}>
                      {u.active ? 'Hoạt động' : 'Đã khoá'}
                    </span>
                  </td>
                  <td>{formatNumber(u.totalScore)}</td>
                  <td>{formatNumber(u.coinBalance)}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="staff-btn staff-btn--ghost"
                        onClick={() => startEdit(u)}
                      >
                        Sửa
                      </button>
                      {/* Không hiện nút khoá cho chính tài khoản đang đăng nhập. */}
                      {u.id !== currentUserId && (
                        <button
                          type="button"
                          className={`staff-btn ${u.active ? 'staff-btn--danger' : ''}`}
                          onClick={() => handleToggleActive(u)}
                          disabled={togglingId === u.id}
                        >
                          {togglingId === u.id
                            ? '...'
                            : u.active
                              ? '🔒 Khoá'
                              : '🔓 Mở khoá'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-pagination">
        <span className="admin-pagination__info">
          {totalItems === 0
            ? 'Không có bản ghi'
            : `Hiển thị ${rangeStart}–${rangeEnd} trên tổng ${formatNumber(totalItems)} người dùng`}
        </span>

        <div className="admin-pagination__controls">
          <button
            type="button"
            className="staff-btn staff-btn--ghost"
            onClick={() => setPage(0)}
            disabled={loading || page === 0}
            aria-label="Trang đầu"
          >
            «
          </button>
          <button
            type="button"
            className="staff-btn staff-btn--ghost"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={loading || page === 0}
          >
            ‹ Trước
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              className={`admin-page-btn ${n === page ? 'is-current' : ''}`}
              onClick={() => setPage(n)}
              disabled={loading}
              aria-current={n === page ? 'page' : undefined}
            >
              {n + 1}
            </button>
          ))}

          <button
            type="button"
            className="staff-btn staff-btn--ghost"
            onClick={() => setPage((p) => Math.min(p + 1, Math.max(totalPages - 1, 0)))}
            disabled={loading || page >= totalPages - 1}
          >
            Sau ›
          </button>
          <button
            type="button"
            className="staff-btn staff-btn--ghost"
            onClick={() => setPage(Math.max(totalPages - 1, 0))}
            disabled={loading || page >= totalPages - 1}
            aria-label="Trang cuối"
          >
            »
          </button>
        </div>
      </div>

      {editing != null && (
        <div className="admin-modal-backdrop" onClick={() => !saving && setEditing(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="admin-header">
              <div className="admin-header__title">
                <span className="admin-header__icon">👤</span>
                <div>
                  <h2>Sửa người dùng #{editing}</h2>
                  <p>{users.find((u) => u.id === editing)?.displayName}</p>
                </div>
              </div>
              <button
                type="button"
                className="staff-btn staff-btn--ghost"
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                ✕ Đóng
              </button>
            </header>

            <form onSubmit={handleSave}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Vai trò</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={editing === currentUserId}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {editing === currentUserId && (
                    <small className="admin-hint">Không thể tự đổi vai trò của chính mình.</small>
                  )}
                </div>

                <div className="admin-field">
                  <label>Số dư coin</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.coinBalance}
                    onChange={(e) => setEditForm({ ...editForm, coinBalance: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-actions admin-actions--end">
                <button
                  type="button"
                  className="staff-btn staff-btn--ghost"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button type="submit" className="staff-btn" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="admin-modal-backdrop" onClick={closeCreate}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="admin-header">
              <div className="admin-header__title">
                <span className="admin-header__icon">👤</span>
                <div>
                  <h2>Tạo người dùng mới</h2>
                  <p>Admin tự đặt mật khẩu và gán vai trò ban đầu.</p>
                </div>
              </div>
              <button
                type="button"
                className="staff-btn staff-btn--ghost"
                onClick={closeCreate}
                disabled={creating}
              >
                ✕ Đóng
              </button>
            </header>

            <form onSubmit={handleCreate}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Username</label>
                  <input
                    required
                    minLength={3}
                    maxLength={50}
                    pattern="[a-zA-Z0-9._\-]+"
                    title="Chỉ cho phép chữ, số, dấu chấm, gạch dưới và gạch ngang."
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    disabled={creating}
                  />
                  <small className="admin-hint">3–50 ký tự, không khoảng trắng.</small>
                </div>

                <div className="admin-field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    maxLength={120}
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    disabled={creating}
                  />
                </div>

                <div className="admin-field">
                  <label>Mật khẩu</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    disabled={creating}
                  />
                  <small className="admin-hint">Tối thiểu 6 ký tự.</small>
                </div>

                <div className="admin-field">
                  <label>Tên hiển thị</label>
                  <input
                    maxLength={120}
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                    placeholder="Bỏ trống sẽ dùng username"
                    disabled={creating}
                  />
                </div>

                <div className="admin-field">
                  <label>Vai trò</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    disabled={creating}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-field">
                  <label>Số dư coin</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.coinBalance}
                    onChange={(e) => setCreateForm({ ...createForm, coinBalance: e.target.value })}
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="admin-actions admin-actions--end">
                <button
                  type="button"
                  className="staff-btn staff-btn--ghost"
                  onClick={closeCreate}
                  disabled={creating}
                >
                  Hủy
                </button>
                <button type="submit" className="staff-btn" disabled={creating}>
                  {creating ? 'Đang tạo...' : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}