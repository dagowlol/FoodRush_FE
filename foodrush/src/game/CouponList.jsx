import { useEffect, useMemo, useRef, useState } from 'react'
import VoucherCard from './VoucherCard'
import { VOUCHER_STATUS, sortVoucherCards } from './myCodes'
import { CloseIcon, RefreshIcon, TicketIcon } from './icons'
import useModalLock from './useModalLock'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

const TABS = [
  { id: 'usable', label: 'Có thể dùng' },
  { id: 'used', label: 'Đã sử dụng' },
]

function WalletSkeleton() {
  return (
    <ul className="vw-list" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="vw-card vw-card--skeleton">
          <span className="vw-skel vw-skel--reward" />
          <span className="vw-skel vw-skel--title" />
          <span className="vw-skel vw-skel--code" />
        </li>
      ))}
    </ul>
  )
}

function WalletEmpty({ title, description, onOpenShop }) {
  return (
    <div className="vw-empty">
      <span className="vw-empty__icon" aria-hidden="true">
        <TicketIcon size={28} />
      </span>
      <p className="vw-empty__title">{title}</p>
      <p className="vw-empty__desc">{description}</p>
      {onOpenShop && (
        <button type="button" className="vw-empty__cta" onClick={onOpenShop}>
          Xem cửa hàng voucher
        </button>
      )}
    </div>
  )
}

/**
 * Ví voucher ("Mã giảm giá của tôi").
 *
 * Không có ngày hết hạn cho voucher đổi bằng coin — mã dùng được bao lâu
 * cũng được, nên giao diện không hiển thị hay bịa bất kỳ mốc thời gian nào.
 */
