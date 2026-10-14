// Clean, original vector SVGs for FiveStar Rush. No emoji used as interface icons.
import bugImg from '../assets/bug.png'
import flyImg from '../assets/fly.png'
import bugsprayImg from '../assets/bugspray.png'
import swatterImg from '../assets/swatter.png'
import burgerImg from '../assets/burger.png'
import friedChickenImg from '../assets/fried_chicken.png'
import friesImg from '../assets/friess.png'

export function FiveStarLogo({ className = '', onClick }) {
  return (
    <div className={`fs-brand ${className}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <span className="fs-brand__icon">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#E94B33" />
          <path
            d="M16 6L18.4 13.6H26L19.8 18.2L22.2 25.8L16 21.2L9.8 25.8L12.2 18.2L6 13.6H13.6L16 6Z"
            fill="#FFFFFF"
          />
        </svg>
      </span>
      <span className="fs-brand__name">
        FiveStar <span className="fs-brand__accent">Rush</span>
      </span>
    </div>
  )
}

export function CoinIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`fs-coin-icon ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="#F3BE4D" stroke="#D39726" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="7.5" stroke="#E5A630" strokeWidth="1" strokeDasharray="1.5 1.5" />
      <path
        d="M12 7L13.2 10.4H16.8L13.9 12.5L15 16L12 13.8L9 16L10.1 12.5L7.2 10.4H10.8L12 7Z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

export function SparkleIcon({ size = 12, color = '#E94B33', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z"
        fill={color}
      />
    </svg>
  )
}

export function ArrowRightIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="4" y1="10" x2="16" y2="10" />
      <polyline points="10 4 16 10 10 16" />
    </svg>
  )
}

export function ArrowLeftIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="16" y1="10" x2="4" y2="10" />
      <polyline points="10 16 4 10 10 4" />
    </svg>
  )
}

export function CloseIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function PlayIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <polygon points="6,4 16,10 6,16" />
    </svg>
  )
}

export function PauseIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="4" width="3.5" height="12" rx="1" />
      <rect x="11.5" y="4" width="3.5" height="12" rx="1" />
    </svg>
  )
}

export function LightbulbIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#E94B33"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.2 4.7 3 6v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1c1.8-1.3 3-3.5 3-6a7 7 0 0 0-7-7z" />
    </svg>
  )
}

/* Original Vector Artwork for Burger Dash Hero Card */
export function BurgerIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 220 200"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`hero-burger-svg ${className}`}
    >
      {/* Top Bun */}
      <path
        d="M20 90C20 40 50 15 110 15C170 15 200 40 200 90H20Z"
        fill="#E85D3B"
      />
      {/* Sesame Seeds */}
      <circle cx="80" cy="45" r="2.5" fill="#FFE3A8" />
      <circle cx="110" cy="35" r="2.5" fill="#FFE3A8" />
      <circle cx="140" cy="48" r="2.5" fill="#FFE3A8" />
      <circle cx="65" cy="65" r="2.5" fill="#FFE3A8" />
      <circle cx="155" cy="68" r="2.5" fill="#FFE3A8" />
      <circle cx="115" cy="60" r="2.5" fill="#FFE3A8" />

      {/* Melted Cheese Slice */}
      <rect x="15" y="94" width="190" height="14" rx="4" fill="#F3BE4D" />

      {/* Fresh Green Lettuce */}
      <path
        d="M16 112C28 110 38 116 52 112C66 108 76 116 90 112C104 108 116 116 130 112C144 108 154 116 168 112C182 108 194 114 204 112V124H16V112Z"
        fill="#43A047"
      />

      {/* Tomato / Sauce Zigzag accent */}
      <path
        d="M20 128L35 138L50 128L65 138L80 128L95 138L110 128L125 138L140 128L155 138L170 128L185 138L200 128"
        stroke="#D32F2F"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Juicy Beef Patty */}
      <rect x="18" y="142" width="184" height="20" rx="7" fill="#6D3F28" />

      {/* Bottom Bun */}
      <path
        d="M20 166H200C200 182 185 194 165 194H55C35 194 20 182 20 166Z"
        fill="#E8963E"
      />
    </svg>
  )
}

/* Mascot "Rush" matching the sample drawing */
export function RushMascotIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 160 220"
      width="100%"
      height="100%"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`hero-mascot-svg ${className}`}
    >
      {/* Legs & Sneakers */}
      <line x1="60" y1="180" x2="52" y2="204" stroke="#1D1E1A" strokeWidth="6" strokeLinecap="round" />
      <line x1="100" y1="180" x2="108" y2="204" stroke="#1D1E1A" strokeWidth="6" strokeLinecap="round" />
      {/* Shoes */}
      <rect x="36" y="200" width="24" height="10" rx="4" fill="#FFFFFF" stroke="#1D1E1A" strokeWidth="3" />
      <rect x="100" y="200" width="24" height="10" rx="4" fill="#FFFFFF" stroke="#1D1E1A" strokeWidth="3" />

      {/* Waving Arms */}
      <path
        d="M38 135C24 140 12 148 6 156"
        stroke="#E94B33"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M122 135C136 140 148 148 154 156"
        stroke="#E94B33"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Sausage Body */}
      <rect x="38" y="70" width="84" height="114" rx="42" fill="#E94B33" />

      {/* Mascot Chef Helmet */}
      <path
        d="M40 76C40 40 54 26 80 26C106 26 120 40 120 76H40Z"
        fill="#FDF8F0"
        stroke="#E6DFD3"
        strokeWidth="2"
      />
      {/* Star emblem on helmet */}
      <circle cx="80" cy="56" r="14" fill="#F3BE4D" />
      <path
        d="M80 47L82.2 53.6H89.2L83.5 57.6L85.7 64.2L80 60.2L74.3 64.2L76.5 57.6L70.8 53.6H77.8L80 47Z"
        fill="#E94B33"
      />

      {/* Eyes */}
      <ellipse cx="64" cy="116" rx="4" ry="5" fill="#1D1E1A" />
      <ellipse cx="96" cy="116" rx="4" ry="5" fill="#1D1E1A" />

      {/* Smile */}
      <path
        d="M72 130C74 135 86 135 88 130"
        stroke="#1D1E1A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* Upcoming Card Banners */
