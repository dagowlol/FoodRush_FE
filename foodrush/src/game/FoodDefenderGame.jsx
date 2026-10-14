import { useCallback, useState } from 'react'
import StartScreen from './StartScreen'
import Tutorial from './Tutorial'
import GameScreen from './GameScreen'
import VoucherShop from './VoucherShop'
import MyVouchers from './MyVouchers'
import AdminPortal from './AdminPortal'
import MobileNavBar from './MobileNavBar'
import { getStoredUser } from './authApi'
import { sound } from './sound'
import './game.css'

const SEEN_KEY = 'fdf_tutorial_seen'

export default function FoodDefenderGame() {
  const [screen, setScreen] = useState('menu')
  const [runKey, setRunKey] = useState(0)
  const [showShop, setShowShop] = useState(false)
  const [showMyVouchers, setShowMyVouchers] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [menuRefreshKey, setMenuRefreshKey] = useState(0)
  const [user, setUser] = useState(() => getStoredUser())
  const [seenTutorial, setSeenTutorial] = useState(() => {
    try {
      return localStorage.getItem(SEEN_KEY) === '1'
    } catch {
      return false
    }
  })

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // ignore storage failures
    }
    setSeenTutorial(true)
  }, [])

  const startGame = useCallback(() => {
    setRunKey((k) => k + 1)
    setScreen('playing')
  }, [])

  const handlePlay = useCallback(() => {
    if (seenTutorial) startGame()
    else setScreen('tutorial')
  }, [seenTutorial, startGame])

  const finishTutorial = useCallback(() => {
    markSeen()
    startGame()
  }, [markSeen, startGame])

  // Shared by the mobile bottom nav and the shop's "Cách chơi" link.
  const goToScreen = useCallback((target) => {
    sound.play('click')
    if (target === 'menu') setScreen('menu')
    if (target === 'shop') setScreen('shop')
    if (target === 'tutorial') setScreen('tutorial')
    if (target === 'playing') handlePlay()
  }, [handlePlay])

  // Gameplay stays immersive: it already has its own close button in the HUD,
  // so the bottom bar is hidden while the shift is running.
  const showMobileNav = screen !== 'playing'

  return (
    <div className="fd-root">
      {screen === 'menu' && (
        <StartScreen
          key={menuRefreshKey}
          onPlay={handlePlay}
          onTutorial={() => setScreen('tutorial')}
          onOpenShop={() => setScreen('shop')}
          onOpenMyVouchers={() => setShowMyVouchers(true)}
          onOpenAdmin={() => setShowAdmin(true)}
          user={user}
        />
      )}
      {screen === 'tutorial' && (
        <Tutorial
          onComplete={finishTutorial}
          onSkip={finishTutorial}
          onExit={() => setScreen('menu')}
        />
      )}
      {screen === 'playing' && (
        <GameScreen
          key={runKey}
          onExit={() => setScreen('menu')}
          onOpenShop={() => setScreen('shop')}
        />
      )}
      {screen === 'shop' && (
        <VoucherShop
          onClose={() => setScreen('menu')}
          onNavigate={goToScreen}
          onRedeemed={() => setMenuRefreshKey((k) => k + 1)}
          user={user}
        />
      )}
      {showMyVouchers && <MyVouchers onClose={() => setShowMyVouchers(false)} />}
      {showAdmin && <AdminPortal user={user} onClose={() => setShowAdmin(false)} />}

      {/* Bottom navigation for narrow screens (hidden on desktop) */}
      {showMobileNav && (
        <MobileNavBar
          activeScreen={screen === 'tutorial' ? 'menu' : screen}
          onNavigate={goToScreen}
        />
      )}
    </div>
  )
}
