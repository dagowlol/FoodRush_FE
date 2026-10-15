import { TOOLS } from './config'
import bugsprayImg from '../assets/webg/bugspray.webp'
import swatterImg from '../assets/webg/swatter.webp'

const TOOL_IMAGES = {
  [TOOLS.spray.id]: bugsprayImg,
  [TOOLS.swatter.id]: swatterImg,
}

/**
 * Mobile-only read-out of the tool currently in hand.
 *
 * On desktop the game paints the tool as a custom cursor that follows the
 * pointer (`.tool-cursor`), which never appears on touch devices. This badge
 * lives in the left rail under the power-up bar and fills that gap.
 * Hidden on desktop - see `.fs-held-tool` in game.css.
 */
export default function HeldToolBadge({ toolId, isPowered = false }) {
  const tool = toolId ? TOOLS[toolId] : null

  return (
    <div
      className={`fs-held-tool ${tool ? 'fs-held-tool--filled' : 'fs-held-tool--empty'} ${isPowered ? 'is-powered' : ''}`}
      title={tool ? tool.name : 'Chưa chọn tool'}
      aria-label={tool ? `Đang cầm: ${tool.name}` : 'Chưa chọn tool'}
    >
      <span className="fs-held-tool__label">Đang cầm</span>

      {tool ? (
        <img className="fs-held-tool__img" src={TOOL_IMAGES[tool.id]} alt="" draggable={false} />
      ) : (
        <span className="fs-held-tool__placeholder" aria-hidden="true">
          ?
        </span>
      )}

      <span className="fs-held-tool__name">{tool ? tool.shortName || tool.name : '—'}</span>
    </div>
  )
}
