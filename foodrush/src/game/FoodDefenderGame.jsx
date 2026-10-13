import { useCallback, useState } from 'react'
import StartScreen from './StartScreen'
import Tutorial from './Tutorial'
import GameScreen from './GameScreen'
import VoucherShop from './VoucherShop'
import MyVouchers from './MyVouchers'
import AdminVoucherPanel from './AdminVoucherPanel'
import { getStoredUser } from './authApi'
import './game.css'

const SEEN_KEY = 'fdf_tutorial_seen'

export default function FoodDefenderGame() {
  const [screen, setScreen] = useState('menu')
  const [runKey, setRunKey] = useState(0)
  const [showShop, setShowShop] = useState(false)
  const [showMyVouchers, setShowMyVouchers] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
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

  return (
    <div className="fd-root">
      {screen === 'menu' && (
        <StartScreen
          onPlay={handlePlay}
          onTutorial={() => setScreen('tutorial')}
          onOpenShop={() => setShowShop(true)}
          onOpenMyVouchers={() => setShowMyVouchers(true)}
          onOpenAdmin={() => setShowAdmin(true)}
          user={user}
        />
      )}
      {screen === 'tutorial' && <Tutorial onComplete={finishTutorial} onSkip={finishTutorial} />}
      {screen === 'playing' && <GameScreen key={runKey} onExit={() => setScreen('menu')} onOpenShop={() => setShowShop(true)} />}
      {showShop && <VoucherShop user={user} onClose={() => setShowShop(false)} />}
      {showMyVouchers && <MyVouchers onClose={() => setShowMyVouchers(false)} />}
      {showAdmin && <AdminVoucherPanel onClose={() => setShowAdmin(false)} />}
    </div>
  )
}
