import { useEffect, useState } from 'react'
import {
  adminListVouchers,
  adminCreateVoucher,
  adminUpdateVoucher,
  adminUpdateVoucherStatus,
  adminIssuedVouchers,
} from './voucherApi'

const emptyCreate = { name: '', description: '', discountValue: '', priceCoins: 0, initialStock: 0, active: true }

export default function AdminVoucherPanel({ onClose }) {
  const [vouchers, setVouchers] = useState([])
  const [issued, setIssued] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [createForm, setCreateForm] = useState(emptyCreate)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})

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
      })
      setCreateForm(emptyCreate)
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Create failed')
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
    })
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
      })
      setEditing(null)
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Update failed')
    }
  }

  const toggleStatus = async (v) => {
    setMessage('')
    try {
      await adminUpdateVoucherStatus(v.id, !v.active)
      await refresh()
    } catch (err) {
      setMessage(err.message || 'Status update failed')
    }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="result-card" style={{ maxWidth: 980, width: '96%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Admin Voucher Management</h2>
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
        </div>
        {message && <p style={{ color: '#b00' }}>{message}</p>}
        {loading ? <p>Loading...</p> : (
          <>
            <h3>Voucher types</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Name</th><th>Price</th><th>Initial</th><th>Remaining</th><th>Issued</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => (
                    <tr key={v.id}>
                      <td>{v.name}</td>
                      <td>{v.priceCoins}</td>
                      <td>{v.initialStock}</td>
                      <td>{v.remainingStock}</td>
                      <td>{v.issuedCount}</td>
                      <td>{v.active ? 'Active' : 'Inactive'}{v.outOfStock ? ' (OOS)' : ''}</td>
                      <td>
                        <button className="btn" onClick={() => startEdit(v)}>Edit</button>
                        <button className="btn btn--ghost" onClick={() => toggleStatus(v)}>
                          {v.active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editing && (
              <form onSubmit={handleUpdate} style={{ marginTop: 16, border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
                <h4>Edit voucher</h4>
                <input placeholder="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ margin: 4 }} />
                <input placeholder="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} style={{ margin: 4 }} />
                <input placeholder="Discount value" value={editForm.discountValue} onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value })} style={{ margin: 4 }} />
                <input type="number" placeholder="Price" value={editForm.priceCoins} onChange={(e) => setEditForm({ ...editForm, priceCoins: e.target.value })} style={{ margin: 4 }} />
                <input type="number" placeholder="Remaining stock" value={editForm.remainingStock} onChange={(e) => setEditForm({ ...editForm, remainingStock: e.target.value })} style={{ margin: 4 }} />
                <label style={{ margin: 4 }}>
                  <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} /> Active
                </label>
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn--primary" type="submit">Save</button>
                  <button className="btn" type="button" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </form>
            )}

            <form onSubmit={handleCreate} style={{ marginTop: 16, border: '1px solid #ccc', padding: 12, borderRadius: 8 }}>
              <h4>Create voucher</h4>
              <input required placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} style={{ margin: 4 }} />
              <input placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} style={{ margin: 4 }} />
              <input placeholder="Discount value" value={createForm.discountValue} onChange={(e) => setCreateForm({ ...createForm, discountValue: e.target.value })} style={{ margin: 4 }} />
              <input required type="number" min="0" placeholder="Price coins" value={createForm.priceCoins} onChange={(e) => setCreateForm({ ...createForm, priceCoins: e.target.value })} style={{ margin: 4 }} />
              <input required type="number" min="0" placeholder="Initial stock" value={createForm.initialStock} onChange={(e) => setCreateForm({ ...createForm, initialStock: e.target.value })} style={{ margin: 4 }} />
              <label style={{ margin: 4 }}>
                <input type="checkbox" checked={createForm.active} onChange={(e) => setCreateForm({ ...createForm, active: e.target.checked })} /> Active
              </label>
              <div style={{ marginTop: 8 }}>
                <button className="btn btn--primary" type="submit">Create</button>
              </div>
            </form>

            <h3 style={{ marginTop: 16 }}>Issued vouchers ({issued.length})</h3>
            <div style={{ maxHeight: 240, overflow: 'auto' }}>
              {issued.map((v) => (
                <div key={v.id} style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
                  {v.code} - {v.voucherName} - user #{v.userId} - {v.redemptionDate} - {v.status}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}