export function CardArtStackAttack() {
  return (
    <div className="upcoming-banner upcoming-banner--yellow">
      <svg viewBox="0 0 120 80" width="90" height="60" fill="none">
        <rect x="25" y="15" width="70" height="24" rx="12" fill="#E8963E" />
        <rect x="20" y="38" width="80" height="8" rx="3" fill="#43A047" />
        <rect x="22" y="46" width="76" height="12" rx="4" fill="#6D3F28" />
        <rect x="25" y="58" width="70" height="10" rx="4" fill="#E8963E" />
      </svg>
    </div>
  )
}

export function CardArtSpeedyChef() {
  return (
    <div className="upcoming-banner upcoming-banner--teal">
      <svg viewBox="0 0 120 80" width="90" height="60" fill="none">
        {/* Chef hat */}
        <path
          d="M45 42C36 40 36 24 50 24C52 14 68 14 70 24C84 24 84 40 75 42H45Z"
          fill="#FFFFFF"
        />
        {/* Pot */}
        <rect x="42" y="44" width="36" height="26" rx="8" fill="#E94B33" />
        <line x1="36" y1="52" x2="42" y2="52" stroke="#E94B33" strokeWidth="4" strokeLinecap="round" />
        <line x1="78" y1="52" x2="84" y2="52" stroke="#E94B33" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function CardArtFlavorMatch() {
  return (
    <div className="upcoming-banner upcoming-banner--purple">
      <svg viewBox="0 0 120 80" width="90" height="60" fill="none">
        {/* Card 1 */}
        <rect x="36" y="22" width="28" height="42" rx="6" fill="#FDF7E7" transform="rotate(-8 50 43)" stroke="#E5DEC9" strokeWidth="2" />
        {/* Card 2 */}
        <rect x="56" y="22" width="28" height="42" rx="6" fill="#E94B33" transform="rotate(8 70 43)" stroke="#FFFFFF" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/* Voucher Card Graphic Banner matching Image 3 */
export function VoucherCardGraphic({ theme = 'yellow', letter = '5' }) {
  const themes = {
    yellow: { bg: '#F3BE4D', circle: 'rgba(255, 255, 255, 0.25)', text: '#E85D3B' },
    coral: { bg: '#F06A53', circle: 'rgba(255, 255, 255, 0.2)', text: '#E94B33' },
    teal: { bg: '#68B699', circle: 'rgba(255, 255, 255, 0.22)', text: '#2E7D5B' },
    purple: { bg: '#9A8ED8', circle: 'rgba(255, 255, 255, 0.2)', text: '#6955B8' },
  }
  const t = themes[theme] || themes.yellow

  return (
    <div className="voucher-card__graphic" style={{ backgroundColor: t.bg }}>
      <svg viewBox="0 0 200 120" width="100%" height="100%" fill="none" className="voucher-graphic-svg">
        {/* Background decorative circles & sparkles */}
        <circle cx="165" cy="40" r="34" fill={t.circle} />
        <circle cx="30" cy="85" r="22" fill={t.circle} />
        <path d="M42 28L44 34L50 36L44 38L42 44L40 38L34 36L40 34L42 28Z" fill="rgba(255,255,255,0.7)" />
        <path d="M174 80L175.5 84.5L180 86L175.5 87.5L174 92L172.5 87.5L168 86L172.5 84.5L174 80Z" fill="rgba(255,255,255,0.7)" />
      </svg>

      {/* Central stylized badge */}
      <div className="voucher-graphic__badge">
        <span className="voucher-graphic__badge-text" style={{ color: t.text }}>
          {letter}
        </span>
      </div>
    </div>
  )
}

/* In-game entities and legacy exports */
export function StarLogo({ className = '' }) {
  return (
    <span className={`star-logo ${className}`}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M24 3l6.3 12.8 14.1 2-10.2 10 2.4 14-12.6-6.6L11.4 41.8l2.4-14-10.2-10 14.1-2z"
          fill="#ffc531"
          stroke="#e2452f"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      </svg>
      <b>Five Star</b>
    </span>
  )
}

export function AntIcon({ className = '' }) {
  return <img src={bugImg} alt="" className={`art art--ant ${className}`} draggable={false} />
}

export function FlyIcon({ className = '' }) {
  return <img src={flyImg} alt="" className={`art art--fly ${className}`} draggable={false} />
}

export function SprayIcon({ className = '' }) {
  return (
    <img
      src={bugsprayImg}
      alt=""
      className={`art art--spray ${className}`}
      draggable={false}
    />
  )
}

export function SwatterIcon({ className = '' }) {
  return (
    <img
      src={swatterImg}
      alt=""
      className={`art art--swatter ${className}`}
      draggable={false}
    />
  )
}

const FOOD_IMAGES = {
  burger: burgerImg,
  chicken: friedChickenImg,
  fries: friesImg,
}

export function FoodIcon({ type }) {
  return (
    <img
      src={FOOD_IMAGES[type] || burgerImg}
      alt=""
      className={`art art--food art--food-${type}`}
      draggable={false}
    />
  )
}

