import { BUG_TYPES, TOOLS } from './config'
import { SprayIcon, SwatterIcon } from './icons'

const TOOL_LIST = [TOOLS.spray, TOOLS.swatter]

export default function ToolBar({
  selectedTool,
  onSelect,
  hasGround,
  hasFlying,
  disabled,
  quantities = { spray: 30, swatter: 30 },
}) {
  return (
    <div className="fs-toolbar-tools" role="group" aria-label="Bộ công cụ diệt côn trùng">
      {TOOL_LIST.map((tool) => {
        const present = tool.bugType === BUG_TYPES.GROUND ? hasGround : hasFlying
        const active = selectedTool === tool.id
        const remaining = quantities?.[tool.id] ?? 30

        return (
          <button
            key={tool.id}
            type="button"
            className={`fs-tool-card ${active ? 'fs-tool-card--active' : ''} ${present && !active ? 'fs-tool-card--hint' : ''}`}
            onClick={() => onSelect(tool.id)}
            disabled={disabled}
            aria-pressed={active}
            aria-label={`${tool.name} — ${tool.subtitle}`}
          >
            <div className="fs-tool-card__icon-wrap">
              {tool.id === 'spray' ? <SprayIcon /> : <SwatterIcon />}
            </div>

            <div className="fs-tool-card__info">
              <span className="fs-tool-card__name">{tool.name}</span>
              <span className="fs-tool-card__target">{tool.subtitle}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

