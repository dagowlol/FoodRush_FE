import { NavGamesIcon, NavRewardIcon, NavPlayIcon } from './icons'

/**
 * Bottom navigation for narrow screens (<= 760px).
 *
 * The app has no router: every view is driven by the `screen` state in
 * FoodDefenderGame, so navigation is just "tell the parent which screen".
 * On wider screens the header nav (`.fs-header__nav`) takes over and this bar
 * stays `display: none`.
 */
const TABS = [
  { id: 'menu', label: 'Trò chơi', Icon: NavGamesIcon },
  { id: 'shop', label: 'Đổi thưởng', Icon: NavRewardIcon },
  { id: 'playing', label: 'Chơi game', Icon: NavPlayIcon },
]

export default function MobileNavBar({ activeScreen, onNavigate }) {
  return (
    <nav className="fs-mobile-nav" aria-label="Điều hướng chính">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeScreen === id

        return (
          <button
            key={id}
            type="button"
            className={`fs-mobile-nav__tab ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (!isActive) onNavigate?.(id)
            }}
          >
            <span className="fs-mobile-nav__icon">
              <Icon size={22} />
            </span>
            <span className="fs-mobile-nav__label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}