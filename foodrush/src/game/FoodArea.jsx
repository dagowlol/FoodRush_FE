import { FIELD, FOOD } from './config'
import { FoodIcon } from './icons'

export default function FoodArea({ foodType, foodHitKey }) {
  return (
    <div className="food-area">
      <div
        key={foodHitKey}
        className="food"
        style={{ left: `${(FOOD.x / FIELD.W) * 100}%`, top: `${(FOOD.y / FIELD.H) * 100}%` }}
      >
        <span className="food__plate" />
        <span className="food__art">
          <FoodIcon type={foodType} />
        </span>
      </div>
    </div>
  )
}
