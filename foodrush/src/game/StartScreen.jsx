import { useEffect, useState } from 'react'
import { AntIcon, FlyIcon, SprayIcon, StarLogo, SwatterIcon } from './icons'
import { clearAuthData, fetchMeApi, getStoredUser } from './authApi'
import { fetchMyCoupons, fetchRewardEligibility } from './couponApi'
import { fetchDailyCoinSummary, fetchMyVouchers } from './voucherApi'
import { gameApi } from './gameApi'
import { sound } from './sound'
import CouponList from './CouponList'
import AuthModal from './AuthModal'
import ComingSoonModal from './ComingSoonModal'
import backgroundMain from '../assets/background_main.png'
import bgFoodDefend from '../assets/bg_fooddefendd.png'

const COMING_SOON_GAMES = [
  {
    id: 'burger-stack',
    title: 'Burger Stack Master',
    subtitle: 'Xếp Tầng Burger',
    icon: '🍔',
    genre: 'Phản xạ & Khéo léo',
    releaseDate: 'Tháng 11/2026',
    description: 'Hứng các nguyên liệu rơi tự do và xếp thành chiếc Burger siêu to khổng lồ chuẩn vị Five Star!',
    fullDescription:
      'Cùng trở thành bậc thầy xếp burger! Hứng đúng các lớp nhân thịt bò nướng, phô mai béo ngậy, rau tươi và sốt thơm ngon rơi từ trên xuống theo đúng đơn đặt hàng.',
    features: [
      'Hơn 20 tầng nguyên liệu burger bắt mắt',
      'Combo xếp chuẩn công thức nhận thưởng lớn',
      'Thử thách tốc độ tay và phản xạ cực nhạy',
    ],
  },
  {
    id: 'speedy-chef',
    title: 'Speedy Chef: Food Rush',
    subtitle: 'Đầu Bếp Siêu Tốc',
    icon: '👨‍🍳',
    genre: 'Quản lý thời gian',
    releaseDate: 'Tháng 12/2026',
    description: 'Vào vai đầu bếp Five Star, nhận đơn và chiên gà giòn rụm phục vụ khách hàng giờ cao điểm!',
    fullDescription:
      'Giờ cao điểm tại Five Star đã đến! Nhanh tay tiếp nhận order, canh chuẩn nhiệt độ chiên gà giòn vàng ươm, lắc khoai tây và đóng gói giao khách trước khi hết thời gian.',
    features: [
      'Mô phỏng không gian bếp Five Star chuyên nghiệp',
      'Đa dạng món ăn: Gà giòn, Gà sốt cay, Khoai tây phô mai',
      'Đánh giá sao hài lòng và bảng xếp hạng đầu bếp',
    ],
  },
  {
    id: 'flavor-match',
    title: 'Flavor Match 3',
    subtitle: 'Nối Vị Five Star',
    icon: '🍟',
    genre: 'Giải đố Match-3',
    releaseDate: 'Quý 1/2027',
    description: 'Ghép 3 món ăn cùng loại để tạo combo vị giác bùng nổ và mở khóa rương kho báu voucher!',
    fullDescription:
      'Trò chơi giải đố nối 3 quen thuộc với đồ họa món ăn giòn ngon khó cưỡng! Hoán đổi vị trí đùi gà, burger, khoai tây và nước sốt để tạo ra các combo bùng nổ vị giác.',
    features: [
      'Hơn 100 màn chơi giải đố lôi cuốn',
      'Hiệu ứng bùng nổ sốt chấm đặc biệt',
      'Vòng quay may mắn nhận voucher mỗi ngày',
    ],
  },
]

function parsePercent(discountValue) {
  if (discountValue == null) return null
  const match = String(discountValue).match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const value = Number(match[1].replace(',', '.'))
  return Number.isFinite(value) ? Math.round(value) : null
}

/**
 * There are two separate sources of codes for the user:
 *  - coupons claimed from game rewards (CouponResponse)
 *  - vouchers redeemed with coins in the shop (IssuedVoucherResponse)
 * Normalise both into one shape so the "Mã của tôi" list shows everything.
 */
