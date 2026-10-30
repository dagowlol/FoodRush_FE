export default function OrderPanel({ order, changeKey, combo = 0 }) {
  if (!order || !order.items || order.items.length === 0) return null

  const itemCount = order.items.length
  const completedCount = order.items.filter((i) => i.completed).length

  return (
    <div
      key={changeKey}
      className={`btc-order-panel btc-order-panel--count-${itemCount} btc-order-panel--pulse`}
    >
      <div className="btc-order-panel__header">
        <div className="btc-order-panel__header-left">
          <span className="btc-order-panel__badge">ĐƠN HÀNG</span>
          {combo >= 2 && (
            <span className="btc-order-panel__combo">
              🔥 x{combo}
            </span>
          )}
        </div>

        <span className="btc-order-panel__count">
          {completedCount}/{itemCount}
        </span>
      </div>

      <div className="btc-order-panel__items">
        {order.items.map((item) => {
          const { topping, completed } = item
          return (
            <div
              key={item.id}
              className={`btc-order-item ${
                completed ? 'btc-order-item--completed' : 'btc-order-item--pending'
              }`}
            >
              <div
                className="btc-order-item__icon-wrap"
                style={{
                  borderColor: completed ? '#2ECC71' : topping.accentColor || '#FFBE0B',
                  boxShadow: completed
                    ? '0 0 10px rgba(46, 204, 113, 0.5)'
                    : `0 0 10px ${topping.accentColor || '#FFBE0B'}55`,
                }}
              >
                <img
                  src={topping.img}
                  alt={topping.nameVi}
                  className="btc-order-item__img"
                />

                {completed && (
                  <div className="btc-order-item__check">
                    <span>✓</span>
                  </div>
                )}
              </div>

              <div className="btc-order-item__info">
                <span className="btc-order-item__name">{topping.nameVi}</span>
                <span className="btc-order-item__status">
                  {completed ? 'Đã có' : 'Cần hứng'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
