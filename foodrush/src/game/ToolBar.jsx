import { BUG_TYPES, TOOLS } from './config'
import { SprayIcon, SwatterIcon } from './icons'

const TOOL_LIST = [TOOLS.spray, TOOLS.swatter]

export default function ToolBar({ selectedTool, onSelect, hasGround, hasFlying, disabled }) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Chọn công cụ">
      {TOOL_LIST.map((tool) => {
        const present = tool.bugType === BUG_TYPES.GROUND ? hasGround : hasFlying
        const active = selectedTool === tool.id
        const hint = present && !active
        return (
          <button
            key={tool.id}
            type="button"
            className={`tool ${active ? 'tool--active' : ''} ${hint ? 'tool--hint' : ''}`}
            onClick={() => onSelect(tool.id)}
            disabled={disabled}
            aria-pressed={active}
          >
            <span className="tool__icon">
              {tool.id === 'spray' ? <SprayIcon /> : <SwatterIcon />}
            </span>
            <span className="tool__text">
              <b>{tool.name}</b>
              <small>{tool.subtitle}</small>
            </span>
          </button>
        )
      })}
    </div>
  )
}
