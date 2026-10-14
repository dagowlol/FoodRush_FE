import { useEffect, useState } from 'react'
import { VOUCHER_STATUS, isCopyable, statusMeta } from './myCodes'
import { CheckIcon, ChevronIcon, CopyIcon } from './icons'

/**
 * Một thẻ voucher duy nhất trong ví.
 *
 * Mọi trạng thái tương tác (đã sao chép / lỗi sao chép / mở điều kiện) đều
 * thuộc về thẻ này, nên thẻ này độc lập với thẻ khác.
 */
export default function VoucherCard({ card, copiedKey, onCopy }) {
  const [expanded, setExpanded] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const copyable = isCopyable(card.status)
  const meta = statusMeta(card.status)
  const justCopied = copiedKey === card.key
  const isExpired = card.status === VOUCHER_STATUS.EXPIRED

  useEffect(() => {
    if (!justCopied) return undefined
    const timer = setTimeout(() => onCopy(null), 1800)
    return () => clearTimeout(timer)
  }, [justCopied, card.key, onCopy])

  const handleCopy = async () => {
    if (!copyable) return
    setCopyError(false)
    const ok = await onCopy(card)
    if (!ok) setCopyError(true)
  }

  const conditions = [
    card.usage,
    card.acquiredLabel && `Ngày nhận: ${card.acquiredLabel}`,
    card.usedLabel && `Đã sử dụng: ${card.usedLabel}`,
    // Issued voucher không có hạn dùng — nói rõ để người dùng yên tâm giữ mã.
    !isExpired && card.source === 'voucher'
      ? 'Không giới hạn thời gian sử dụng — dùng bất cứ khi nào bạn muốn.'
      : null,
  ].filter(Boolean)

  const statusClass =
    card.status === VOUCHER_STATUS.USED
      ? 'is-used'
      : isExpired
        ? 'is-expired'
        : 'is-usable'

  return (
    <li className={`vw-card ${statusClass}`}>
      <div className="vw-card__top">
        <span className="vw-card__reward">{card.reward}</span>
        <span className={`vw-card__status ${statusClass}`}>
          <span className="vw-card__status-dot" aria-hidden="true" />
          {meta.label}
        </span>
      </div>

      <h3 className="vw-card__title" title={card.title}>
        {card.title}
      </h3>

      <div className="vw-card__code-row">
        <div className="vw-card__code-box">
          <span className="vw-card__code-label">Mã voucher</span>
          <span className="vw-card__code" title={card.code} aria-label={`Mã voucher ${card.code}`}>
            {card.code}
          </span>
        </div>

        {copyable && (
          <button
            type="button"
            className={`vw-copy-btn ${justCopied ? 'is-copied' : ''}`}
            onClick={handleCopy}
            aria-label={`Sao chép mã ${card.code}`}
          >
            {justCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            <span>{justCopied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>
        )}
      </div>

      {card.usedLabel && card.status === VOUCHER_STATUS.USED && (
        <p className="vw-card__used">Đã sử dụng: {card.usedLabel}</p>
      )}

      {copyError && (
        <p className="vw-card__error" role="alert">
          Không sao chép được. Bạn có thể bấm vào mã để chọn và chép thủ công.
        </p>
      )}

      <button
        type="button"
        className="vw-card__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={`vw-cond-${card.key}`}
      >
        {expanded ? 'Ẩn điều kiện' : 'Xem điều kiện'}
        <ChevronIcon size={14} className={`vw-card__chev ${expanded ? 'is-open' : ''}`} />
      </button>

      {expanded && (
        <div className="vw-card__conditions" id={`vw-cond-${card.key}`}>
          <ul>
            {conditions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </li>
  )
}
