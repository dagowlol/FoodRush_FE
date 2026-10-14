import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchVouchers,
  fetchWallet,
  fetchRedemptionStatus,
  redeemVoucher,
} from './voucherApi'
import { clearAuthData, getStoredUser } from './authApi'
import { useMyVouchers } from './useMyVouchers'
import {
  FiveStarLogo,
  CoinIcon,
  SparkleIcon,
  ArrowLeftIcon,
  VoucherCardGraphic,
  SearchIcon,
  CloseIcon,
  TicketIcon,
  UsersIcon,
  ShieldIcon,
} from './icons'
import { sound } from './sound'
import CouponList from './CouponList'
import AuthModal from './AuthModal'

// Voucher mẫu (chỉ dùng khi chưa đăng nhập / API lỗi).
// remainingStock + sortId giúp sắp xếp hoạt động giống dữ liệu thật.
const DEFAULT_VOUCHERS = [
  {
    id: 'sample-1',
    sortId: 1,
    badge: 'PHỔ BIẾN',
    value: '50.000đ',
    name: 'Giảm trực tiếp',
    description: 'Áp dụng tại cửa hàng FiveStar trên toàn quốc.',
    priceCoins: 500,
    remainingStock: 40,
    theme: 'yellow',
    letter: '5',
  },
  {
    id: 'sample-2',
    sortId: 2,
    badge: 'ĐỔI NHANH',
    value: '1 phần',
    name: 'Khoai tây chiên',
    description: 'Áp dụng tại cửa hàng FiveStar trên toàn quốc.',
    priceCoins: 350,
    remainingStock: 12,
    theme: 'coral',
    letter: 'F',
  },
  {
    id: 'sample-3',
    sortId: 3,
    badge: 'TIẾT KIỆM',
    value: '20%',
    name: 'Combo FiveStar',
    description: 'Áp dụng tại cửa hàng FiveStar trên toàn quốc.',
    priceCoins: 700,
    remainingStock: 25,
    theme: 'teal',
    letter: 'C',
  },
  {
    id: 'sample-4',
    sortId: 4,
    badge: 'ĐẶC BIỆT',
    value: '1 món',
    name: 'Burger tự chọn',
    description: 'Áp dụng tại cửa hàng FiveStar trên toàn quốc.',
    priceCoins: 900,
    remainingStock: 5,
    theme: 'purple',
    letter: '5',
  },
]

const THEME_CYCLE = ['yellow', 'coral', 'teal', 'purple']

// Backend không có field "category", nên shop sắp xếp theo dữ liệu thật
// (giá coin, số lượt còn lại, id tăng dần) thay vì lọc Đồ ăn/Combo.
const SORT_OPTIONS = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'cheapest', label: 'Rẻ nhất' },
  { id: 'expensive', label: 'Đắt nhất' },
  { id: 'stock', label: 'Còn nhiều nhất' },
]

function sortVouchers(list, sortBy) {
  const copy = [...list]
  const stockOf = (v) => v.remainingStock ?? v.initialStock ?? 0
  const sortIdOf = (v) => v.sortId ?? v.id ?? 0

  switch (sortBy) {
    case 'cheapest':
      return copy.sort((a, b) => a.priceCoins - b.priceCoins)
    case 'expensive':
      return copy.sort((a, b) => b.priceCoins - a.priceCoins)
    case 'stock':
      return copy.sort((a, b) => stockOf(b) - stockOf(a))
    case 'newest':
    default:
      // id tăng dần theo thời gian thêm voucher mới.
      return copy.sort((a, b) => sortIdOf(b) - sortIdOf(a))
  }
}

