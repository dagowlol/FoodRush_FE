import { useEffect } from 'react'

/**
 * Khoá trang + ẩn thanh điều hướng dưới khi một hộp thoại chặn đang mở.
 *
 * Vì sao cần:
 *  - Thanh điều hướng dưới là `position: fixed`: nếu hộp thoại không dành
 *    chỗ cho nó, nó sẽ nằm đè lên nút hành động cuối cùng của hộp thoại.
 *    Ẩn thanh điều hướng trong lúc mở hộp thoại là cách sạch nhất: người
 *    dùng không bấm nhầm sang màn khác và không phải cuộn vòng lại.
 *  - `overflow: hidden` trên <body> giữ trang phía sau không bị trôi theo khi
 *    người dùng cuộn trong hộp thoại.
 *
 * Cả hai dùng bộ đếm chứ không phải boolean: nhiều hộp thoại có thể chồng
 * nhau (ví dụ thông báo lỗi đổi mã → mở "Mã của tôi"), và trang chỉ được
 * mở lại khi hộp thoại cuối cùng đã đóng.
 */
let openCount = 0
let prevBodyOverflow = ''

function sync() {
  if (openCount > 0) {
    document.body.dataset.modalOpen = 'true'
    if (prevBodyOverflow === '') prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    delete document.body.dataset.modalOpen
    document.body.style.overflow = prevBodyOverflow
    prevBodyOverflow = ''
  }
}

export function useModalLock(active = true) {
  useEffect(() => {
    if (!active) return undefined
    openCount += 1
    sync()
    return () => {
      openCount = Math.max(0, openCount - 1)
      sync()
    }
  }, [active])
}

export default useModalLock