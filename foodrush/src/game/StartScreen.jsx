import { useEffect, useMemo, useState } from 'react'
import {
  FiveStarLogo,
  CoinIcon,
  SparkleIcon,
  ArrowRightIcon,
  CardArtStackAttack,
  CardArtSpeedyChef,
  CardArtFlavorMatch,
  TicketIcon,
  UsersIcon,
  ShieldIcon,
} from './icons'
import { clearAuthData, fetchMeApi, getStoredUser } from './authApi'
import { fetchDailyCoinSummary } from './voucherApi'
import { useMyVouchers } from './useMyVouchers'
import { gameApi } from './gameApi'
import { sound } from './sound'
import CouponList from './CouponList'
import AuthModal from './AuthModal'
import ComingSoonModal from './ComingSoonModal'
import bgFoodDefend from '../assets/bg_fooddefendd.png'
import stackAttackImg from '../assets/stack_attack.png'
import speedyChefImg from '../assets/speedy_chef.png'
import flavorMatchImg from '../assets/flavor_match.png'

const UPCOMING_GAMES = [
  {
    id: 'burger-stack',
    num: '01 · BURGER LAB',
    title: 'Stack Attack',
    desc: 'Xếp burger thật chuẩn, đừng để tháp đổ.',
    fullDescription:
      'Cùng trở thành bậc thầy xếp burger! Hứng đúng các lớp nhân thịt bò nướng, phô mai béo ngậy, rau tươi và sốt thơm ngon rơi từ trên xuống theo đúng đơn đặt hàng.',
    genre: 'Phản xạ & Khéo léo',
    releaseDate: 'Tháng 11/2026',
    image: stackAttackImg,
    renderArt: () => <CardArtStackAttack />,
  },
  {
    id: 'speedy-chef',
    num: '02 · KITCHEN RUN',
    title: 'Speedy Chef',
    desc: 'Chạy bếp thật nhanh và hoàn thành đơn đúng giờ.',
    fullDescription:
      'Giờ cao điểm tại Five Star đã đến! Nhanh tay tiếp nhận order, canh chuẩn nhiệt độ chiên gà giòn vàng ươm, lắc khoai tây và đóng gói giao khách trước khi hết thời gian.',
    genre: 'Quản lý thời gian',
    releaseDate: 'Tháng 12/2026',
    image: speedyChefImg,
    renderArt: () => <CardArtSpeedyChef />,
  },
  {
    id: 'flavor-match',
    num: '03 · MEMORY CARDS',
    title: 'Flavor Match',
    desc: 'Ghép nguyên liệu để khám phá combo bí mật.',
    fullDescription:
      'Trò chơi giải đố kết hợp thẻ bài ẩm thực quen thuộc với đồ họa món ăn giòn ngon khó cưỡng! Hoán đổi vị trí đùi gà, burger, khoai tây và nước sốt để tạo ra các combo bùng nổ vị giác.',
    genre: 'Giải đố Match',
    releaseDate: 'Quý 1/2027',
    image: flavorMatchImg,
    renderArt: () => <CardArtFlavorMatch />,
  },
]

