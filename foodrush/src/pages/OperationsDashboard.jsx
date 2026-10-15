import { useEffect, useMemo, useState, useCallback } from 'react'
import { getStoredUser, fetchMeApi } from '../game/authApi'
import {
  adminListVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminUpdateVoucherStatus,
  adminIssuedVouchers,
  adminUploadVoucherImage,
  adminListUsers,
  adminUserStats,
  adminCreateUser,
  adminUpdateUser,
  adminSetUserActive,
  fetchWalletTransactions,
} from '../game/voucherApi'
import {
  validateStaffCoupon,
  redeemStaffCoupon,
  fetchStaffRedemptions,
} from './staffApi'
import {
  DashboardGridIcon,
  BarcodeScanIcon,
  TicketIcon,
  UsersIcon,
  TransactionsIcon,
  BellNotificationIcon,
  ReturnExitIcon,
  ExportDocIcon,
  ChevronRightSmIcon,
  CoinIcon,
  SearchIcon,
  CloseIcon,
  CopyIcon,
  CheckIcon,
} from '../game/icons'
import './dashboard.css'

function formatVietnameseDate(d = new Date()) {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const dayName = days[d.getDay()]
  return `${dayName}, ${d.getDate()} tháng ${d.getMonth() + 1}`
}

function formatDate(val) {
  if (!val) return ''
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleString('vi-VN')
}