export default function CouponList({
  cards = [],
  loading = false,
  error = null,
  onClose,
  onRetry,
  onOpenShop,
}) {
  const [tab, setTab] = useState('usable')
  const [copiedKey, setCopiedKey] = useState(null)

  const dialogRef = useRef(null)
  const tablistRef = useRef(null)
  const restoreFocusRef = useRef(null)

  const usable = useMemo(
    () => cards.filter((c) => c.status === VOUCHER_STATUS.USABLE),
    [cards]
  )
  // "Đã sử dụng" gồm cả mã đã quét tại quầy và mã coupon quá hạn — cả hai đều
  // không dùng được nữa, nhưng chỉ voucher đã hết hạn mới có nhãn riêng.
  const spent = useMemo(
    () => cards.filter((c) => c.status !== VOUCHER_STATUS.USABLE),
    [cards]
  )

  const visible = useMemo(() => {
    const source = tab === 'usable' ? usable : spent
    return sortVoucherCards(source)
  }, [tab, usable, spent])

  const counts = { usable: usable.length, used: spent.length }

  const subtitle = useMemo(() => {
    if (loading) return 'Đang tải mã của bạn...'
    if (error) return 'Chưa tải được danh sách mã.'
    if (cards.length === 0) return 'Bạn chưa có voucher nào'
    const n = usable.length
    if (n === 0) return 'Bạn đã dùng hết voucher'
    return `${n} voucher có thể sử dụng`
  }, [cards.length, usable.length, loading, error])

  /* --- hộp thoại: khoá trang + ẩn thanh điều hướng dưới ------------------ */
  useModalLock(true)

  /* --- hộp thoại: focus trap, Escape, khôi phục focus --------------------- */
  useEffect(() => {
    restoreFocusRef.current = document.activeElement

    const focusFirst = setTimeout(() => {
      const target = dialogRef.current?.querySelector('[data-autofocus]')
        || dialogRef.current?.querySelector(FOCUSABLE)
      target?.focus()
    }, 60)

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKeyDown, true)
      const el = restoreFocusRef.current
      if (el && typeof el.focus === 'function') el.focus()
    }
  }, [onClose])

  /* --- Enter/Space chuyển tab, trái-phải chuyển nhanh --- */
  const onTabKeyDown = (e, index) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return
    e.preventDefault()
    const next = e.key === 'ArrowRight' ? (index + 1) % TABS.length : (index - 1 + TABS.length) % TABS.length
    setTab(TABS[next].id)
    const buttons = tablistRef.current?.querySelectorAll('button')
    buttons?.[next]?.focus()
  }

  const handleCopy = async (card) => {
    if (!card) {
      setCopiedKey(null)
      return false
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(card.code)
      setCopiedKey(card.key)
      return true
    } catch {
      // Không báo thành công khi thật sự thất bại — mã vẫn chọn tay được.
      return false
    }
  }

  const renderEmpty = () => {
    if (error) {
      return (
        <div className="vw-empty" role="alert">
          <span className="vw-empty__icon" aria-hidden="true">
            <TicketIcon size={28} />
          </span>
          <p className="vw-empty__title">{error}</p>
          <p className="vw-empty__desc">Kiểm tra kết nối rồi thử tải lại nhé.</p>
          {onRetry && (
            <button type="button" className="vw-empty__cta" onClick={onRetry}>
              <RefreshIcon size={16} />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      )
    }

    if (cards.length === 0) {
      return (
        <WalletEmpty
          title="Bạn chưa có voucher"
          description="Chơi game và tích FiveCoin để đổi phần thưởng."
          onOpenShop={onOpenShop}
        />
      )
    }

    if (tab === 'usable') {
      return (
        <WalletEmpty
          title="Bạn chưa có voucher có thể dùng"
          description="Khám phá cửa hàng để đổi voucher mới."
          onOpenShop={onOpenShop}
        />
      )
    }

    return (
      <WalletEmpty
        title="Bạn chưa sử dụng voucher nào"
        description="Voucher đã dùng sẽ xuất hiện tại đây."
      />
    )
  }

  return (
    <div
      className="vw-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className="vw-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vw-title"
        ref={dialogRef}
      >
        <header className="vw-head">
          <span className="vw-head__icon" aria-hidden="true">
            <TicketIcon size={22} />
          </span>
          <div className="vw-head__text">
            <h2 className="vw-head__title" id="vw-title">
              Mã giảm giá của tôi
            </h2>
            <p className="vw-head__sub">{subtitle}</p>
          </div>
          {onRetry && (
            <button
              type="button"
              className="vw-head__btn"
              onClick={onRetry}
              aria-label="Tải lại danh sách mã"
              title="Tải lại"
            >
              <RefreshIcon size={18} className={loading ? 'is-spinning' : ''} />
            </button>
          )}
          <button
            type="button"
            className="vw-head__btn"
            onClick={onClose}
            aria-label="Đóng ví voucher"
            title="Đóng"
            data-autofocus
          >
            <CloseIcon size={18} />
          </button>
        </header>

        {!loading && !error && cards.length > 0 && (
          <div className="vw-tabs" role="tablist" aria-label="Trạng thái voucher" ref={tablistRef}>
            {TABS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`vw-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="vw-panel"
                tabIndex={tab === t.id ? 0 : -1}
                className={`vw-tab ${tab === t.id ? 'is-active' : ''}`}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
              >
                {t.label}
                <span className="vw-tab__count">{counts[t.id]}</span>
              </button>
            ))}
          </div>
        )}

        <div
          className="vw-body"
          id="vw-panel"
          role="tabpanel"
          aria-labelledby={cards.length > 0 ? `vw-tab-${tab}` : undefined}
        >
          {loading ? <WalletSkeleton /> : visible.length > 0 ? (
            <ul className="vw-list">
              {visible.map((card) => (
                <VoucherCard
                  key={card.key}
                  card={card}
                  copiedKey={copiedKey}
                  onCopy={handleCopy}
                />
              ))}
            </ul>
          ) : (
            renderEmpty()
          )}
        </div>
      </div>
    </div>
  )
}
