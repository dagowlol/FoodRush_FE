// Hand-drawn SVG art so the game needs no external image assets.
// Each component is self-contained and can later be swapped for sprites.
import bugImg from '../assets/bug.png'
import flyImg from '../assets/fly.png'
import bugsprayImg from '../assets/bugspray.png'
import swatterImg from '../assets/swatter.png'
import burgerImg from '../assets/burger.png'
import friedChickenImg from '../assets/fried_chicken.png'
import friesImg from '../assets/friess.png'

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
  // Ground bug: a crawling ant.
  return <img src={bugImg} alt="" className={`art art--ant ${className}`} draggable={false} />
}

export function FlyIcon({ className = '' }) {
  // Flying bug: a fly.
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
      src={FOOD_IMAGES[type]}
      alt=""
      className={`art art--food art--food-${type}`}
      draggable={false}
    />
  )
}
