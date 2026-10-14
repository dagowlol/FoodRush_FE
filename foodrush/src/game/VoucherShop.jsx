import { useEffect, useMemo, useState } from 'react'
import {
  fetchVouchersStrict,
  fetchWallet,
  fetchRedemptionStatus,
  redeemVoucher,
} from './voucherApi'
import { clearAuthData, getStoredUser } from './authApi'
import { REDEEM_ERROR, classifyRedeemError, redeemErrorCopy } from './redeemErrors'
import { useMyVouchers } from './useMyVouchers'
import {
  FiveStarLogo,
  CoinIcon,
  SparkleIcon,
  ArrowLeftIcon,
  SearchIcon,
  CloseIcon,
  TicketIcon,
  UsersIcon,
  ShieldIcon,
} from './icons'
import { sound } from './sound'
import VoucherThumbnail from './VoucherThumbnail'
import CouponList from './CouponList'
import AuthModal from './AuthModal'

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
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [keyword, setKeyword] = useState('')
  const [confirming, setConfirming] = useState(null)
  const [issued, setIssued] = useState(null)
  const [redeeming, setRedeeming] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  // Voucher đã hết lượt (BE trả 409) — khóa luôn nút "Đổi ngay" trên thẻ đó.
  const [soldOutIds, setSoldOutIds] = useState(() => new Set())
  // Mỗi ngày chỉ đổi được 1 voucher (VOUCHER_REDEEMED_TODAY).
  const [redeemBlocked, setRedeemBlocked] = useState(false)
  const [redeemIssue, setRedeemIssue] = useState(null)
  const [shopError, setShopError] = useState(null)
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
    // GET /api/vouchers và /api/wallet đều yêu cầu đăng nhập. Khách chưa
    // đăng nhập không lấy được dữ liệu thật nên không hiển thị gì cả, thay vì
    // dựng danh sách voucher mẫu và số dư giả.
    if (!isLoggedIn) {
      setVouchers([])
      setBalance(null)
      setShopError(null)
      setRedeemBlocked(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setShopError(null)
    try {
      const [vs, w, rs] = await Promise.all([
        fetchVouchersStrict(),
        fetchWallet().catch(() => null),
        fetchRedemptionStatus().catch(() => null),
      ])
      setVouchers(
        vs.map((v) => ({
          ...v,
          badge: v.priceCoins <= 400 ? 'ĐỔI NHANH' : v.priceCoins >= 800 ? 'ĐẶC BIỆT' : 'PHỔ BIẾN',
          value: v.discountValue || (v.percent ? `${v.percent}%` : 'Voucher'),
        }))
      )
      if (w?.balance != null) setBalance(w.balance)
      // BE báo sẵn hôm nay đã đổi chưa — hiện ngay thay vì đợi bấm mới biết.
      if (rs && rs.canRedeemToday === false) setRedeemBlocked(true)
    } catch {
      // Phân biệt rõ lỗi tải với danh sách rỗng — không thay bằng data mẫu.
      setVouchers([])
      setShopError('Không tải được danh sách voucher.')
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
    setBalance(null)
    setVouchers([])
    setSoldOutIds(new Set())
    setRedeemBlocked(false)
    refresh()
  }

  const filteredVouchers = useMemo(() => {
    const kw = keyword.trim().toLowerCase()

    const matched = kw
      ? vouchers.filter((v) =>
        [v.name, v.description, v.value, v.badge]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(kw))
      )
      : vouchers

    return sortVouchers(matched, sortBy)
  }, [vouchers, keyword, sortBy])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  const handleOpenConfirm = (v) => {
    sound.play('click')

    if (soldOutIds.has(String(v.id))) {
      setRedeemIssue({ kind: REDEEM_ERROR.OUT_OF_STOCK, voucher: v })
      return
    }
    if (redeemBlocked) {
      setRedeemIssue({ kind: REDEEM_ERROR.REDEEMED_TODAY, voucher: v })
      return
    }
    if (!isLoggedIn || balance == null || balance < v.priceCoins) {
      showToast(`Bạn cần ${v.priceCoins.toLocaleString('vi-VN')} FiveCoin để đổi voucher này! Hãy chơi Burger Dash để nhận thêm coin nhé.`)
      return
    }
    setConfirming(v)
  }

  const handleRedeem = async () => {
    if (!confirming) return
    setRedeeming(true)
    try {
      // Voucher luôn đến từ API nên id là Long (JSON number) — ép string
      // trước khi ghép URL. Không còn nhánh voucher mẫu tự sinh mã.
      const voucherId = String(confirming.id ?? '')
      const res = await redeemVoucher(voucherId)

      if (!res.ok) {
        // redeemVoucher trả { ok, error, status } — không có field `message`.
        const kind = classifyRedeemError({ status: res.status, error: res.error })
        if (kind === REDEEM_ERROR.OUT_OF_STOCK) {
          // Hết lượt: đánh dấu luôn để thẻ này không bấm đổi được nữa.
          setSoldOutIds((prev) => new Set(prev).add(voucherId))
        }
        if (kind === REDEEM_ERROR.REDEEMED_TODAY) setRedeemBlocked(true)
        setRedeemIssue({ kind, voucher: confirming })
        setConfirming(null)
        return
      }

      const successVoucher = res.voucher
      setBalance((b) => (b == null ? b : Math.max(0, b - confirming.priceCoins)))
      setIssued(successVoucher)
      setConfirming(null)
      // Mỗi ngày chỉ đổi được 1 voucher — chặn ngay các thẻ còn lại.
      setRedeemBlocked(true)
      // Vừa đổi xong thì "Mã của tôi" phải có mã mới ngay.
      loadCodes()
      sound.play('success')
      onRedeemed?.()
    } catch {
      setRedeemIssue({ kind: REDEEM_ERROR.UNKNOWN, voucher: confirming })
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
                    {/* balance khởi tạo null và chỉ có sau khi /api/wallet trả về,
                        nên lúc đang tải phải hiện placeholder chứ không .toLocaleString. */}
                    {balance != null ? balance.toLocaleString('vi-VN') : '--'}
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
            {/* Số dư thật — chỉ hiện khi đã đăng nhập, không dựng số giả. */}
            {isLoggedIn && balance != null ? (
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
            ) : (
              <div className="fs-balance-card fs-balance-card--locked">
                <span className="fs-balance-card__label">SỐ DƯ KHẢ DỤNG</span>
                <p className="fs-balance-card__locked-text">
                  Đăng nhập để xem số dư FiveCoin và đổi voucher.
                </p>
              </div>
            )}
          </div>
        </section>

        {redeemBlocked && isLoggedIn && (
          <div className="fs-shop-banner" role="status">
            <span className="fs-shop-banner__text">
              Bạn đã đổi 1 voucher hôm nay. Hãy dùng mã ở mục <b>Mã của tôi</b> hoặc quay lại vào ngày mai.
            </span>
          </div>
        )}

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
          {filteredVouchers.map((item) => {
            const hasStockField = item.remainingStock != null
            const isSoldOut =
              soldOutIds.has(String(item.id)) ||
              item.outOfStock === true ||
              (hasStockField && item.remainingStock <= 0)

            // Số lượng thật từ API: remainingStock / initialStock / issuedCount
            const remaining = item.remainingStock
            const initial = item.initialStock
            const sold = initial != null && remaining != null ? Math.max(0, initial - remaining) : null
            const ratio = initial > 0 && remaining != null
              ? Math.max(0, Math.min(1, remaining / initial))
              : null
            const isLowStock = !isSoldOut && remaining != null && remaining <= 5

            return (
              <div
                key={item.id}
                className={`fs-voucher-card ${isSoldOut ? 'is-sold-out' : ''}`}
              >
                {/* Ảnh voucher: admin upload, không có thì dùng coupon_default */}
                <VoucherThumbnail voucher={item} />

                <div className="fs-voucher-card__body">
                  {/* <span className="fs-voucher-badge">{item.badge || 'PHỔ BIẾN'}</span> */}

                  <div className="fs-voucher-card__value">{item.name}</div>
                  {/* <div className="fs-voucher-card__name">{item.name}</div> */}
                  <div className="fs-voucher-card__desc">
                    {item.description || 'Áp dụng tại cửa hàng FiveStar trên toàn quốc.'}
                  </div>

                  {/* Số lượng thật từ API: remainingStock / initialStock / issuedCount */}
                  {hasStockField && (
                    <div className="fs-voucher-stock">
                      <div className="fs-voucher-stock__top">
                        <span className="fs-voucher-stock__label">SỐ LƯỢNG</span>
                        <span className="fs-voucher-stock__value">
                          Còn <b>{remaining.toLocaleString('vi-VN')}</b>
                          {initial != null ? ` / ${initial.toLocaleString('vi-VN')}` : ''} lượt
                        </span>
                      </div>

                      {ratio != null && (
                        <div
                          className="fs-voucher-stock__track"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(ratio * 100)}
                          aria-label={`Còn ${remaining} trên ${initial} lượt`}
                        >
                          <span
                            className={`fs-voucher-stock__fill ${isSoldOut ? 'is-out' : ''} ${isLowStock ? 'is-low' : ''}`}
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </div>
                      )}

                      {(sold > 0 || isLowStock) && (
                        <div className="fs-voucher-stock__meta">
                          {sold > 0 && <span>Đã phát {sold.toLocaleString('vi-VN')}</span>}
                          {isLowStock && <span className="fs-voucher-stock__low">Sắp hết lượt</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {isSoldOut && (
                    <span className="fs-voucher-card__soldout">Đã hết lượt đổi</span>
                  )}

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
                      {isSoldOut ? 'Hết lượt' : 'Đổi ngay'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {!loading && filteredVouchers.length === 0 && (
            <div className="fs-shop-empty">
              {!isLoggedIn ? (
                <>
                  <span className="fs-shop-empty__icon" aria-hidden="true">
                    <TicketIcon size={30} />
                  </span>
                  <p className="fs-shop-empty__title">Đăng nhập để xem voucher</p>
                  <p className="fs-shop-empty__desc">
                    Danh sách voucher và số dư FiveCoin hiển thị theo tài khoản của bạn.
                  </p>
                </>
              ) : shopError ? (
                <>
                  <span className="fs-shop-empty__icon" aria-hidden="true">
                    <TicketIcon size={30} />
                  </span>
                  <p className="fs-shop-empty__title">{shopError}</p>
                  <p className="fs-shop-empty__desc">
                    Kiểm tra kết nối rồi thử tải lại nhé.
                  </p>
                  <button type="button" className="fs-btn-secondary" onClick={refresh}>
                    Thử lại
                  </button>
                </>
              ) : (
                <>
                  <span className="fs-shop-empty__icon" aria-hidden="true">
                    <TicketIcon size={30} />
                  </span>
                  <p className="fs-shop-empty__title">
                    {keyword.trim() ? 'Không tìm thấy voucher nào' : 'Hiện chưa có voucher'}
                  </p>
                  <p className="fs-shop-empty__desc">
                    {keyword.trim()
                      ? `Không có kết quả cho "${keyword.trim()}". Thử từ khoá khác nhé.`
                      : 'Quản trị viên chưa phát hành voucher nào. Quay lại sau nhé.'}
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
                </>
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
                <b>
                  {balance != null
                    ? Math.max(0, balance - confirming.priceCoins).toLocaleString('vi-VN')
                    : '--'}{' '}
                  FiveCoin
                </b>
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

      {/* Thông báo không đổi được — nói rõ lý do thay vì lỗi chung chung */}
      {redeemIssue && (
        <div className="fs-modal-backdrop" role="dialog" aria-modal="true">
          <div className="fs-modal-dialog">
            <div className="fs-modal-header">
              <h3>{redeemErrorCopy(redeemIssue.kind).title}</h3>
              <button
                type="button"
                className="fs-btn-close"
                onClick={() => setRedeemIssue(null)}
                aria-label="Đóng thông báo"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="fs-modal-body">
              {redeemIssue.voucher && (
                <p className="fs-modal-target">
                  Voucher <b>{redeemIssue.voucher.name}</b>
                </p>
              )}
              <p>{redeemErrorCopy(redeemIssue.kind).message}</p>
            </div>

            <div className="fs-modal-footer">
              <button
                type="button"
                className="fs-btn-cancel"
                onClick={() => setRedeemIssue(null)}
              >
                Đóng
              </button>
              {redeemIssue.kind === REDEEM_ERROR.OUT_OF_STOCK && (
                <button
                  type="button"
                  className="fs-btn-primary"
                  onClick={() => {
                    sound.play('click')
                    setShowCoupons(true)
                    setRedeemIssue(null)
                  }}
                >
                  Xem mã của tôi
                </button>
              )}
              {redeemIssue.kind === REDEEM_ERROR.REDEEMED_TODAY && (
                <button
                  type="button"
                  className="fs-btn-primary"
                  onClick={() => {
                    sound.play('click')
                    setShowCoupons(true)
                    setRedeemIssue(null)
                  }}
                >
                  Xem mã của tôi
                </button>
              )}
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
