import { useEffect, useState } from 'react'
import couponDefault from '../assets/coupon_default.png'

/**
 * Ảnh voucher.
 *
 * Ưu tiên ảnh admin đã upload (`imageUrl` từ Cloudinary). Nếu admin không
 * upload, hoặc URL hỏng / tải lỗi (mất mạng, ảnh bị xoá trên Cloudinary)
 * thì rơi về ảnh mặc định trong assets.
 *
 * State `failed` đặt riêng cho từng thẻ nên một ảnh hỏng không ảnh hưởng
 * các thẻ khác.
 */
export default function VoucherThumbnail({ voucher }) {
  const [failed, setFailed] = useState(false)

  // Đổi sang voucher khác (sort/filter) thì thử lại ảnh mới.
  useEffect(() => {
    setFailed(false)
  }, [voucher?.imageUrl])

  const useDefault = failed || !voucher?.imageUrl

  return (
    <div className="fs-voucher-card__graphic">
      <img
        src={useDefault ? couponDefault : voucher.imageUrl}
        alt={voucher?.name ? `Ảnh voucher ${voucher.name}` : 'Ảnh voucher'}
        className={`fs-voucher-card__img ${useDefault ? 'is-default' : ''}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