export default function StartScreen({
  onPlay,
  onTutorial,
  onOpenShop,
}) {
  const [user, setUser] = useState(() => getStoredUser())
  const [showAuth, setShowAuth] = useState(false)
  const [showCoupons, setShowCoupons] = useState(false)
  const [selectedComingSoon, setSelectedComingSoon] = useState(null)
  const [dailyCoin, setDailyCoin] = useState(null)
  const [bestScore, setBestScore] = useState(0)

  const { cards: myCodes, loading: myCodesLoading, error: myCodesError, reload: loadCodes } =
    useMyVouchers({ enabled: Boolean(user) && !user.isGuest })

  // Badge chỉ đếm mã còn dùng được.
  const couponCount = useMemo(
    () => myCodes.filter((c) => c.status === 'usable').length,
    [myCodes]
  )

  useEffect(() => {
    fetchMeApi().then((freshUser) => {
      if (freshUser) setUser(freshUser)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!user || user.isGuest) {
      setDailyCoin(null)
      setBestScore(0)
      return () => {
        cancelled = true
      }
    }

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
    setDailyCoin(null)
    setBestScore(0)
  }

  const handlePlayClick = () => {
    sound.play('start')
    onPlay()
  }

  const handleTutorialClick = () => {
    sound.play('click')
    onTutorial()
  }

  const userCoinDisplay = dailyCoin?.coinBalance ?? (user && !user.isGuest ? 1250 : 1250)

  return (
    <div className="fs-home">
      {/* 1. Compact Header */}
      <header className="fs-header">
        <div className="fs-header__container">
          <FiveStarLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <nav className="fs-header__nav" aria-label="Main navigation">
            <button
              type="button"
              className="fs-nav-link fs-nav-link--active"
              onClick={() => {
                const el = document.getElementById('featured-game')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Trò chơi
            </button>
            <button
              type="button"
              className="fs-nav-link"
              onClick={() => {
                sound.play('click')
                onOpenShop()
              }}
            >
              Đổi thưởng
            </button>
            {(user && (user.role === 'ADMIN' || user.role === 'STAFF')) && (
              <button
                type="button"
                className="fs-nav-link"
                onClick={() => window.location.assign('/staff')}
              >
                Nhân viên
              </button>
            )}
            {user && !user.isGuest && (
              <button
                type="button"
                className="fs-nav-link fs-nav-link--badge"
                onClick={() => setShowCoupons(true)}
              >
                Mã của tôi{couponCount > 0 ? ` · ${couponCount}` : ''}
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
              {user && !user.isGuest && (
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
                  {couponCount > 0 && <span className="fs-header__icon-dot">{couponCount}</span>}
                </button>
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

            {user && !user.isGuest && (
              <button
                type="button"
                className="fs-wallet-pill"
                onClick={() => {
                  sound.play('click')
                  onOpenShop()
                }}
                title="Xem số dư và đổi thưởng"
              >
                <CoinIcon size={22} />
                <div className="fs-wallet-pill__text">
                  <span className="fs-wallet-pill__label">SỐ DƯ</span>
                  <span className="fs-wallet-pill__val">
                    {userCoinDisplay.toLocaleString('vi-VN')}
                  </span>
                </div>
              </button>
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

      {/* Main Container */}
      <main className="fs-main-content">
        {/* 2. Strong Editorial Hero */}
        <section className="fs-hero">
          <div className="fs-hero__tag">
            <SparkleIcon size={13} color="#E94B33" />
            <span>CHƠI VUI, NHẬN QUÀ</span>
          </div>

          <h1 className="fs-hero__title">
            Chơi nhanh.<br />
            <span className="fs-hero__title--accent">Thưởng thật.</span>
          </h1>

          <p className="fs-hero__desc">
            Vượt thử thách, tích FiveCoin và đổi ưu đãi món ngon từ FiveStar.
          </p>
        </section>

        {/* 3. Featured Food Defender Game Card */}
        <section id="featured-game" className="fs-featured-section">
          <div className="fs-featured-card">
            {/* Left: Illustration artwork with Food Defender asset */}
            <div className="fs-featured-card__media fs-featured-card__media--fooddefend">
              <img
                src={bgFoodDefend}
                alt="Five Star: Food Defender"
                className="fs-featured-hero-img"
              />
            </div>

            {/* Right: Info and CTA */}
            <div className="fs-featured-card__body">
              <div className="fs-featured-card__top">
                <span className="fs-badge-tag">GAME NỔI BẬT</span>
                <span className="fs-live-badge">
                  <span className="fs-pulse-dot" />
                  Đang diễn ra
                </span>
              </div>

              <h2 className="fs-featured-card__title">Five Star: Food Defender</h2>

              <p className="fs-featured-card__desc">
                Côn trùng đang tiến về phía đĩa thức ăn nóng hổi! Hãy dùng <b>Bình xịt</b> diệt bọ bò và <b>Vợt đập</b> bắt ruồi bay. Chơi sinh tồn đến khi hết 3 mạng, combo càng dài FiveCoin nhận được càng lớn!
              </p>

              {/* Tags/Chips */}
              <div className="fs-chip-list">
                <span className="fs-chip">Sinh tồn vô hạn</span>
                <span className="fs-chip">Combo x2 điểm</span>
                <span className="fs-chip">3 mạng mỗi lượt</span>
              </div>

              {user && !user.isGuest && (
                <div className="fs-stats-box">
                  <div className="fs-stats-box__col">
                    <span className="fs-stats-box__label">FIVECOIN CỦA BẠN</span>
                    <div className="fs-stats-box__val">
                      <CoinIcon size={20} />
                      <span>{userCoinDisplay.toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="fs-stats-box__divider" />

                  <div className="fs-stats-box__col">
                    <span className="fs-stats-box__label">KỶ LỤC TUẦN</span>
                    <div className="fs-stats-box__val">
                      <span>{(bestScore || 2480).toLocaleString('vi-VN')} điểm</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Action buttons */}
              <div className="fs-featured-card__actions">
                <button
                  type="button"
                  className="fs-btn-primary"
                  onClick={handlePlayClick}
                >
                  <span>Chơi ngay</span>
                  <ArrowRightIcon size={18} />
                </button>

                <button
                  type="button"
                  className="fs-btn-secondary"
                  onClick={handleTutorialClick}
                >
                  Xem cách chơi
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Upcoming Games Section */}
        <section className="fs-upcoming-section">
          <div className="fs-upcoming-header">
            <div className="fs-upcoming-header__left">
              <div className="fs-upcoming-tag">
                <SparkleIcon size={12} color="#E94B33" />
                <span>SẮP RA MẮT</span>
              </div>
              <h2 className="fs-upcoming-title">Thêm game, thêm phần thưởng</h2>
            </div>
            <div className="fs-upcoming-header__right">
              <span>Chơi mỗi ngày để mở khóa ưu đãi mới.</span>
            </div>
          </div>

          <div className="fs-upcoming-grid">
            {UPCOMING_GAMES.map((game) => (
              <div
                key={game.id}
                className="fs-upcoming-card"
                onClick={() => setSelectedComingSoon(game)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedComingSoon(game)
                }}
              >
                {/* Visual art banner */}
                <div className="fs-upcoming-card__art">
                  {game.image ? (
                    <img src={game.image} alt={game.title} className="fs-upcoming-banner-img" />
                  ) : (
                    game.renderArt()
                  )}
                </div>

                <div className="fs-upcoming-card__content">
                  <span className="fs-upcoming-card__num">{game.num}</span>
                  <h3 className="fs-upcoming-card__title">{game.title}</h3>
                  <p className="fs-upcoming-card__desc">{game.desc}</p>

                  <div className="fs-upcoming-card__footer">
                    <button
                      type="button"
                      className="fs-btn-upcoming"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedComingSoon(game)
                      }}
                    >
                      Sắp ra mắt
                    </button>
                  </div>
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
          onSuccess={(loggedUser) => setUser(loggedUser)}
        />
      )}

      {showCoupons && (
        <CouponList
          cards={myCodes}
          loading={myCodesLoading}
          error={myCodesError}
          onClose={() => setShowCoupons(false)}
          onRetry={loadCodes}
          onOpenShop={onOpenShop}
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