function formatDateShort(val) {
  if (!val) return ''
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

function formatNumber(val) {
  return Number(val ?? 0).toLocaleString('vi-VN')
}

function getInitials(name = '') {
  if (!name) return 'FS'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const EMPTY_VOUCHER = {
  name: '',
  description: '',
  discountValue: '',
  priceCoins: 500,
  initialStock: 100,
  active: true,
  imageUrl: '',
  imagePublicId: '',
}

const EMPTY_USER_FORM = {
  username: '',
  email: '',
  password: '',
  displayName: '',
  role: 'CUSTOMER',
  coinBalance: 0,
}

export default function OperationsDashboard({ initialTab = 'overview' }) {
  // --------------------------------------------------------------------------
  // ALL HOOKS MUST REMAIN AT THE TOP LEVEL BEFORE ANY CONDITIONAL RETURNS
  // --------------------------------------------------------------------------
  const [user, setUser] = useState(() => getStoredUser())
  const [activeTab, setActiveTab] = useState(initialTab)

  // Baseline data
  const [vouchers, setVouchers] = useState([])
  const [issuedVouchers, setIssuedVouchers] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [walletTx, setWalletTx] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [loadingInitial, setLoadingInitial] = useState(true)

  // Redeem tab states
  const [scanCode, setScanCode] = useState('')
  const [scanNote, setScanNote] = useState('')
  const [checkingCode, setCheckingCode] = useState(false)
  const [redeemingCode, setRedeemingCode] = useState(false)
  const [scanValidation, setScanValidation] = useState(null)
  const [scanRedeemed, setScanRedeemed] = useState(null)
  const [scanMessage, setScanMessage] = useState('')

  // Voucher tab states
  const [voucherSearch, setVoucherSearch] = useState('')
  const [voucherStatusFilter, setVoucherStatusFilter] = useState('ALL')
  const [createVoucherOpen, setCreateVoucherOpen] = useState(false)
  const [createVoucherForm, setCreateVoucherForm] = useState(EMPTY_VOUCHER)
  const [editingVoucher, setEditingVoucher] = useState(null)
  const [editVoucherForm, setEditVoucherForm] = useState({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  // Users tab states
  const [usersList, setUsersList] = useState([])
  const [usersPage, setUsersPage] = useState(0)
  const [usersTotalPages, setUsersTotalPages] = useState(0)
  const [usersTotalItems, setUsersTotalItems] = useState(0)
  const [usersKeyword, setUsersKeyword] = useState('')
  const [usersRoleFilter, setUsersRoleFilter] = useState('')
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [createUserForm, setCreateUserForm] = useState(EMPTY_USER_FORM)
  const [editingUser, setEditingUser] = useState(null)
  const [editUserForm, setEditUserForm] = useState({ role: 'CUSTOMER', coinBalance: 0 })

  // Transactions tab states
  const [txSearch, setTxSearch] = useState('')
  const [txStatusFilter, setTxStatusFilter] = useState('ALL')
  const [copiedCode, setCopiedCode] = useState(null)

  // Global alert
  const [globalMessage, setGlobalMessage] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  // Fetch current user
  useEffect(() => {
    fetchMeApi().then((fresh) => {
      if (fresh) setUser(fresh)
    })
  }, [])

  // If role is staff, ensure they only have access to 'redeem'
  useEffect(() => {
    if (user && user.role === 'STAFF' && activeTab !== 'redeem') {
      setActiveTab('redeem')
    }
  }, [user, activeTab])

  // Load dashboard baseline data
  const loadBaseData = useCallback(async () => {
    try {
      const [vList, iList, rList, uStats, wList] = await Promise.all([
        adminListVouchers().catch(() => []),
        adminIssuedVouchers().catch(() => []),
        fetchStaffRedemptions().catch(() => []),
        adminUserStats().catch(() => null),
        fetchWalletTransactions().catch(() => []),
      ])
      setVouchers(vList)
      setIssuedVouchers(iList)
      setRedemptions(rList)
      setUserStats(uStats)
      setWalletTx(wList)
    } finally {
      setLoadingInitial(false)
    }
  }, [])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

  // Load users when on users tab
  const loadUsers = useCallback(async (targetPage = usersPage) => {
    if (!isAdmin) return
    try {
      const res = await adminListUsers({
        keyword: usersKeyword,
        role: usersRoleFilter,
        page: targetPage,
        size: 10,
      })
      setUsersList(res.content || [])
      setUsersTotalPages(res.totalPages || 0)
      setUsersTotalItems(res.totalItems || 0)
    } catch (err) {
      console.warn('loadUsers failed', err)
    }
  }, [isAdmin, usersKeyword, usersRoleFilter, usersPage])

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      loadUsers()
    }
  }, [activeTab, isAdmin, loadUsers])

  // Transactions synthesis (combining real issued vouchers, redemptions and wallet transactions)
  const transactionsList = useMemo(() => {
    const list = []

    // Helper to find the coin price of a voucher
    const getVoucherCoinCost = (vId, vName) => {
      if (vId) {
        const found = vouchers.find((v) => v.id === vId)
        if (found && found.priceCoins != null) return Number(found.priceCoins)
      }
      if (vName) {
        const found = vouchers.find((v) => v.name === vName)
        if (found && found.priceCoins != null) return Number(found.priceCoins)
      }
      return 0
    }

    // 1. Issued vouchers (active and used)
    issuedVouchers.forEach((iv, idx) => {
      const cost = getVoucherCoinCost(iv.voucherId, iv.voucherName)
      list.push({
        id: `FS-TX-${iv.id || idx + 1}`,
        voucherCode: iv.code,
        customerName: iv.userName || iv.user?.displayName || iv.user?.username || '—',
        description: iv.voucherName ? `Đổi ${iv.voucherName}` : 'Đổi voucher',
        discountValue: iv.discountValue,
        amount: -cost,
        time: iv.issuedAt ? formatDate(iv.issuedAt) : '—',
        status: iv.status === 'USED' ? 'Hoàn tất' : 'Chờ đổi',
        canRedeem: iv.status !== 'USED',
      })
    })

    // 2. Staff redemptions
    redemptions.forEach((r, idx) => {
      if (!list.some((item) => item.voucherCode === r.couponCode)) {
        const matchingIssued = issuedVouchers.find((iv) => iv.code === r.couponCode)
        const cost = getVoucherCoinCost(matchingIssued?.voucherId, r.voucherName)
        list.push({
          id: `FS-RD-${r.id || idx + 1}`,
          voucherCode: r.couponCode,
          customerName: r.customerName || '—',
          description: r.codeType === 'VOUCHER'
            ? `Đổi voucher ${r.voucherName || r.discountValue || ''}`.trim()
            : `Mã thưởng game ${r.discountPercent}%`,
          discountValue: r.codeType === 'VOUCHER' ? r.discountValue : `Giảm ${r.discountPercent}%`,
          amount: r.codeType === 'VOUCHER' ? -cost : 0,
          time: r.redeemedAt ? formatDate(r.redeemedAt) : '—',
          status: 'Hoàn tất',
          canRedeem: false,
        })
      }
    })

    // 3. User wallet transactions
    walletTx.forEach((tx) => {
      const matchingIv = issuedVouchers.find((iv) => iv.id === tx.issuedVoucherId)
      const code = matchingIv?.code || ''
      if (!code || !list.some((item) => item.voucherCode === code)) {
        list.push({
          id: `FS-WL-${tx.id}`,
          voucherCode: code,
          customerName: tx.userName || user?.displayName || user?.username || '—',
          description: tx.description || (tx.amount > 0 ? 'Thưởng chơi game' : 'Đổi voucher'),
          discountValue: matchingIv?.discountValue || '',
          amount: tx.amount,
          time: tx.createdAt ? formatDate(tx.createdAt) : '—',
          status: 'Hoàn tất',
          canRedeem: matchingIv ? matchingIv.status !== 'USED' : false,
        })
      }
    })

    return list
  }, [issuedVouchers, redemptions, walletTx, vouchers, user])

  // Filtered vouchers list
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const matchKeyword = !voucherSearch || v.name.toLowerCase().includes(voucherSearch.toLowerCase())
      const matchStatus =
        voucherStatusFilter === 'ALL'
          ? true
          : voucherStatusFilter === 'ACTIVE'
            ? v.active && !v.outOfStock
            : voucherStatusFilter === 'OUT_OF_STOCK'
              ? v.outOfStock
              : !v.active
      return matchKeyword && matchStatus
    })
  }, [vouchers, voucherSearch, voucherStatusFilter])

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((tx) => {
      const matchKeyword =
        !txSearch ||
        tx.id.toLowerCase().includes(txSearch.toLowerCase()) ||
        (tx.voucherCode && tx.voucherCode.toLowerCase().includes(txSearch.toLowerCase())) ||
        tx.customerName.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.description.toLowerCase().includes(txSearch.toLowerCase())
      const matchStatus =
        txStatusFilter === 'ALL' ||
        (txStatusFilter === 'COMPLETED' && tx.status === 'Hoàn tất') ||
        (txStatusFilter === 'PENDING' && tx.status === 'Chờ đổi')
      return matchKeyword && matchStatus
    })
  }, [transactionsList, txSearch, txStatusFilter])

  // Coins issued per day for the last 7 days (real data only)
  const weeklyCoinSeries = useMemo(() => {
    const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    const days = []
    const totals = new Array(7).fill(0)

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      days.push({ key: d.toDateString(), label: DAY_LABELS[d.getDay()] })
    }

    const indexOfDay = (val) => {
      const d = new Date(val)
      if (Number.isNaN(d.getTime())) return -1
      const key = new Date(d)
      key.setHours(0, 0, 0, 0)
      return days.findIndex((day) => day.key === key.toDateString())
    }

    walletTx.forEach((tx) => {
      const idx = indexOfDay(tx.createdAt)
      if (idx >= 0 && Number(tx.amount) > 0) totals[idx] += Number(tx.amount)
    })

    const max = Math.max(...totals, 0)

    return days.map((day, i) => ({
      ...day,
      value: totals[i],
      height: max > 0 ? `${Math.round((totals[i] / max) * 100)}%` : '0%',
      isPeak: max > 0 && totals[i] === max,
    }))
  }, [walletTx])

  const weeklyCoinTotal = useMemo(
    () => weeklyCoinSeries.reduce((sum, day) => sum + day.value, 0),
    [weeklyCoinSeries]
  )

  // Quick redeem handler directly from transactions table

  const handleQuickRedeem = async (code) => {
    if (!code) return
    setActiveTab('redeem')
    setScanCode(code)
    setCheckingCode(true)
    setScanMessage('')
    setScanValidation(null)
    setScanRedeemed(null)
    try {
      const res = await validateStaffCoupon(code.trim())
      setScanValidation(res)
    } catch (err) {
      setScanMessage(err.message || 'Không kiểm tra được mã. Vui lòng xác nhận lại.')
    } finally {
      setCheckingCode(false)
    }
  }

  const handleCopyCode = (code) => {
    if (!code) return
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // --------------------------------------------------------------------------
  // REDEEM TAB HANDLERS
  // --------------------------------------------------------------------------
  const handleValidateCode = async (e) => {
    e?.preventDefault()
    if (!scanCode.trim() || checkingCode) return
    setCheckingCode(true)
    setScanMessage('')
    setScanValidation(null)
    setScanRedeemed(null)
    try {
      const res = await validateStaffCoupon(scanCode.trim())
      setScanValidation(res)
    } catch (err) {
      setScanMessage(err.message || 'Không kiểm tra được mã. Vui lòng thử lại.')
    } finally {
      setCheckingCode(false)
    }
  }

  const handleRedeemCode = async () => {
    if (!scanCode.trim() || redeemingCode) return
    setRedeemingCode(true)
    setScanMessage('')
    try {
      const res = await redeemStaffCoupon(scanCode.trim(), scanNote.trim())
      setScanRedeemed(res)
      setScanValidation(null)
      setScanCode('')
      setScanNote('')
      await loadBaseData()
    } catch (err) {
      setScanMessage(err.message || 'Đổi mã thất bại. Vui lòng thử lại.')
    } finally {
      setRedeemingCode(false)
    }
  }

  // --------------------------------------------------------------------------
  // VOUCHER TAB HANDLERS
  // --------------------------------------------------------------------------
  const handleCreateVoucherSubmit = async (e) => {
    e.preventDefault()
    try {
      await adminCreateVoucher({
        name: createVoucherForm.name,
        description: createVoucherForm.description,
        discountValue: createVoucherForm.discountValue,
        priceCoins: Number(createVoucherForm.priceCoins),
        initialStock: Number(createVoucherForm.initialStock),
        active: createVoucherForm.active,
        imageUrl: createVoucherForm.imageUrl || null,
        imagePublicId: createVoucherForm.imagePublicId || null,
      })
      setCreateVoucherOpen(false)
      setCreateVoucherForm(EMPTY_VOUCHER)
      setImagePreview(null)
      setGlobalMessage('Tạo voucher thành công!')
      await loadBaseData()
    } catch (err) {
      setGlobalMessage(err.message || 'Tạo voucher thất bại')
    }
  }

  const handleEditVoucherSubmit = async (e) => {
    e.preventDefault()
    if (!editingVoucher) return
    try {
      await adminUpdateVoucher(editingVoucher.id, {
        name: editVoucherForm.name,
        description: editVoucherForm.description,
        discountValue: editVoucherForm.discountValue,
        priceCoins: Number(editVoucherForm.priceCoins),
        remainingStock: Number(editVoucherForm.remainingStock),
        active: editVoucherForm.active,
        imageUrl: editVoucherForm.imageUrl || null,
        imagePublicId: editVoucherForm.imagePublicId || null,
      })
      setEditingVoucher(null)
      setImagePreview(null)
      setGlobalMessage('Cập nhật voucher thành công!')
      await loadBaseData()
    } catch (err) {
      setGlobalMessage(err.message || 'Cập nhật voucher thất bại')
    }
  }

  const handleImageFileChange = async (e, formType) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploadingImage(true)
    try {
      const res = await adminUploadVoucherImage(file)
      if (res?.imageUrl) {
        if (formType === 'create') {
          setCreateVoucherForm((p) => ({ ...p, imageUrl: res.imageUrl, imagePublicId: res.publicId || '' }))
        } else {
          setEditVoucherForm((p) => ({ ...p, imageUrl: res.imageUrl, imagePublicId: res.publicId || '' }))
        }
      }
    } catch (err) {
      setGlobalMessage(err.message || 'Tải ảnh thất bại')
    } finally {
      setUploadingImage(false)
    }
  }

  // --------------------------------------------------------------------------
  // USER TAB HANDLERS
  // --------------------------------------------------------------------------
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault()
    try {
      await adminCreateUser(createUserForm)
      setCreateUserOpen(false)
      setCreateUserForm(EMPTY_USER_FORM)
      setGlobalMessage('Tạo tài khoản thành công!')
      await Promise.all([loadUsers(0), loadBaseData()])
    } catch (err) {
      setGlobalMessage(err.message || 'Tạo tài khoản thất bại')
    }
  }

  const handleEditUserSubmit = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      await adminUpdateUser(editingUser.id, {
        role: editUserForm.role,
        coinBalance: Number(editUserForm.coinBalance),
      })
      setEditingUser(null)
      setGlobalMessage('Cập nhật người dùng thành công!')
      await Promise.all([loadUsers(), loadBaseData()])
    } catch (err) {
      setGlobalMessage(err.message || 'Cập nhật thất bại')
    }
  }

  const handleToggleUserActive = async (u) => {
    try {
      await adminSetUserActive(u.id, !u.active)
      await Promise.all([loadUsers(), loadBaseData()])
    } catch (err) {
      setGlobalMessage(err.message || 'Không đổi được trạng thái tài khoản')
    }
  }

  // --------------------------------------------------------------------------
  // TRANSACTIONS EXPORT
  // --------------------------------------------------------------------------
  const handleExportTransactions = () => {
    const rows = [
      ['Mã giao dịch', 'Mã voucher', 'Người chơi', 'Nội dung', 'FiveCoin', 'Thời gian', 'Trạng thái'],
      ...filteredTransactions.map((tx) => [
        tx.id,
        tx.voucherCode || '',
        tx.customerName,
        tx.description,
        tx.amount > 0 ? `+${tx.amount}` : String(tx.amount),
        tx.time,
        tx.status,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `foodrush_transactions_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const goHome = () => {
    window.location.assign('/')
  }

  // --------------------------------------------------------------------------
  // CONDITIONAL GATES FOR UNAUTHENTICATED OR UNAUTHORIZED USERS
  // --------------------------------------------------------------------------
  if (!user && !loadingInitial) {
    return (
      <div className="dash-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="dash-card" style={{ maxWidth: 440, textAlign: 'center', margin: 'auto' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔐</div>
          <h2 className="dash-card__title" style={{ fontSize: 20, marginBottom: 8 }}>Vui lòng đăng nhập</h2>
          <p className="dash-card__desc" style={{ color: '#7D756D', marginBottom: 20 }}>
            Bạn cần đăng nhập tài khoản Quản trị viên hoặc Nhân viên để truy cập Bảng điều khiển.
          </p>
          <button type="button" className="dash-btn-primary" onClick={goHome} style={{ width: '100%', justifyContent: 'center' }}>
            ← Về trang chính
          </button>
        </div>
      </div>
    )
  }

  if (user && user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return (
      <div className="dash-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="dash-card" style={{ maxWidth: 440, textAlign: 'center', margin: 'auto' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⛔</div>
          <h2 className="dash-card__title" style={{ fontSize: 20, marginBottom: 8 }}>Không có quyền truy cập</h2>
          <p className="dash-card__desc" style={{ color: '#7D756D', marginBottom: 20 }}>
            Khu vực này chỉ dành cho tài khoản Quản trị viên (ADMIN) hoặc Nhân viên cửa hàng (STAFF).
          </p>
          <button type="button" className="dash-btn-primary" onClick={goHome} style={{ width: '100%', justifyContent: 'center' }}>
            ← Về trang chính
          </button>
        </div>
      </div>
    )
  }

  // Derived metrics for overview
  const totalUsersCount = userStats?.totalUsers ?? usersTotalItems ?? 0
  const totalCoinsIssued = userStats?.totalCoins ?? 0
  const totalVouchersRedeemed = redemptions.length
  const conversionRate = userStats?.conversionRate ? `${userStats.conversionRate}%` : '—'

  const featuredVoucher = vouchers[0] || null
  const featuredIssued = featuredVoucher?.issuedCount ?? 0
  const featuredInitialStock = featuredVoucher?.initialStock ?? 0
  const featuredRemaining = featuredVoucher?.remainingStock ?? 0
  const featuredUsedPercent = featuredInitialStock > 0
    ? Math.min(100, Math.round((featuredIssued / featuredInitialStock) * 100))
    : 0

  const currentMeta = {
    overview: {
      eyebrow: 'BẢNG ĐIỀU KHIỂN',
      title: 'Tổng quan',
      desc: 'Theo dõi hoạt động của FiveStar Food Rush.',
    },
    redeem: {
      eyebrow: 'BẢNG ĐIỀU KHIỂN',
      title: 'Quầy đổi mã',
      desc: 'Kiểm tra và xác nhận voucher tại cửa hàng.',
    },
    vouchers: {
      eyebrow: 'BẢNG ĐIỀU KHIỂN',
      title: 'Quản lý voucher',
      desc: 'Tạo và theo dõi các ưu đãi đổi bằng FiveCoin.',
    },
    users: {
      eyebrow: 'BẢNG ĐIỀU KHIỂN',
      title: 'Người chơi',
      desc: 'Quản lý tài khoản và hoạt động người chơi.',
    },
    transactions: {
      eyebrow: 'BẢNG ĐIỀU KHIỂN',
      title: 'Lịch sử giao dịch',
      desc: 'Theo dõi toàn bộ luồng FiveCoin trong hệ thống.',
    },
  }[activeTab] || { eyebrow: 'BẢNG ĐIỀU KHIỂN', title: 'Vận hành', desc: '' }

  return (
    <div className="dash-layout">
      {/* --------------------------------------------------------------------
          Sidebar (Dark sleek theme matching the template)
          -------------------------------------------------------------------- */}
      <aside className="dash-sidebar">
        <div className="dash-sidebar__brand">
          <div className="dash-sidebar__logo-badge">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L14.4 8.6H21.5L15.8 12.8L18 19.4L12 15.2L6 19.4L8.2 12.8L2.5 8.6H9.6L12 2Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
          <div className="dash-sidebar__brand-text">
            <span className="dash-sidebar__brand-title">
              FiveStar <span>Rush</span>
            </span>
            <span className="dash-sidebar__brand-sub">OPERATIONS</span>
          </div>
        </div>

        <nav className="dash-sidebar__nav">
          {/* For STAFF: ONLY 'Đổi mã'. For ADMIN: ALL 5 tabs */}
          {isAdmin && (
            <button
              type="button"
              className={`dash-sidebar__nav-item ${activeTab === 'overview' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="dash-sidebar__nav-icon">
                <DashboardGridIcon size={19} />
              </span>
              <span className="dash-sidebar__nav-label">Tổng quan</span>
              {activeTab === 'overview' && <span className="dash-sidebar__active-dot" />}
            </button>
          )}

          <button
            type="button"
            className={`dash-sidebar__nav-item ${activeTab === 'redeem' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('redeem')}
          >
            <span className="dash-sidebar__nav-icon">
              <BarcodeScanIcon size={19} />
            </span>
            <span className="dash-sidebar__nav-label">Đổi mã</span>
            {activeTab === 'redeem' && <span className="dash-sidebar__active-dot" />}
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                className={`dash-sidebar__nav-item ${activeTab === 'vouchers' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('vouchers')}
              >
                <span className="dash-sidebar__nav-icon">
                  <TicketIcon size={19} />
                </span>
                <span className="dash-sidebar__nav-label">Voucher</span>
                {activeTab === 'vouchers' && <span className="dash-sidebar__active-dot" />}
              </button>

              <button
                type="button"
                className={`dash-sidebar__nav-item ${activeTab === 'users' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <span className="dash-sidebar__nav-icon">
                  <UsersIcon size={19} />
                </span>
                <span className="dash-sidebar__nav-label">Người chơi</span>
                {activeTab === 'users' && <span className="dash-sidebar__active-dot" />}
              </button>

              <button
                type="button"
                className={`dash-sidebar__nav-item ${activeTab === 'transactions' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                <span className="dash-sidebar__nav-icon">
                  <TransactionsIcon size={19} />
                </span>
                <span className="dash-sidebar__nav-label">Giao dịch</span>
                {activeTab === 'transactions' && <span className="dash-sidebar__active-dot" />}
              </button>
            </>
          )}
        </nav>

        {/* User profile & return button (replacing logout button as requested) */}
        <div className="dash-sidebar__footer">
          <div className="dash-user-card">
            <div className="dash-user-card__info">
              <div className="dash-user-card__avatar">
                {getInitials(user?.displayName || user?.username)}
              </div>
              <div className="dash-user-card__details">
                <span className="dash-user-card__name">
                  {user?.displayName || user?.username}
                </span>
                <span className="dash-user-card__role">
                  {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="dash-user-card__return-btn"
              onClick={goHome}
              title="Về trang chính"
              aria-label="Về trang chính"
            >
              <ReturnExitIcon size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* --------------------------------------------------------------------
          Main Content Area (Warm cream theme)
          -------------------------------------------------------------------- */}
      <main className="dash-main">
        {/* Global Toast / Alert */}
        {globalMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              background: '#FFFFFF',
              border: '1px solid #EFE9DE',
              marginBottom: 20,
              boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>🔔 {globalMessage}</span>
            <button
              type="button"
              onClick={() => setGlobalMessage('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <CloseIcon size={16} />
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="dash-header">
          <div>
            <div className="dash-header__eyebrow">{currentMeta.eyebrow}</div>
            <h1 className="dash-header__title">{currentMeta.title}</h1>
            <p className="dash-header__desc">{currentMeta.desc}</p>
          </div>

          <div className="dash-header__actions">
            {activeTab === 'vouchers' && isAdmin && (
              <button
                type="button"
                className="dash-btn-primary"
                onClick={() => {
                  setCreateVoucherForm(EMPTY_VOUCHER)
                  setImagePreview(null)
                  setCreateVoucherOpen(true)
                }}
              >
                + Tạo voucher
              </button>
            )}

            {activeTab === 'users' && isAdmin && (
              <button
                type="button"
                className="dash-btn-primary"
                onClick={() => {
                  setCreateUserForm(EMPTY_USER_FORM)
                  setCreateUserOpen(true)
                }}
              >
                + Thêm tài khoản
              </button>
            )}

            {activeTab === 'transactions' && isAdmin && (
              <button
                type="button"
                className="dash-btn-primary"
                onClick={handleExportTransactions}
              >
                <ExportDocIcon size={16} />
                + Xuất báo cáo
              </button>
            )}

            <div className="dash-header__date-pill">
              {formatVietnameseDate()}
            </div>

            <button
              type="button"
              className="dash-header__bell-btn"
              title="Thông báo"
              aria-label="Thông báo"
            >
              <BellNotificationIcon size={18} />
              <span className="dash-header__bell-dot" />
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------------
            TAB 1: TỔNG QUAN (Image 1)
            ------------------------------------------------------------------ */}
        {activeTab === 'overview' && isAdmin && (
          <>
            {/* Top 4 stat cards */}
            <div className="dash-stats-grid">
              <div className="dash-stat-card">
                <div className="dash-stat-card__icon-wrap is-red">
                  <UsersIcon size={22} />
                </div>
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Người chơi</span>
                  <strong className="dash-stat-card__val">{formatNumber(totalUsersCount)}</strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__icon-wrap is-gold">
                  <CoinIcon size={22} />
                </div>
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Coin đã phát</span>
                  <strong className="dash-stat-card__val">{formatNumber(totalCoinsIssued)}</strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__icon-wrap is-teal">
                  <TicketIcon size={22} />
                </div>
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Voucher đã đổi</span>
                  <strong className="dash-stat-card__val">{formatNumber(totalVouchersRedeemed)}</strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__icon-wrap is-gray">
                  <TransactionsIcon size={22} />
                </div>
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Tỉ lệ đổi thưởng</span>
                  <strong className="dash-stat-card__val">{conversionRate}</strong>
                </div>
              </div>
            </div>

            {/* Mid Section: 7-day Bar Chart + Featured Voucher */}
            <div className="dash-overview-grid">
              <div className="dash-card">
                <div className="dash-card__header">
                  <div className="dash-card__header-left">
                    <span className="dash-card__eyebrow">HIỆU SUẤT 7 NGÀY</span>
                    <h3 className="dash-card__title">FiveCoin được phát</h3>
                    <div className="dash-card__stat-hero">
                      <span className="dash-card__stat-number">{formatNumber(weeklyCoinTotal)}</span>
                      <span className="dash-card__stat-badge">7 ngày gần nhất</span>
                    </div>
                  </div>

                  <select className="dash-select-box" defaultValue="7days">
                    <option value="7days">7 ngày gần nhất</option>
                  </select>
                </div>

                <div className="dash-bar-chart">
                  {weeklyCoinSeries.some((bar) => bar.value > 0) ? (
                    weeklyCoinSeries.map((bar, i) => (
                      <div key={i} className="dash-bar-col">
                        <div className="dash-bar-col__tooltip">{formatNumber(bar.value)} Coin</div>
                        <div
                          className={`dash-bar-col__fill ${bar.isPeak ? 'is-peak' : ''}`}
                          style={{ height: bar.height }}
                        />
                        <span className="dash-bar-col__label">{bar.label}</span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        color: '#8E857B',
                        padding: '24px 0',
                      }}
                    >
                      Chưa có dữ liệu coin phát trong 7 ngày gần nhất.
                    </div>
                  )}
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card__header">
                  <div className="dash-card__header-left">
                    <span className="dash-card__eyebrow">CHIẾN DỊCH</span>
                    <h3 className="dash-card__title">Voucher nổi bật</h3>
                  </div>
                  <button
                    type="button"
                    className="dash-action-btn"
                    onClick={() => setActiveTab('vouchers')}
                    title="Xem danh sách voucher"
                  >
                    <ChevronRightSmIcon size={18} />
                  </button>
                </div>

                {featuredVoucher ? (
                  <div className="dash-featured-voucher">
                    <div className="dash-voucher-banner">
                      {featuredVoucher.discountValue || '—'}
                    </div>

                    <div>
                      <div className="dash-featured-voucher__name">{featuredVoucher.name}</div>
                      <div className="dash-featured-voucher__stat">
                        {formatNumber(featuredIssued)} trên {formatNumber(featuredInitialStock)} voucher
                        đã được đổi
                      </div>
                    </div>

                    <div className="dash-progress-wrap">
                      <div className="dash-progress-bar">
                        <div
                          className="dash-progress-bar__fill"
                          style={{ width: `${featuredUsedPercent}%` }}
                        />
                      </div>
                      <div className="dash-progress-meta">
                        <span>{featuredUsedPercent}% đã dùng</span>
                        <span>Còn {formatNumber(featuredRemaining)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ textAlign: 'center', color: '#8E857B', padding: '32px 0' }}
                  >
                    Chưa có voucher nào trong hệ thống.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Recent Activity with voucher code and quick-redeem */}
            <div className="dash-card">
              <div className="dash-card__header">
                <div className="dash-card__header-left">
                  <span className="dash-card__eyebrow">HOẠT ĐỘNG</span>
                  <h3 className="dash-card__title">Giao dịch gần đây</h3>
                </div>
                <button
                  type="button"
                  className="dash-btn-ghost"
                  onClick={() => setActiveTab('transactions')}
                >
                  Xem tất cả ›
                </button>
              </div>

              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>MÃ GIAO DỊCH</th>
                      <th>MÃ VOUCHER / CODE</th>
                      <th>NGƯỜI CHƠI</th>
                      <th>NỘI DUNG</th>
                      <th>FIVECOIN</th>
                      <th>THỜI GIAN</th>
                      <th>TRẠNG THÁI</th>
                      <th style={{ textAlign: 'right' }}>ĐỔI NHANH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: '#8E857B' }}>
                          Chưa có giao dịch nào.
                        </td>
                      </tr>
                    ) : (
                      transactionsList.slice(0, 5).map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: 700, color: '#1B1814' }}>{tx.id}</td>
                        <td>
                          {tx.voucherCode ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span className="dash-code-badge">{tx.voucherCode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(tx.voucherCode)}
                                title="Sao chép mã"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                              >
                                {copiedCode === tx.voucherCode ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#A0988E' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{tx.customerName}</td>
                        <td>{tx.description}</td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: tx.amount > 0 ? '#1E824C' : '#E54028',
                          }}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </td>
                        <td style={{ color: '#8E857B' }}>{tx.time}</td>
                        <td>
                          <span
                            className={`dash-badge ${
                              tx.status === 'Hoàn tất' ? 'dash-badge--success' : 'dash-badge--warning'
                            }`}
                          >
                            <span className="dash-badge__dot" />
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {tx.canRedeem && tx.voucherCode ? (
                            <button
                              type="button"
                              className="dash-btn-quick-redeem"
                              onClick={() => handleQuickRedeem(tx.voucherCode)}
                              title="Đổi mã này ngay"
                            >
                              Đổi ngay ›
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: '#9E978D', fontWeight: 600 }}>
                              {tx.voucherCode ? 'Đã đổi' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------
            TAB 2: ĐỔI MÃ (Image 2)
            ------------------------------------------------------------------ */}
        {activeTab === 'redeem' && (
          <>
            <div className="dash-stats-grid dash-stats-grid--3">
              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Đã đổi hôm nay</span>
                  <strong className="dash-stat-card__val">
                    {formatNumber(
                      redemptions.filter((r) => {
                        const today = new Date().toDateString()
                        return new Date(r.redeemedAt).toDateString() === today
                      }).length
                    )}
                  </strong>
                  <span className="dash-stat-card__sub is-neutral">Trong ngày</span>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Tổng lượt đổi</span>
                  <strong className="dash-stat-card__val">
                    {formatNumber(redemptions.length)}
                  </strong>
                  <span className="dash-stat-card__sub is-neutral">Từ khi vận hành</span>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Voucher đổi bằng coin</span>
                  <strong className="dash-stat-card__val">
                    {String(redemptions.filter((r) => r.codeType === 'VOUCHER').length).padStart(2, '0')}
                  </strong>
                  <span className="dash-stat-card__sub is-neutral">Đang hoạt động</span>
                </div>
              </div>
            </div>

            {/* Code check panel */}
            <div className="dash-redeem-panel">
              <div className="dash-redeem-panel__head">
                <div className="dash-redeem-panel__icon">
                  <BarcodeScanIcon size={24} />
                </div>
                <div>
                  <h3 className="dash-redeem-panel__title">Nhập mã của khách</h3>
                  <p className="dash-redeem-panel__sub">
                    Kiểm tra voucher trước khi xác nhận sử dụng tại cửa hàng.
                  </p>
                </div>
              </div>

              <form className="dash-redeem-form" onSubmit={handleValidateCode}>
                <div className="dash-redeem-input-wrap">
                  <input
                    className="dash-redeem-input"
                    autoFocus
                    placeholder="Nhập mã voucher hoặc coupon..."
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="dash-redeem-btn"
                  disabled={checkingCode || !scanCode.trim()}
                >
                  {checkingCode ? 'Đang kiểm tra...' : 'Kiểm tra mã ›'}
                </button>
              </form>

              {scanMessage && (
                <div style={{ color: '#D83B25', fontWeight: 600, marginTop: 8 }}>
                  ⚠️ {scanMessage}
                </div>
              )}

              {/* Validation Result */}
              {scanValidation && (
                <div
                  className={`dash-validation-box ${
                    scanValidation.valid ? 'is-valid' : 'is-invalid'
                  }`}
                >
                  <div className="dash-validation-box__head">
                    <span style={{ fontSize: 20 }}>
                      {scanValidation.valid ? '✅' : '⛔'}
                    </span>
                    <h3>{scanValidation.valid ? 'Mã hợp lệ' : 'Mã không thể sử dụng'}</h3>
                  </div>

                  <p style={{ margin: '4px 0 10px', fontSize: 13.5 }}>
                    Mã: <strong>{scanValidation.code}</strong> ·{' '}
                    <span
                      className={`dash-badge ${
                        scanValidation.valid ? 'dash-badge--success' : 'dash-badge--danger'
                      }`}
                    >
                      {scanValidation.codeType === 'VOUCHER'
                        ? 'Voucher đổi bằng coin'
                        : 'Coupon game'}
                    </span>
                  </p>

                  <div className="dash-validation-fields">
                    <div className="dash-validation-field">
                      <span>Khách hàng</span>
                      <strong>{scanValidation.ownerName || '—'}</strong>
                    </div>
                    <div className="dash-validation-field">
                      <span>Ưu đãi</span>
                      <strong>
                        {scanValidation.discountValue ||
                          (scanValidation.discountPercent
                            ? `Giảm ${scanValidation.discountPercent}%`
                            : '—')}
                      </strong>
                    </div>
                    <div className="dash-validation-field">
                      <span>Hạn sử dụng</span>
                      <strong>{scanValidation.expiresAt ? formatDateShort(scanValidation.expiresAt) : '—'}</strong>
                    </div>
                  </div>

                  {scanValidation.valid ? (
                    <div className="dash-redeem-actions">
                      <input
                        placeholder="Ghi chú nhân viên (tùy chọn)..."
                        value={scanNote}
                        onChange={(e) => setScanNote(e.target.value)}
                      />
                      <button
                        type="button"
                        className="dash-btn-primary"
                        onClick={handleRedeemCode}
                        disabled={redeemingCode}
                      >
                        {redeemingCode ? 'Đang đổi...' : '✓ Xác nhận đổi'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="dash-btn-ghost"
                      onClick={() => setScanValidation(null)}
                    >
                      Nhập mã khác
                    </button>
                  )}
                </div>
              )}

              {/* Redeemed success banner */}
              {scanRedeemed && (
                <div className="dash-validation-box is-valid">
                  <div className="dash-validation-box__head">
                    <span style={{ fontSize: 22 }}>🎉</span>
                    <h3>Đổi mã thành công!</h3>
                  </div>
                  <p style={{ margin: '6px 0 12px', fontSize: 14 }}>
                    Đã áp dụng ưu đãi{' '}
                    <strong>
                      {scanRedeemed.discountValue ||
                        (scanRedeemed.discountPercent
                          ? `${scanRedeemed.discountPercent}%`
                          : '')}
                    </strong>{' '}
                    cho khách hàng <strong>{scanRedeemed.customerName}</strong>.
                  </p>
                  <button
                    type="button"
                    className="dash-btn-ghost"
                    onClick={() => setScanRedeemed(null)}
                  >
                    Nhập mã tiếp theo
                  </button>
                </div>
              )}
            </div>

            {/* Store activity: Redemptions History */}
            <div className="dash-card">
              <div className="dash-card__header">
                <div className="dash-card__header-left">
                  <span className="dash-card__eyebrow">HOẠT ĐỘNG CỬA HÀNG</span>
                  <h3 className="dash-card__title">Lịch sử đổi mã</h3>
                </div>
                <button
                  type="button"
                  className="dash-btn-ghost"
                  onClick={loadBaseData}
                >
                  ↻ Làm mới
                </button>
              </div>

              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>MÃ</th>
                      <th>KHÁCH HÀNG</th>
                      <th>ƯU ĐÃI</th>
                      <th>NHÂN VIÊN</th>
                      <th>THỜI GIAN</th>
                      <th>TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.length > 0 ? (
                      redemptions.map((r, i) => (
                        <tr key={`${r.codeType}-${r.id || i}`}>
                          <td style={{ fontWeight: 700, color: '#1B1814' }}>
                            <span className="dash-code-badge">{r.couponCode}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                          <td>
                            {r.codeType === 'VOUCHER'
                              ? r.discountValue
                              : `Giảm ${r.discountPercent}%`}
                          </td>
                          <td>{r.staffName || '—'}</td>
                          <td style={{ color: '#8E857B' }}>
                            {formatDate(r.redeemedAt)}
                          </td>
                          <td>
                            <span className="dash-badge dash-badge--success">
                              <span className="dash-badge__dot" />
                              Đã sử dụng
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#8E857B' }}>
                          Chưa có lượt đổi voucher nào được ghi nhận.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------
            TAB 3: VOUCHER (Image 3)
            ------------------------------------------------------------------ */}
        {activeTab === 'vouchers' && isAdmin && (
          <>
            <div className="dash-stats-grid dash-stats-grid--3">
              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Voucher đang chạy</span>
                  <strong className="dash-stat-card__val">
                    {String(vouchers.filter((v) => v.active && !v.outOfStock).length).padStart(2, '0')}
                  </strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Lượt đổi tháng này</span>
                  <strong className="dash-stat-card__val">
                    {formatNumber(issuedVouchers.length)}
                  </strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Sắp hết lượt</span>
                  <strong className="dash-stat-card__val">
                    {String(vouchers.filter((v) => (v.remainingStock ?? 0) <= 5).length).padStart(2, '0')}
                  </strong>
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="dash-filter-bar">
              <div className="dash-filter-bar__left">
                <div className="dash-search-box">
                  <SearchIcon size={18} />
                  <input
                    placeholder="Tìm theo tên hoặc mã voucher..."
                    value={voucherSearch}
                    onChange={(e) => setVoucherSearch(e.target.value)}
                  />
                </div>
                <select
                  className="dash-select-box"
                  value={voucherStatusFilter}
                  onChange={(e) => setVoucherStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang chạy</option>
                  <option value="OUT_OF_STOCK">Sắp hết / Hết lượt</option>
                  <option value="INACTIVE">Tạm dừng</option>
                </select>
              </div>
            </div>

            {/* Voucher List Table */}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>VOUCHER</th>
                    <th>CHI PHÍ</th>
                    <th>ĐÃ ĐỔI</th>
                    <th>TRẠNG THÁI</th>
                    <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: '#8E857B' }}>
                        Không có voucher nào khớp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((v) => {
                    const isOutOfStock = v.remainingStock <= 0 || v.outOfStock
                    return (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {v.imageUrl ? (
                              <img
                                src={v.imageUrl}
                                alt={v.name}
                                style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 10,
                                  background: '#FDF0ED',
                                  color: '#E54028',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: 18,
                                }}
                              >
                                🎟️
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 800, color: '#1B1814' }}>{v.name}</div>
                              <div style={{ fontSize: 11.5, color: '#8E857B', fontWeight: 600 }}>
                                {v.code || `ID: #${v.id}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                            <CoinIcon size={16} />
                            <span>{v.priceCoins}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {formatNumber(v.issuedCount || 0)} / {formatNumber(v.initialStock || 0)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`dash-badge ${
                              !v.active
                                ? 'dash-badge--neutral'
                                : isOutOfStock
                                  ? 'dash-badge--warning'
                                  : 'dash-badge--success'
                            }`}
                          >
                            <span className="dash-badge__dot" />
                            {!v.active ? 'Tạm dừng' : isOutOfStock ? 'Sắp hết' : 'Đang chạy'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="dash-action-btn"
                            style={{ display: 'inline-grid' }}
                            onClick={() => {
                              setEditingVoucher(v)
                              setEditVoucherForm({
                                name: v.name,
                                description: v.description || '',
                                discountValue: v.discountValue || '',
                                priceCoins: v.priceCoins,
                                remainingStock: v.remainingStock ?? 0,
                                active: v.active,
                                imageUrl: v.imageUrl || '',
                                imagePublicId: v.imagePublicId || '',
                              })
                              setImagePreview(v.imageUrl || null)
                            }}
                            title="Chỉnh sửa voucher"
                          >
                            <ChevronRightSmIcon size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------
            TAB 4: NGƯỜI CHƠI (Image 4)
            ------------------------------------------------------------------ */}
        {activeTab === 'users' && isAdmin && (
          <>
            <div className="dash-stats-grid dash-stats-grid--3">
              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Tổng người chơi</span>
                  <strong className="dash-stat-card__val">
                    {formatNumber(totalUsersCount)}
                  </strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Hoạt động hôm nay</span>
                  <strong className="dash-stat-card__val">
                    {formatNumber(userStats?.activeToday ?? 0)}
                  </strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Tài khoản mới</span>
                  <strong className="dash-stat-card__val">
                    {formatNumber(userStats?.newUsers ?? 0)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="dash-filter-bar">
              <div className="dash-filter-bar__left">
                <div className="dash-search-box">
                  <SearchIcon size={18} />
                  <input
                    placeholder="Tìm tên hoặc email..."
                    value={usersKeyword}
                    onChange={(e) => setUsersKeyword(e.target.value)}
                  />
                </div>
                <select
                  className="dash-select-box"
                  value={usersRoleFilter}
                  onChange={(e) => setUsersRoleFilter(e.target.value)}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="STAFF">Nhân viên</option>
                  <option value="ADMIN">Quản trị</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>NGƯỜI CHƠI</th>
                    <th>FIVECOIN</th>
                    <th>LƯỢT CHƠI / ĐIỂM</th>
                    <th>VAI TRÒ</th>
                    <th>NGÀY THAM GIA</th>
                    <th style={{ textAlign: 'right' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#8E857B' }}>
                        Không có người dùng nào.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u, idx) => {
                    const initials = getInitials(u.displayName || u.username)
                    const tint = idx % 3 === 0 ? 'is-coral' : idx % 3 === 1 ? 'is-gold' : 'is-teal'
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className={`dash-avatar-circle ${tint}`}>{initials[0]}</div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#1B1814' }}>
                                {u.displayName || u.username}
                              </div>
                              <div style={{ fontSize: 12, color: '#8E857B' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                            <CoinIcon size={16} />
                            <span>{formatNumber(u.coinBalance)}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{formatNumber(u.totalScore || 0)}</span>
                        </td>
                        <td>
                          <span
                            className={`dash-badge ${
                              u.role === 'ADMIN'
                                ? 'dash-badge--danger'
                                : u.role === 'STAFF'
                                  ? 'dash-badge--warning'
                                  : 'dash-badge--neutral'
                            }`}
                          >
                            <span className="dash-badge__dot" />
                            {u.role === 'ADMIN'
                              ? 'Quản trị'
                              : u.role === 'STAFF'
                                ? 'Nhân viên'
                                : 'Khách hàng'}
                          </span>
                        </td>
                        <td style={{ color: '#8E857B' }}>
                          {formatDateShort(u.createdAt)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="dash-action-btn"
                            style={{ display: 'inline-grid' }}
                            onClick={() => {
                              setEditingUser(u)
                              setEditUserForm({ role: u.role, coinBalance: u.coinBalance })
                            }}
                            title="Chỉnh sửa người dùng"
                          >
                            <ChevronRightSmIcon size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  }))}
                </tbody>
              </table>

              {usersTotalPages > 1 && (
                <div className="dash-pagination">
                  <span>
                    Trang {usersPage + 1} / {usersTotalPages} ({usersTotalItems} tài khoản)
                  </span>
                  <div className="dash-pagination__pages">
                    {Array.from({ length: usersTotalPages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`dash-pagination__page-btn ${usersPage === i ? 'is-active' : ''}`}
                        onClick={() => {
                          setUsersPage(i)
                          loadUsers(i)
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------
            TAB 5: GIAO DỊCH (Image 5) - With Voucher Code & Quick Redeem
            ------------------------------------------------------------------ */}
        {activeTab === 'transactions' && isAdmin && (
          <>
            <div className="dash-stats-grid dash-stats-grid--3">
              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Giao dịch hôm nay</span>
                  <strong className="dash-stat-card__val">{formatNumber(filteredTransactions.length)}</strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Coin đã phát</span>
                  <strong className="dash-stat-card__val">
                    {formatNumber(
                      filteredTransactions
                        .filter((tx) => tx.amount > 0)
                        .reduce((sum, tx) => sum + Number(tx.amount), 0)
                    )}
                  </strong>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-card__content">
                  <span className="dash-stat-card__label">Coin đã sử dụng</span>
                  <strong className="dash-stat-card__val">
                    {formatNumber(
                      Math.abs(
                        filteredTransactions
                          .filter((tx) => tx.amount < 0)
                          .reduce((sum, tx) => sum + Number(tx.amount), 0)
                      )
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="dash-filter-bar">
              <div className="dash-filter-bar__left">
                <div className="dash-search-box">
                  <SearchIcon size={18} />
                  <input
                    placeholder="Tìm mã giao dịch, mã voucher, người chơi..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                  />
                </div>
                <select
                  className="dash-select-box"
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="COMPLETED">Hoàn tất</option>
                  <option value="PENDING">Chờ đổi</option>
                </select>
              </div>
            </div>

            {/* Transactions Table with Voucher Code & Quick Redeem Button */}
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>MÃ GIAO DỊCH</th>
                    <th>MÃ VOUCHER / CODE</th>
                    <th>NGƯỜI CHƠI</th>
                    <th>NỘI DUNG</th>
                    <th>FIVECOIN</th>
                    <th>THỜI GIAN</th>
                    <th>TRẠNG THÁI</th>
                    <th style={{ textAlign: 'right' }}>ĐỔI NHANH</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: '#8E857B' }}>
                        Không có giao dịch nào khớp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 700, color: '#1B1814' }}>{tx.id}</td>
                      <td>
                        {tx.voucherCode ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span className="dash-code-badge">{tx.voucherCode}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(tx.voucherCode)}
                              title="Sao chép mã"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                            >
                              {copiedCode === tx.voucherCode ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#A0988E' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{tx.customerName}</td>
                      <td>{tx.description}</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: tx.amount > 0 ? '#1E824C' : '#E54028',
                        }}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </td>
                      <td style={{ color: '#8E857B' }}>{tx.time}</td>
                      <td>
                        <span
                          className={`dash-badge ${
                            tx.status === 'Hoàn tất' ? 'dash-badge--success' : 'dash-badge--warning'
                          }`}
                        >
                          <span className="dash-badge__dot" />
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {tx.canRedeem && tx.voucherCode ? (
                          <button
                            type="button"
                            className="dash-btn-quick-redeem"
                            onClick={() => handleQuickRedeem(tx.voucherCode)}
                            title="Đổi mã này ngay tại quầy"
                          >
                            Đổi ngay ›
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9E978D', fontWeight: 600 }}>
                            {tx.voucherCode ? 'Đã đổi' : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* --------------------------------------------------------------------
          MODALS: Create / Edit Voucher
          -------------------------------------------------------------------- */}
      {createVoucherOpen && (
        <div className="dash-modal-backdrop" onClick={() => setCreateVoucherOpen(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal__header">
              <h2>Tạo mới Voucher</h2>
              <button
                type="button"
                className="dash-action-btn"
                onClick={() => setCreateVoucherOpen(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateVoucherSubmit}>
              <div className="dash-modal__body">
                <div className="dash-form-group">
                  <label>Tên voucher *</label>
                  <input
                    className="dash-form-input"
                    required
                    placeholder="Ví dụ: Giảm 50.000đ khi mua burger"
                    value={createVoucherForm.name}
                    onChange={(e) =>
                      setCreateVoucherForm({ ...createVoucherForm, name: e.target.value })
                    }
                  />
                </div>

                <div className="dash-form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    className="dash-form-textarea"
                    rows={2}
                    placeholder="Điều kiện áp dụng..."
                    value={createVoucherForm.description}
                    onChange={(e) =>
                      setCreateVoucherForm({ ...createVoucherForm, description: e.target.value })
                    }
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="dash-form-group">
                    <label>Mức giảm *</label>
                    <input
                      className="dash-form-input"
                      required
                      placeholder="Ví dụ: 50.000đ hoặc 20%"
                      value={createVoucherForm.discountValue}
                      onChange={(e) =>
                        setCreateVoucherForm({ ...createVoucherForm, discountValue: e.target.value })
                      }
                    />
                  </div>
                  <div className="dash-form-group">
                    <label>Giá đổi (FiveCoin) *</label>
                    <input
                      type="number"
                      className="dash-form-input"
                      required
                      min={0}
                      value={createVoucherForm.priceCoins}
                      onChange={(e) =>
                        setCreateVoucherForm({ ...createVoucherForm, priceCoins: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="dash-form-group">
                    <label>Số lượng phát hành ban đầu *</label>
                    <input
                      type="number"
                      className="dash-form-input"
                      required
                      min={1}
                      value={createVoucherForm.initialStock}
                      onChange={(e) =>
                        setCreateVoucherForm({ ...createVoucherForm, initialStock: e.target.value })
                      }
                    />
                  </div>
                  <div className="dash-form-group">
                    <label>Ảnh đại diện (tùy chọn)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, 'create')}
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div style={{ marginTop: 6 }}>
                    <img
                      src={imagePreview}
                      alt="Xem trước"
                      style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover' }}
                    />
                    {uploadingImage && <p style={{ fontSize: 12, color: '#D49B22' }}>Đang tải ảnh lên Cloudinary...</p>}
                  </div>
                )}
              </div>
              <div className="dash-modal__footer">
                <button
                  type="button"
                  className="dash-btn-ghost"
                  onClick={() => setCreateVoucherOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="dash-btn-primary" disabled={uploadingImage}>
                  {uploadingImage ? 'Đang xử lý...' : 'Tạo voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingVoucher && (
        <div className="dash-modal-backdrop" onClick={() => setEditingVoucher(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal__header">
              <h2>Chỉnh sửa Voucher</h2>
              <button
                type="button"
                className="dash-action-btn"
                onClick={() => setEditingVoucher(null)}
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <form onSubmit={handleEditVoucherSubmit}>
              <div className="dash-modal__body">
                <div className="dash-form-group">
                  <label>Tên voucher *</label>
                  <input
                    className="dash-form-input"
                    required
                    value={editVoucherForm.name}
                    onChange={(e) =>
                      setEditVoucherForm({ ...editVoucherForm, name: e.target.value })
                    }
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="dash-form-group">
                    <label>Mức giảm *</label>
                    <input
                      className="dash-form-input"
                      required
                      value={editVoucherForm.discountValue}
                      onChange={(e) =>
                        setEditVoucherForm({ ...editVoucherForm, discountValue: e.target.value })
                      }
                    />
                  </div>
                  <div className="dash-form-group">
                    <label>Giá đổi (FiveCoin) *</label>
                    <input
                      type="number"
                      className="dash-form-input"
                      required
                      min={0}
                      value={editVoucherForm.priceCoins}
                      onChange={(e) =>
                        setEditVoucherForm({ ...editVoucherForm, priceCoins: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="dash-form-group">
                    <label>Kho còn lại *</label>
                    <input
                      type="number"
                      className="dash-form-input"
                      required
                      min={0}
                      value={editVoucherForm.remainingStock}
                      onChange={(e) =>
                        setEditVoucherForm({ ...editVoucherForm, remainingStock: e.target.value })
                      }
                    />
                  </div>
                  <div className="dash-form-group">
                    <label>Trạng thái</label>
                    <select
                      className="dash-form-select"
                      value={editVoucherForm.active ? 'true' : 'false'}
                      onChange={(e) =>
                        setEditVoucherForm({ ...editVoucherForm, active: e.target.value === 'true' })
                      }
                    >
                      <option value="true">Đang kích hoạt</option>
                      <option value="false">Tạm dừng</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="dash-modal__footer">
                <button
                  type="button"
                  className="dash-btn-ghost"
                  onClick={() => setEditingVoucher(null)}
                >
                  Hủy
                </button>
                <button type="submit" className="dash-btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          MODALS: Create / Edit User
          -------------------------------------------------------------------- */}
      {createUserOpen && (
        <div className="dash-modal-backdrop" onClick={() => setCreateUserOpen(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal__header">
              <h2>Thêm tài khoản người dùng</h2>
              <button
                type="button"
                className="dash-action-btn"
                onClick={() => setCreateUserOpen(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUserSubmit}>
              <div className="dash-modal__body">
                <div className="dash-form-group">
                  <label>Tên đăng nhập (username) *</label>
                  <input
                    className="dash-form-input"
                    required
                    value={createUserForm.username}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, username: e.target.value })
                    }
                  />
                </div>
                <div className="dash-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="dash-form-input"
                    required
                    value={createUserForm.email}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="dash-form-group">
                  <label>Mật khẩu *</label>
                  <input
                    type="password"
                    className="dash-form-input"
                    required
                    value={createUserForm.password}
                    onChange={(e) =>
                      setCreateUserForm({ ...createUserForm, password: e.target.value })
                    }
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="dash-form-group">
                    <label>Vai trò *</label>
                    <select
                      className="dash-form-select"
                      value={createUserForm.role}
                      onChange={(e) =>
                        setCreateUserForm({ ...createUserForm, role: e.target.value })
                      }
                    >
                      <option value="CUSTOMER">Khách hàng</option>
                      <option value="STAFF">Nhân viên</option>
                      <option value="ADMIN">Quản trị viên</option>
                    </select>
                  </div>
                  <div className="dash-form-group">
                    <label>Số dư coin ban đầu</label>
                    <input
                      type="number"
                      className="dash-form-input"
                      value={createUserForm.coinBalance}
                      onChange={(e) =>
                        setCreateUserForm({ ...createUserForm, coinBalance: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="dash-modal__footer">
                <button
                  type="button"
                  className="dash-btn-ghost"
                  onClick={() => setCreateUserOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="dash-btn-primary">
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="dash-modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal__header">
              <h2>Cập nhật tài khoản</h2>
              <button
                type="button"
                className="dash-action-btn"
                onClick={() => setEditingUser(null)}
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <form onSubmit={handleEditUserSubmit}>
              <div className="dash-modal__body">
                <div style={{ marginBottom: 12 }}>
                  <strong>{editingUser.displayName || editingUser.username}</strong>
                  <div style={{ fontSize: 13, color: '#8E857B' }}>{editingUser.email}</div>
                </div>

                <div className="dash-form-group">
                  <label>Vai trò *</label>
                  <select
                    className="dash-form-select"
                    value={editUserForm.role}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, role: e.target.value })
                    }
                  >
                    <option value="CUSTOMER">Khách hàng</option>
                    <option value="STAFF">Nhân viên</option>
                    <option value="ADMIN">Quản trị</option>
                  </select>
                </div>

                <div className="dash-form-group">
                  <label>Số dư FiveCoin *</label>
                  <input
                    type="number"
                    className="dash-form-input"
                    value={editUserForm.coinBalance}
                    onChange={(e) =>
                      setEditUserForm({ ...editUserForm, coinBalance: e.target.value })
                    }
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="dash-btn-ghost"
                    onClick={() => handleToggleUserActive(editingUser)}
                  >
                    {editingUser.active ? '🔒 Khóa tài khoản này' : '🔓 Mở khóa tài khoản'}
                  </button>
                </div>
              </div>
              <div className="dash-modal__footer">
                <button
                  type="button"
                  className="dash-btn-ghost"
                  onClick={() => setEditingUser(null)}
                >
                  Hủy
                </button>
                <button type="submit" className="dash-btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
