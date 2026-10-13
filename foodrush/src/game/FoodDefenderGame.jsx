import { useCallback, useState } from 'react'
import StartScreen from './StartScreen'
import Tutorial from './Tutorial'
import GameScreen from './GameScreen'
import './game.css'

const SEEN_KEY = 'fdf_tutorial_seen'

export default function FoodDefenderGame() {
  const [screen, setScreen] = useState('menu')
  const [runKey, setRunKey] = useState(0)
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
        <StartScreen onPlay={handlePlay} onTutorial={() => setScreen('tutorial')} />
      )}
      {screen === 'tutorial' && <Tutorial onComplete={finishTutorial} onSkip={finishTutorial} />}
      {screen === 'playing' && <GameScreen key={runKey} onExit={() => setScreen('menu')} />}
    </div>
  )
}
