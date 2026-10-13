import { useEffect, useState } from 'react'
import '../pages/admin.css'
import {
  adminListVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminUpdateVoucherStatus,
  adminIssuedVouchers,
  adminUploadVoucherImage,
} from './voucherApi'

const emptyCreate = { name: '', description: '', discountValue: '', priceCoins: 0, initialStock: 0, active: true, imageUrl: '', imagePublicId: '' }

export default function AdminVoucherPanel({ onClose }) {
  const [vouchers, setVouchers] = useState([])
  const [issued, setIssued] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [createOpen, setCreateOpen] = useState(false)

  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUploadMessage, setImageUploadMessage] = useState('')

  const activeCount = vouchers.filter((v) => v.active).length

  const resetImageState = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setImageUploadMessage('')
    setUploadingImage(false)
  }

  const refresh = async () => {
    setLoading(true)
    try {
      const [vs, is] = await Promise.all([adminListVouchers(), adminIssuedVouchers()])
      setVouchers(vs)
      setIssued(is)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await adminCreateVoucher({
        name: createForm.name,
        description: createForm.description,
        discountValue: createForm.discountValue,
        priceCoins: Number(createForm.priceCoins),
        initialStock: Number(createForm.initialStock),
        active: createForm.active,
        imageUrl: createForm.imageUrl || null,
        imagePublicId: createForm.imagePublicId || null,
      })
      setCreateForm(emptyCreate)
      setCreateOpen(false)
      resetImageState()
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Tạo voucher thất bại')
    }
  }

  const startEdit = (v) => {
    setEditing(v.id)
    setEditForm({
      name: v.name,
      description: v.description || '',
      discountValue: v.discountValue || '',
      priceCoins: v.priceCoins,
      remainingStock: v.remainingStock,
      active: v.active,
      imageUrl: v.imageUrl || '',
      imagePublicId: v.imagePublicId || '',
    })
    resetImageState()
    setImagePreview(v.imageUrl || null)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await adminUpdateVoucher(editing, {
        name: editForm.name,
        description: editForm.description,
        discountValue: editForm.discountValue,
        priceCoins: Number(editForm.priceCoins),
        remainingStock: Number(editForm.remainingStock),
        active: editForm.active,
        imageUrl: editForm.imageUrl || null,
        imagePublicId: editForm.imagePublicId || null,
      })
      setEditing(null)
      resetImageState()
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Cập nhật voucher thất bại')
    }
  }

  const toggleStatus = async (v) => {
    setMessage('')
    try {
      await adminUpdateVoucherStatus(v.id, !v.active)
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Cập nhật trạng thái thất bại')
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setImageUploadMessage('')
  }

  const handleImageUpload = async (target) => {
    if (!selectedImage || uploadingImage) return
    setUploadingImage(true)
    setImageUploadMessage('')
    try {
      const result = await adminUploadVoucherImage(selectedImage)
      if (!result || !result.imageUrl) throw new Error('Tải ảnh thất bại')
      if (target === 'create') {
        setCreateForm((prev) => ({ ...prev, imageUrl: result.imageUrl, imagePublicId: result.publicId || '' }))
      } else {
        setEditForm((prev) => ({ ...prev, imageUrl: result.imageUrl, imagePublicId: result.publicId || '' }))
      }
      setSelectedImage(null)
      setImagePreview(result.imageUrl)
      setImageUploadMessage('Tải ảnh thành công')
    } catch (err) {
      setImageUploadMessage(err.message || 'Tải ảnh thất bại')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (target) => {
    if (target === 'create') {
      setCreateForm((prev) => ({ ...prev, imageUrl: '', imagePublicId: '' }))
    } else {
      setEditForm((prev) => ({ ...prev, imageUrl: '', imagePublicId: '' }))
    }
    setSelectedImage(null)
    setImagePreview(null)
    setImageUploadMessage('')
  }

  const renderImageSection = (target) => {
    const form = target === 'create' ? createForm : editForm
    return (
      <div className="admin-field full">
        <label>Ảnh voucher (tùy chọn)</label>
        {imagePreview && (
          <img src={imagePreview} alt="Xem trước ảnh voucher" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, marginBottom: 8, border: '1px solid #ead7bb' }} />
        )}
        {!imagePreview && form.imageUrl && (
          <img src={form.imageUrl} alt="Ảnh voucher" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, marginBottom: 8, border: '1px solid #ead7bb' }} />
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} disabled={uploadingImage} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--ghost" onClick={() => handleImageUpload(target)} disabled={!selectedImage || uploadingImage}>
            {uploadingImage ? 'Đang tải ảnh...' : 'Tải ảnh lên'}
          </button>
          {(form.imageUrl || imagePreview || selectedImage) && (
            <button type="button" className="btn btn-cancel" onClick={() => removeImage(target)} disabled={uploadingImage}>Xóa ảnh</button>
          )}
        </div>
        {imageUploadMessage && <p style={{ margin: '8px 0 0', color: '#7a6343', fontSize: 13 }}>{imageUploadMessage}</p>}
      </div>
    )
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <h2>Quản lý voucher ứng dụng</h2>
            <p>Bảng điều khiển dành cho quản trị viên Five Star</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--primary" onClick={() => { resetImageState(); setCreateOpen(true) }}>Tạo mới voucher</button>
            <button className="btn btn--ghost" onClick={onClose}>Đóng</button>
          </div>
        </header>

        {message && <p style={{ color: '#b00', margin: '0 0 12px' }}>{message}</p>}

        <section className="admin-summary">
          <div className="admin-card">
            <span>Loại voucher</span>
            <strong>{vouchers.length}</strong>
          </div>
          <div className="admin-card">
            <span>Đang hoạt động</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="admin-card">
            <span>Voucher đã phát</span>
            <strong>{issued.length}</strong>
          </div>
        </section>

        {loading ? <p>Đang tải...</p> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ảnh</th><th>Tên</th><th>Giá</th><th>Ban đầu</th><th>Còn lại</th><th>Đã phát</th><th>Trạng thái</th><th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => (
                    <tr key={v.id}>
                      <td>
                        {v.imageUrl ? (
                          <img src={v.imageUrl} alt={v.name} style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid #ead7bb' }} />
                        ) : (
                          <div style={{ width: 56, height: 40, borderRadius: 8, background: '#f4e7cf', display: 'grid', placeItems: 'center', color: '#8a6a3b', fontSize: 11 }}>No img</div>
                        )}
                      </td>
                      <td>{v.name}</td>
                      <td>{v.priceCoins}</td>
                      <td>{v.initialStock}</td>
                      <td>{v.remainingStock}</td>
                      <td>{v.issuedCount}</td>
                      <td>
                        <span className={`badge ${v.active ? 'active' : 'inactive'}`}>
                          {v.active ? 'Đang hoạt động' : 'Đã tắt'}
                        </span>
                        {v.outOfStock && <span className="badge oos">Hết</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn" onClick={() => startEdit(v)}>Sửa</button>
                          <button className="btn btn--ghost" onClick={() => toggleStatus(v)}>
                            {v.active ? 'Tắt' : 'Bật'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className="admin-issued">
              <h3 style={{ margin: 0 }}>Voucher đã phát ({issued.length})</h3>
              <div className="admin-issued-list">
                {issued.map((v) => (
                  <div className="admin-issued-item" key={v.id}>
                    {v.code} - {v.voucherName} - người dùng #{v.userId} - {v.redemptionDate} - {v.status}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {createOpen && (
        <div className="admin-modal-backdrop" onClick={() => { setCreateOpen(false); resetImageState() }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="admin-header" style={{ marginBottom: 12 }}>
              <div>
                <h2>Tạo mới voucher</h2>
                <p>Thêm loại voucher mới cho ứng dụng</p>
              </div>
              <button className="btn btn--ghost" onClick={() => { setCreateOpen(false); resetImageState() }}>Đóng</button>
            </header>
            <form onSubmit={handleCreate}>
              <div className="admin-form-grid">
                <div className="admin-field full">
                  <label>Tên voucher</label>
                  <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="50,000 VND discount voucher" />
                </div>
                <div className="admin-field full">
                  <label>Mô tả</label>
                  <input value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="50,000 VND off your order" />
                </div>
                <div className="admin-field">
                  <label>Giá trị giảm</label>
                  <input value={createForm.discountValue} onChange={(e) => setCreateForm({ ...createForm, discountValue: e.target.value })} placeholder="50,000 VND" />
                </div>
                <div className="admin-field">
                  <label>Giá (điểm/xu)</label>
                  <input required type="number" min="0" value={createForm.priceCoins} onChange={(e) => setCreateForm({ ...createForm, priceCoins: e.target.value })} placeholder="120" />
                </div>
                <div className="admin-field">
                  <label>Số lượng ban đầu</label>
                  <input required type="number" min="0" value={createForm.initialStock} onChange={(e) => setCreateForm({ ...createForm, initialStock: e.target.value })} placeholder="1" />
                </div>
                <div className="admin-field">
                  <div className="admin-checkbox">
                    <input type="checkbox" checked={createForm.active} onChange={(e) => setCreateForm({ ...createForm, active: e.target.checked })} /> Đang hoạt động
                  </div>
                </div>
                {renderImageSection('create')}
              </div>
              <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-cancel" type="button" onClick={() => { setCreateOpen(false); resetImageState() }}>Hủy</button>
                <button className="btn btn-save" type="submit" disabled={uploadingImage}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="admin-modal-backdrop" onClick={() => { setEditing(null); resetImageState() }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="admin-header" style={{ marginBottom: 12 }}>
              <div>
                <h2>Sửa voucher #{editing}</h2>
                <p>Cập nhật thông tin và tồn kho</p>
              </div>
              <button className="btn btn--ghost" onClick={() => { setEditing(null); resetImageState() }}>Đóng</button>
            </header>
            <form onSubmit={handleUpdate}>
              <div className="admin-form-grid">
                <div className="admin-field full">
                  <label>Tên voucher</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="50,000 VND discount voucher" />
                </div>
                <div className="admin-field full">
                  <label>Mô tả</label>
                  <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="50,000 VND off your order" />
                </div>
                <div className="admin-field">
                  <label>Giá trị giảm (VND)</label>
                  <input value={editForm.discountValue} onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value })} placeholder="50,000 VND" />
                </div>
                <div className="admin-field">
                  <label>Giá (điểm/xu)</label>
                  <input type="number" value={editForm.priceCoins} onChange={(e) => setEditForm({ ...editForm, priceCoins: e.target.value })} placeholder="120" />
                </div>
                <div className="admin-field">
                  <label>Số lượng ban đầu (Tồn kho)</label>
                  <input type="number" value={editForm.remainingStock} onChange={(e) => setEditForm({ ...editForm, remainingStock: e.target.value })} placeholder="1" />
                </div>
                <div className="admin-field">
                  <div className="admin-checkbox">
                    <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} /> Đang hoạt động
                  </div>
                </div>
                {renderImageSection('edit')}
              </div>
              <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-cancel" type="button" onClick={() => { setEditing(null); resetImageState() }}>Hủy</button>
                <button className="btn btn-save" type="submit" disabled={uploadingImage}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
