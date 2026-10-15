import { useState } from 'react'
import useModalLock from './useModalLock'

export default function ComingSoonModal({ game, onClose }) {
  const [notified, setNotified] = useState(false)

  useModalLock(Boolean(game))

  if (!game) return null

  const handleNotify = () => {
    setNotified(true)
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="coming-soon-card">
        <button
          type="button"
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="coming-soon-hero">
          <div className="coming-soon-badge">⏳ SẮP RA MẮT</div>
          <div className="coming-soon-icon">{game.icon}</div>
          <h2 className="coming-soon-title">{game.title}</h2>
          <p className="coming-soon-genre">{game.genre} • {game.releaseDate}</p>
        </div>

        <div className="coming-soon-body">
          <p className="coming-soon-desc">{game.fullDescription || game.description}</p>

          <div className="coming-soon-features">
            <h4>Điểm nổi bật:</h4>
            <ul>
              {game.features?.map((feat, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={idx}>✨ {feat}</li>
              ))}
            </ul>
          </div>

          <div className="coming-soon-rewards">
            <span className="rewards-icon">🎁</span>
            <div className="rewards-text">
              <b>Phần thưởng dự kiến:</b>
              <p>Mã giảm giá độc quyền Five Star lên đến 20% khi game ra mắt!</p>
            </div>
          </div>
        </div>

        <div className="coming-soon-footer">
          {notified ? (
            <div className="notify-success">
              🎉 Đã đăng ký nhận tin! Bạn sẽ là người đầu tiên trải nghiệm game này!
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--primary coming-soon-notify-btn"
              onClick={handleNotify}
            >
              🔔 Nhận thông báo khi ra mắt
            </button>
          )}

          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
