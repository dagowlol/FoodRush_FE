import { cupImg } from './bubbleTeaAssets'

export default function PlayerCup({
  x,
  y,
  width,
  height,
  reactionState, // 'idle' | 'happy' | 'wrong'
  particles = [],
}) {
  return (
    <div
      className="btc-player-cup"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className={`btc-player-cup__inner btc-player-cup__inner--${reactionState}`}>
        {/* Thanh đỏ chỉ định độ cao hứng tại miệng cốc bubble tea */}
        <div className="btc-cup-catch-bar" aria-label="Độ cao hứng">
          <div className="btc-cup-catch-bar__beam" />
          <div className="btc-cup-catch-bar__marker btc-cup-catch-bar__marker--left" />
          <div className="btc-cup-catch-bar__marker btc-cup-catch-bar__marker--right" />
        </div>

        {/* Cup mascot image */}
        <img
          src={cupImg}
          alt="Bé ly trà sữa"
          className="btc-player-cup__img"
          draggable={false}
        />

        {/* Sparkle burst particles on successful catch */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="btc-cup-particle"
            style={{
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--color': p.color || '#FFD166',
            }}
          >
            {p.char || '✨'}
          </span>
        ))}
      </div>
    </div>
  )
}
