export default function FallingTopping({ topping }) {
  const { x, y, width, height, toppingType, rotation = 0, isHeart } = topping

  if (isHeart) {
    return (
      <div
        className="btc-falling-topping btc-falling-heart"
        style={{
          transform: `translate3d(${x}px, ${y}px, 0)`,
          width: `${width}px`,
          height: `${height}px`,
        }}
        data-item-type="heart"
      >
        <div className="btc-heart-icon-wrapper">
          <div className="btc-heart-glow-ring" />
          <span className="btc-heart-graphic">💖</span>
          <span className="btc-heart-sparkle">✨</span>
          <span className="btc-heart-badge">+1❤️</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="btc-falling-topping"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      data-topping-id={toppingType.id}
    >
      <img
        src={toppingType.img}
        alt={toppingType.nameVi || toppingType.name}
        className="btc-falling-topping__img"
        draggable={false}
      />
    </div>
  )
}
