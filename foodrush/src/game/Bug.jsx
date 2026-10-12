import { useEffect, useRef } from 'react'
import { FIELD } from './config'
import { AntIcon, FlyIcon } from './icons'

export default function Bug({ bug, onAttack, registerEl }) {
  const elRef = useRef(null)

  useEffect(() => {
    registerEl(bug.id, elRef.current)
    return () => registerEl(bug.id, null)
  }, [bug.id, registerEl])

  const handleDown = (event) => {
    event.preventDefault()
    onAttack(bug.id)
  }

  return (
    <div
      ref={elRef}
      className={`bug bug--${bug.type}`}
      style={{ left: `${(bug.x / FIELD.W) * 100}%`, top: `${(bug.y / FIELD.H) * 100}%` }}
      onPointerDown={handleDown}
      role="button"
      tabIndex={-1}
      aria-label={bug.type === 'ground' ? 'Bọ bò' : 'Ruồi bay'}
    >
      <span className="bug__shadow" />
      <span className="bug__inner">
        {bug.type === 'ground' ? <AntIcon /> : <FlyIcon />}
      </span>
      {bug.maxHp > 1 && (
        <span className="bug__hp" aria-hidden="true">
          {Array.from({ length: bug.maxHp }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <i key={i} className={i < bug.hp ? 'hp-pip hp-pip--on' : 'hp-pip'} />
          ))}
        </span>
      )}
    </div>
  )
}
