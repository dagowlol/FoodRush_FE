import { useEffect, useState } from 'react'
import { sound } from './sound'
import { AntIcon, FlyIcon, SprayIcon, SwatterIcon } from './icons'
import useModalLock from './useModalLock'

const STEPS = [
  {
    key: 'ground-intro',
    mode: 'intro',
    title: 'Bọ bò (Kiến)',
    text: 'Con kiến bò trên mặt đất để tới chỗ đồ ăn. Hãy diệt nó bằng Bình xịt nhé!',
    bug: 'ground',
    tool: 'spray',
  },
  {
    key: 'ground-practice',
    mode: 'practice',
    title: 'Thử nào!',
    text: 'Chọn Bình xịt, rồi chạm vào con kiến.',
    bug: 'ground',
    tool: 'spray',
  },
  {
    key: 'flying-intro',
    mode: 'intro',
    title: 'Ruồi bay',
    text: 'Con ruồi vỗ cánh bay lả lướt. Hãy diệt nó bằng Vợt đập ruồi!',
    bug: 'flying',
    tool: 'swatter',
  },
  {
    key: 'flying-practice',
    mode: 'practice',
    title: 'Thử nào!',
    text: 'Chọn Vợt đập ruồi, rồi chạm vào con ruồi.',
    bug: 'flying',
    tool: 'swatter',
  },
  {
    key: 'ready',
    mode: 'intro',
    title: 'Sẵn sàng!',
    text: 'Khi bug chạm vào đĩa thức ăn, bạn mất 1 mạng và một đĩa đồ ăn mới sẽ xuất hiện. Giữ đủ 3 mạng nhé!',
    bug: 'both',
    tool: null,
  },
]

export default function Tutorial({ onComplete, onSkip }) {
  const [index, setIndex] = useState(0)
  const [tool, setTool] = useState(null)
  const [done, setDone] = useState(false)
  const [flash, setFlash] = useState(null)

  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  useEffect(() => {
    sound.play('enter')
  }, [])

  const resetPractice = () => {
    setTool(null)
    setDone(false)
    setFlash(null)
  }

  const tapBug = () => {
    if (done || step.mode !== 'practice') return
    if (!tool) {
      setFlash('Chọn công cụ trước nhé!')
      return
    }
    if (tool !== step.tool) {
      setFlash('Chọn công cụ khác nhé!')
      sound.play('wrong')
      return
    }
    setFlash(null)
    setDone(true)
    sound.play(step.tool === 'swatter' ? 'swatter' : 'spray')
  }

  const next = () => {
    sound.play('click')
    if (isLast) {
      onComplete()
      return
    }
    resetPractice()
    setIndex((i) => i + 1)
  }

  const back = () => {
    sound.play('click')
    resetPractice()
    setIndex((i) => Math.max(0, i - 1))
  }

  useModalLock(true)

  return (
    <div className="overlay overlay--tutorial" role="dialog" aria-modal="true">
      <div className="tutorial-card">
        <div className="tutorial-progress">
          {STEPS.map((s, i) => (
            <span key={s.key} className={`dot ${i === index ? 'dot--active' : ''} ${i < index ? 'dot--done' : ''}`} />
          ))}
        </div>

        <h2 className="tutorial-title">{step.title}</h2>
        <p className="tutorial-text">{step.text}</p>

        {step.mode === 'intro' && (
          <div className="tutorial-stage tutorial-stage--intro">
            <span className="stage-bug">
              {step.bug === 'flying' ? <FlyIcon /> : <AntIcon />}
            </span>
            {step.tool === 'spray' && <span className="stage-tool"><SprayIcon /></span>}
            {step.tool === 'swatter' && <span className="stage-tool"><SwatterIcon /></span>}
          </div>
        )}

        {step.mode === 'practice' && (
          <>
            <div className="tutorial-stage">
              <button type="button" className="stage-bug stage-bug--tappable" onClick={tapBug} aria-label="Chạm vào bug">
                {step.bug === 'flying' ? <FlyIcon /> : <AntIcon />}
              </button>
              {done && <span className="stage-check">✓</span>}
            </div>

            <div className="tutorial-tools">
              <button
                type="button"
                className={`tutorial-tool ${tool === 'spray' ? 'is-on' : ''} ${step.tool === 'spray' && !done ? 'is-hint' : ''}`}
                onClick={() => {
                  sound.play('click')
                  setTool('spray')
                }}
              >
                <SprayIcon />
                <span>Bình xịt</span>
              </button>
              <button
                type="button"
                className={`tutorial-tool ${tool === 'swatter' ? 'is-on' : ''} ${step.tool === 'swatter' && !done ? 'is-hint' : ''}`}
                onClick={() => {
                  sound.play('click')
                  setTool('swatter')
                }}
              >
                <SwatterIcon />
                <span>Vợt</span>
              </button>
            </div>

            {flash && <div className="tutorial-flash">{flash}</div>}
            {done && <div className="tutorial-success">Tuyệt vời! Bạn làm đúng rồi 🎉</div>}
          </>
        )}

        <div className="tutorial-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              sound.play('click')
              onSkip()
            }}
          >
            Bỏ qua
          </button>
          <div className="tutorial-actions__right">
            {index > 0 && (
              <button type="button" className="btn" onClick={back}>
                ← Trước
              </button>
            )}
            <button
              type="button"
              className="btn btn--primary"
              onClick={next}
              disabled={step.mode === 'practice' && !done}
            >
              {isLast ? 'Vào chơi' : 'Tiếp →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