function normalizeCodes(coupons, issuedVouchers) {
  const fromCoupons = (coupons || []).map((c) => ({
    key: `coupon-${c.id ?? c.code}`,
    code: c.code,
    name: `Giảm ${c.discountPercent ?? c.percent ?? 0}%`,
    percent: c.discountPercent ?? c.percent ?? null,
    discountValue: c.discountValue ?? null,
    issuedDate: c.issuedDate ?? null,
    status: c.status ?? 'ACTIVE',
    usedAt: c.redeemedAt ?? null,
  }))

  const fromVouchers = (issuedVouchers || []).map((v) => ({
    key: `voucher-${v.id ?? v.code}`,
    code: v.code,
    name: v.voucherName ?? v.name ?? 'Voucher',
    percent: parsePercent(v.discountValue),
    discountValue: v.discountValue ?? null,
    issuedDate: v.redemptionDate ?? v.issuedDate ?? null,
    status: v.status ?? 'ISSUED',
    usedAt: v.usedAt ?? null,
  }))

  return [...fromVouchers, ...fromCoupons]
}

export default function StartScreen({ onPlay, onTutorial, onOpenShop, onOpenMyVouchers, onOpenAdmin, user: userProp }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [showAuth, setShowAuth] = useState(false)
  const [showCoupons, setShowCoupons] = useState(false)
  const [selectedComingSoon, setSelectedComingSoon] = useState(null)
  const [coupons, setCoupons] = useState([])
  const [eligibility, setEligibility] = useState(null)
  const [dailyCoin, setDailyCoin] = useState(null)
  const [bestScore, setBestScore] = useState(0)

  const couponCount = coupons.length

  useEffect(() => {
    fetchMeApi().then((freshUser) => {
      if (freshUser) setUser(freshUser)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!user || user.isGuest) {
      setCoupons([])
      setEligibility(null)
      setDailyCoin(null)
      setBestScore(0)
      return () => {
        cancelled = true
      }
    }

    setCoupons([])
    setEligibility(null)
    setDailyCoin(null)
    setBestScore(0)

    Promise.all([fetchMyCoupons(), fetchMyVouchers()]).then(([claimed, issued]) => {
      if (!cancelled) setCoupons(normalizeCodes(claimed, issued))
    })
    fetchRewardEligibility().then((data) => {
      if (!cancelled) setEligibility(data)
    })
    fetchDailyCoinSummary().then((data) => {
      if (!cancelled) setDailyCoin(data)
    })
    gameApi.fetchHistory().then((history) => {
      if (cancelled) return
      const top = history.reduce((max, s) => Math.max(max, s?.scoreEarned ?? 0), 0)
      setBestScore(top)
    })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const handleLogout = () => {
    clearAuthData()
    setUser(null)
    setCoupons([])
    setEligibility(null)
    setDailyCoin(null)
    setBestScore(0)
  }

  const handleOpenAuth = () => {
    setShowAuth(true)
  }

  const handleAuthSuccess = (loggedUser) => {
    setUser(loggedUser)
  }

  const handleOpenComingSoon = (game) => {
    setSelectedComingSoon(game)
  }

  const handlePlayClick = () => {
    sound.play('start')
    onPlay()
  }

  const handleTutorialClick = () => {
    sound.play('click')
    onTutorial()
  }

  return (
    <div
      className="hub-root"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 236, 0.45), rgba(255, 236, 200, 0.7)), url(${backgroundMain})`,
      }}
    >
      {/* Top Navigation Bar */}
      <header className="hub-navbar">
        <div className="hub-navbar__brand">
          <StarLogo className="hub-logo" />
          <span className="hub-brand-name">Food<b>Rush</b></span>
        </div>

        <div className="hub-navbar__actions">
          {user && !user.isGuest && (
            <button
              type="button"
              className="btn btn--ghost hub-coupon-btn"
              onClick={() => setShowCoupons(true)}
            >
              🎟️ Mã của tôi{couponCount > 0 ? ` (${couponCount})` : ''}
              {eligibility && !eligibility.claimedToday && eligibility.options?.length ? ' • 1 lượt' : ''}
            </button>
          )}

          {user && !user.isGuest && (
            <>
              <button type="button" className="btn btn--ghost" onClick={onOpenShop}>Cửa hàng voucher</button>

              {user.role === "ADMIN" && (
                <button type="button" className="btn btn--ghost" onClick={() => window.location.assign('/admin')}>Admin App</button>
              )}
              {(user.role === "STAFF" || user.role === "ADMIN") && (
                <button type="button" className="btn btn--ghost" onClick={() => window.location.assign('/staff')}>Staff Web</button>
              )}
            </>
          )}

          {user && !user.isGuest && user.role === "CUSTOMER" && (
            <span className="hub-user-coin">
              🪙 {(dailyCoin?.coinBalance ?? 0).toLocaleString('vi-VN')} coin
            </span>
          )}

          {user ? (
            <div className="hub-user-pill">
              <span className="hub-user-avatar">
                {user.role === 'STAFF' ? '🛡️' : '👤'}
              </span>
              <div className="hub-user-details">
                <span className="hub-user-name">
                  {user.displayName || user.username}
                </span>
                {/* {user.role === 'STAFF' && (
                  <span className="hub-user-badge">Nhân viên</span>
                )} */}
              </div>
              <button
                type="button"
                className="hub-logout-btn"
                onClick={handleLogout}
                title="Đăng xuất"
              >
                Thoát
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--primary hub-login-btn"
              onClick={handleOpenAuth}
            >
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="hub-container">
        {/* Hero Arcade Banner */}
        <div className="hub-hero">
          <h1 className="hub-hero__title">Chơi Game Săn Voucher Ẩm Thực</h1>
          <p className="hub-hero__sub">
            Tham gia thử thách vui nhộn, tích lũy coin mỗi ngày và dùng coin đổi lấy voucher hấp dẫn tại Five Star!
          </p>
        </div>

        {/* Featured Game Section: Food Defender */}
        <section className="hub-section">
          <div className="hub-section__header">
            <h2 className="hub-section__title">Trò Chơi Nổi Bật</h2>
          </div>

          <div className="featured-card">
            <div
              className="featured-card__media"
              style={{ backgroundImage: `url(${bgFoodDefend})` }}
            >
            </div>

            <div className="featured-card__content">
              <h3 className="featured-game-name">Five Star: Food Defender</h3>
              <p className="featured-game-desc">
                Côn trùng đang tiến về phía đĩa thức ăn nóng hổi! Hãy dùng <b>Bình xịt</b> diệt bọ bò và <b>Vợt đập</b> bắt ruồi bay trước khi chúng làm hỏng món ăn!
              </p>

              <div className="featured-highlights">
                <div className="highlight-pill">
                  <span className="pill-icon">🏆</span>
                  <span>
                    Kỷ lục: <b>{user && !user.isGuest ? bestScore.toLocaleString('vi-VN') : '—'}</b> điểm
                  </span>
                </div>
                <div className="highlight-pill">
                  <span className="pill-icon">📈</span>
                  <span>Độ khó tăng dần theo điểm</span>
                </div>
                <div className="highlight-pill">
                  <span className="pill-icon">🎟️</span>
                  <span>Thanh tiến độ giảm giá tới 15%</span>
                </div>
                <div className="highlight-pill">
                  <span className="pill-icon">❤️</span>
                  <span>3 Mạng chơi thử thách</span>
                </div>
              </div>

              {/* Coin status: balance + how much more can be earned today */}
              {user && !user.isGuest && dailyCoin && (
                <div className="hub-coin-panel">
                  <div className="hub-coin-panel__item">
                    <span className="hub-coin-panel__label">🪙 Coin hiện có</span>
                    <span className="hub-coin-panel__value">
                      {(dailyCoin.coinBalance ?? 0).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="hub-coin-panel__divider" />
                  <div className="hub-coin-panel__item">
                    <span className="hub-coin-panel__label">📅 Có thể kiếm hôm nay</span>
                    <span className="hub-coin-panel__value is-gain">
                      {dailyCoin.dailyCoinCap > 0
                        ? `${(dailyCoin.remainingCoinsToday ?? 0).toLocaleString('vi-VN')} coin`
                        : 'Không giới hạn'}
                    </span>
                    <span className="hub-coin-panel__hint">
                      Đã kiếm {(dailyCoin.dailyCoinsEarned ?? 0).toLocaleString('vi-VN')}
                      {dailyCoin.dailyCoinCap > 0
                        ? ` / ${dailyCoin.dailyCoinCap.toLocaleString('vi-VN')} coin hôm nay`
                        : ' coin hôm nay'}
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Tool Reminder */}
              <div className="legend-mini">
                <div className="legend-mini__item">
                  <span className="legend-mini__icon"><AntIcon /></span>
                  <span className="legend-mini__arrow">→</span>
                  <span className="legend-mini__icon is-tool"><SprayIcon /></span>
                  <span className="legend-mini__txt">Bọ bò: Bình xịt</span>
                </div>
                <div className="legend-mini__item">
                  <span className="legend-mini__icon"><FlyIcon /></span>
                  <span className="legend-mini__arrow">→</span>
                  <span className="legend-mini__icon is-tool"><SwatterIcon /></span>
                  <span className="legend-mini__txt">Ruồi: Vợt đập</span>
                </div>
              </div>

              <div className="featured-card__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--big featured-play-btn"
                  onClick={handlePlayClick}
                >
                  ▶ CHƠI NGAY
                </button>
                <button
                  type="button"
                  className="btn btn--ghost featured-tut-btn"
                  onClick={handleTutorialClick}
                >
                  ? Hướng dẫn
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Games Section */}
        <section className="hub-section">
          <div className="hub-section__header">
            <span className="hub-section__badge is-soon">⏳ SẮP RA MẮT</span>
            <h2 className="hub-section__title">Kho Trò Chơi Đang Phát Triển</h2>
            <p className="hub-section__subtitle">
              Các mini-game ẩm thực tiếp theo sắp cập bến FoodRush. Bấm để xem trước!
            </p>
          </div>

          <div className="coming-soon-grid">
            {COMING_SOON_GAMES.map((game) => (
              <div
                key={game.id}
                className="coming-card"
                onClick={() => handleOpenComingSoon(game)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleOpenComingSoon(game)
                }}
              >
                <div className="coming-card__header">
                  <span className="coming-card__icon">{game.icon}</span>
                  <span className="coming-status-chip">Sắp ra mắt</span>
                </div>

                <div className="coming-card__info">
                  <h3 className="coming-card__title">{game.title}</h3>
                  <div className="coming-card__sub">{game.subtitle}</div>
                  <div className="coming-card__meta">
                    <span className="meta-genre">{game.genre}</span>
                    <span className="meta-date">📅 {game.releaseDate}</span>
                  </div>
                  <p className="coming-card__desc">{game.description}</p>
                </div>

                <div className="coming-card__action">
                  <button
                    type="button"
                    className="btn btn--ghost coming-peek-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenComingSoon(game)
                    }}
                  >
                    👀 Xem chi tiết & Nhận tin
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modals */}
      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {showCoupons && (
        <CouponList
          coupons={coupons}
          onClose={() => setShowCoupons(false)}
          onRefresh={() =>
            Promise.all([fetchMyCoupons(), fetchMyVouchers()]).then(([claimed, issued]) =>
              setCoupons(normalizeCodes(claimed, issued))
            )
          }
        />
      )}

      {selectedComingSoon && (
        <ComingSoonModal
          game={selectedComingSoon}
          onClose={() => setSelectedComingSoon(null)}
        />
      )}
    </div>
  )
}