export default function VoucherShop({ onClose, onNavigate, onRedeemed }) {
  const [vouchers, setVouchers] = useState([])
  const [balance, setBalance] = useState(1250)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [keyword, setKeyword] = useState('')
  const [confirming, setConfirming] = useState(null)
  const [issued, setIssued] = useState(null)
  const [redeeming, setRedeeming] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  // Header dùng chung cấu trúc với StartScreen.
  const [user, setUser] = useState(() => getStoredUser())
  const [showCoupons, setShowCoupons] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  const { cards: myCodes, loading: myCodesLoading, error: myCodesError, reload: loadCodes } =
    useMyVouchers({ enabled: Boolean(user) && !user.isGuest })

  // Badge đếm số mã CÒN DÙNG ĐƯỢC, không tính mã đã dùng.
  const couponCount = useMemo(
    () => myCodes.filter((c) => c.status === 'usable').length,
    [myCodes]
  )
  const isLoggedIn = Boolean(user) && !user.isGuest

  const refresh = async () => {
    setLoading(true)
    try {
      const [vs, w, rs] = await Promise.all([
        fetchVouchers().catch(() => []),
        fetchWallet().catch(() => null),
        fetchRedemptionStatus().catch(() => null),
      ])
      if (Array.isArray(vs) && vs.length > 0) {
        // Map backend vouchers with graphics
        const mapped = vs.map((v, idx) => {
          const theme = THEME_CYCLE[idx % THEME_CYCLE.length]
          const letter = v.name?.charAt(0).toUpperCase() || '5'
          return {
            ...v,
            badge: v.priceCoins <= 400 ? 'ĐỔI NHANH' : v.priceCoins >= 800 ? 'ĐẶC BIỆT' : 'PHỔ BIẾN',
            value: v.discountValue || (v.percent ? `${v.percent}%` : 'Voucher'),
            theme,
            letter,
          }
        })
        setVouchers(mapped)
      } else {
        setVouchers(DEFAULT_VOUCHERS)
      }
      if (w?.balance != null) setBalance(w.balance)
      setStatus(rs)
    } catch {
      setVouchers(DEFAULT_VOUCHERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleLogout = () => {
    sound.play('click')
    clearAuthData()
    setUser(null)
    setBalance(1250)
    refresh()
  }

  const filteredVouchers = useMemo(() => {
    const list = vouchers.length > 0 ? vouchers : DEFAULT_VOUCHERS
    const kw = keyword.trim().toLowerCase()

    const matched = kw
      ? list.filter((v) =>
        [v.name, v.description, v.value, v.badge]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(kw))
      )
      : list

    return sortVouchers(matched, sortBy)
  }, [vouchers, keyword, sortBy])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const handleOpenConfirm = (v) => {
    sound.play('click')
    if (balance < v.priceCoins) {
      showToast(`Bạn cần ${v.priceCoins.toLocaleString('vi-VN')} FiveCoin để đổi voucher này! Hãy chơi Burger Dash để nhận thêm coin nhé.`)
      return
    }
    setConfirming(v)
  }

  const handleRedeem = async () => {
    if (!confirming) return
    setRedeeming(true)
    try {
      let successVoucher = null
      // Voucher thật từ BE có id là Long (JSON number), voucher mẫu có id
      // dạng chuỗi 'sample-...'. Luôn ép về string trước khi kiểm tra.
      const voucherId = confirming.id == null ? '' : String(confirming.id)
      if (voucherId && !voucherId.startsWith('sample-')) {
        const res = await redeemVoucher(voucherId)
        if (res.ok) {
          successVoucher = res.voucher
        } else {
          showToast(res.message || 'Không thể đổi voucher lúc này.')
          setConfirming(null)
          return
        }
      } else {
        // Fallback sample redeem
        successVoucher = {
          code: `FS${Math.floor(100000 + Math.random() * 900000)}`,
          name: confirming.name,
          discountValue: confirming.value,
        }
      }

      setBalance((b) => Math.max(0, b - confirming.priceCoins))
      setIssued(successVoucher)
      setConfirming(null)
      // Vừa đổi xong thì "Mã của tôi" phải có mã mới ngay.
      loadCodes()
      sound.play('success')
      onRedeemed?.()
    } catch (err) {
      showToast(err.message || 'Đổi voucher không thành công.')
      setConfirming(null)
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div className="fs-shop-page">
      {/* 1. Header consistent with Home */}
      <header className="fs-header">
        <div className="fs-header__container">
          <FiveStarLogo onClick={onClose} />

          <nav className="fs-header__nav" aria-label="Shop navigation">
            <button
              type="button"
              className="fs-nav-link"
              onClick={() => onNavigate?.('menu') || onClose()}
            >
              Trò chơi
            </button>
            <button
              type="button"
              className="fs-nav-link fs-nav-link--active"
              onClick={() => { }}
            >
              Đổi thưởng
            </button>
            {isLoggedIn && (
              <button
                type="button"
                className="fs-nav-link fs-nav-link--badge"
                onClick={() => {
                  sound.play('click')
                  setShowCoupons(true)
                }}
              >
                Mã của tôi{couponCount > 0 ? ` · ${couponCount}` : ''}
              </button>
            )}
            {user && (user.role === 'ADMIN' || user.role === 'STAFF') && (
              <button
                type="button"
                className="fs-nav-link"
                onClick={() => window.location.assign('/staff')}
              >
                Nhân viên
              </button>
            )}
            {user && user.role === 'ADMIN' && (
              <button
                type="button"
                className="fs-nav-link"
                onClick={() => window.location.assign('/admin')}
              >
                Admin
              </button>
            )}
          </nav>

          <div className="fs-header__actions">
            {/* Khi header nav bị ẩn (<=760px), các link phụ chuyển xuống đây
                dưới dạng nút icon gọn để không mất chức năng nào trên mobile. */}
            <div className="fs-header__mobile-actions">
              {isLoggedIn && (
                <button
                  type="button"
                  className="fs-header__icon-btn"
                  onClick={() => {
                    sound.play('click')
                    setShowCoupons(true)
                  }}
                  title="Mã của tôi"
                  aria-label={`Mã của tôi${couponCount > 0 ? ` (${couponCount})` : ''}`}
                >
                  <TicketIcon size={20} />
                  {couponCount > 0 && <span className="fs-header__icon-dot">{couponCount}</span>}                </button>
              )}
              {user && (user.role === 'ADMIN' || user.role === 'STAFF') && (
                <button
                  type="button"
                  className="fs-header__icon-btn"
                  onClick={() => window.location.assign('/staff')}
                  title="Nhân viên"
                  aria-label="Trang nhân viên"
                >
                  <UsersIcon size={20} />
                </button>
              )}
              {user && user.role === 'ADMIN' && (
                <button
                  type="button"
                  className="fs-header__icon-btn"
                  onClick={() => window.location.assign('/admin')}
                  title="Admin"
                  aria-label="Trang quản trị"
                >
                  <ShieldIcon size={20} />
                </button>
              )}
            </div>

            {isLoggedIn && (
              <div className="fs-wallet-pill fs-wallet-pill--static">
                <CoinIcon size={22} />
                <div className="fs-wallet-pill__text">
                  <span className="fs-wallet-pill__label">SỐ DƯ</span>
                  <span className="fs-wallet-pill__val">
                    {balance.toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>
            )}
            {user ? (
              <div className="fs-user-badge">
                <span className="fs-user-badge__name" title={user.displayName || user.username}>
                  {user.displayName || user.username}
                </span>
                <button
                  type="button"
                  className="fs-user-badge__logout"
                  onClick={handleLogout}
                  title="Đăng xuất"
                >
                  Thoát
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="fs-btn-login"
                onClick={() => setShowAuth(true)}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Shop Container */}
      <main className="fs-shop-container">
        {/* Back Link */}
        <div className="fs-shop-breadcrumb">
          <button
            type="button"
            className="fs-btn-back"
            onClick={onClose}
          >
            <ArrowLeftIcon size={16} />
            <span>Trở về</span>
          </button>
        </div>

        {/* Top Hero: Title and Prominent FiveCoin Balance Panel */}
        <section className="fs-shop-hero">
          <div className="fs-shop-hero__left">
            <div className="fs-shop-hero__tag">
              <SparkleIcon size={12} color="#E94B33" />
              <span>FIVECOIN REWARDS</span>
            </div>
            <h1 className="fs-shop-hero__title">
              Đổi coin thành<br />
              <span className="fs-shop-hero__title--accent">món ngon.</span>
            </h1>
          </div>

          <div className="fs-shop-hero__right">
            {/* Prominent Charcoal Balance Panel */}
            <div className="fs-balance-card">
              <span className="fs-balance-card__label">SỐ DƯ KHẢ DỤNG</span>
              <div className="fs-balance-card__amount">
                <CoinIcon size={28} />
                <span className="fs-balance-card__number">
                  {balance.toLocaleString('vi-VN')}
                </span>
              </div>
              <span className="fs-balance-card__unit">FiveCoin</span>
            </div>
          </div>
        </section>

        {/* Filters and Section Heading */}
        <section className="fs-shop-filters-row">
          <div className="fs-shop-section-head">
            <h2 className="fs-shop-section-title">Voucher dành cho bạn</h2>
            <p className="fs-shop-section-sub">
              Voucher không giới hạn thời gian sử dụng sau khi đổi.
            </p>
          </div>

          {/* Search box + Sort dropdown */}
          <div className="fs-shop-controls">
            <div className="fs-shop-search">
              <SearchIcon size={18} />
              <input
                type="search"
                className="fs-shop-search__input"
                placeholder="Tìm voucher theo tên, mức giảm..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  sound.play('click')
                }}
                aria-label="Tìm kiếm voucher"
              />
              {keyword && (
                <button
                  type="button"
                  className="fs-shop-search__clear"
                  onClick={() => setKeyword('')}
                  aria-label="Xoá từ khoá"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>

            <label className="fs-shop-sort">
              <span className="fs-shop-sort__label">Sắp xếp</span>
              <select
                className="fs-shop-sort__select"
                value={sortBy}
                onChange={(e) => {
                  sound.play('click')
                  setSortBy(e.target.value)
                }}
                aria-label="Sắp xếp voucher"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fs-toast-alert" role="alert">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 4-column Responsive Grid (2 columns on mobile) */}
        <section className="fs-voucher-grid">
          {filteredVouchers.map((item) => (
            <div key={item.id} className="fs-voucher-card">
              {/* Top Original Graphic Banner */}
              <VoucherCardGraphic
                theme={item.theme || 'yellow'}
                letter={item.letter || '5'}
              />

              <div className="fs-voucher-card__body">
                <span className="fs-voucher-badge">{item.badge || 'PHỔ BIẾN'}</span>

                <div className="fs-voucher-card__value">{item.value}</div>
                <div className="fs-voucher-card__name">{item.name}</div>
                <div className="fs-voucher-card__desc">
                  {item.description || 'Áp dụng tại cửa hàng FiveStar trên toàn quốc.'}
                </div>

                <div className="fs-voucher-card__footer">
                  <div className="fs-voucher-cost">
                    <CoinIcon size={18} />
                    <span>{item.priceCoins.toLocaleString('vi-VN')}</span>
                  </div>

                  <button
                    type="button"
                    className="fs-btn-redeem"
                    onClick={() => handleOpenConfirm(item)}
                  >
                    Đổi ngay
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && filteredVouchers.length === 0 && (
            <div className="fs-shop-empty">
              <span className="fs-shop-empty__icon">🔍</span>
              <p className="fs-shop-empty__title">Không tìm thấy voucher nào</p>
              <p className="fs-shop-empty__desc">
                {keyword.trim()
                  ? `Không có kết quả cho "${keyword.trim()}". Thử từ khoá khác nhé.`
                  : 'Hiện chưa có voucher nào khả dụng.'}
              </p>
              {keyword.trim() && (
                <button
                  type="button"
                  className="fs-btn-secondary"
                  onClick={() => setKeyword('')}
                >
                  Xoá tìm kiếm
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal */}
      {confirming && (
        <div className="fs-modal-backdrop" role="dialog" aria-modal="true">
          <div className="fs-modal-dialog">
            <div className="fs-modal-header">
              <h3>Xác nhận đổi voucher</h3>
              <button
                type="button"
                className="fs-btn-close"
                onClick={() => setConfirming(null)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="fs-modal-body">
              <p>
                Bạn có chắc muốn dùng <b>{confirming.priceCoins.toLocaleString('vi-VN')} FiveCoin</b> để đổi voucher <b>{confirming.name} ({confirming.value})</b> không?
              </p>
              <div className="fs-modal-balance-hint">
                <span>Số dư sau khi đổi: </span>
                <b>{Math.max(0, balance - confirming.priceCoins).toLocaleString('vi-VN')} FiveCoin</b>
              </div>
            </div>

            <div className="fs-modal-footer">
              <button
                type="button"
                className="fs-btn-cancel"
                onClick={() => setConfirming(null)}
                disabled={redeeming}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="fs-btn-primary"
                onClick={handleRedeem}
                disabled={redeeming}
              >
                {redeeming ? 'Đang đổi...' : 'Xác nhận đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {issued && (
        <div className="fs-modal-backdrop" role="dialog" aria-modal="true">
          <div className="fs-modal-dialog fs-modal-dialog--success">
            <div className="fs-modal-header">
              <h3>Đổi voucher thành công!</h3>
              <button
                type="button"
                className="fs-btn-close"
                onClick={() => setIssued(null)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="fs-modal-body text-center">
              <div className="fs-success-coin-badge">
                <CoinIcon size={36} />
              </div>
              <h4>{issued.name}</h4>
              <p>Mã voucher của bạn đã sẵn sàng sử dụng tại quầy:</p>
              <div className="fs-issued-code">{issued.code}</div>
            </div>

            <div className="fs-modal-footer">
              <button
                type="button"
                className="fs-btn-primary full-width"
                onClick={() => setIssued(null)}
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mã của tôi */}
      {showCoupons && (
        <CouponList
          cards={myCodes}
          loading={myCodesLoading}
          error={myCodesError}
          onClose={() => setShowCoupons(false)}
          onRetry={loadCodes}
        />
      )}

      {/* Đăng nhập / đăng ký */}
      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={(loggedUser) => {
            setShowAuth(false)
            setUser(loggedUser)
            refresh()
            loadCodes()
          }}
        />
      )}
    </div>
  )
}