import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Upload, X } from 'lucide-react'
import { Button, Input, Select, ToggleGroup, Modal } from './UI'
import api, { createTransaction, createTransactionWithScreenshot, updateTransaction, updateScreenshot, fetchClients } from '../utils/api'
import { today } from '../utils/format'

const EMPTY = {
  date: today(),
  type: 'expense',
  category: 'company',
  client_id: '',
  description: '',
  amount: '',
  notes: '',
}

export default function TransactionForm({ open, onClose, onSuccess, editData }) {
  const [form, setForm] = useState(EMPTY)
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [clients, setClients] = useState([])

  useEffect(() => {
    // Fetch clients for dropdown
    const getClients = async () => {
      try {
        const data = await fetchClients()
        setClients(data)
      } catch (err) { console.error('Failed to fetch clients', err) }
    }
    if (open) getClients()
  }, [open])

  useEffect(() => {
    if (editData) {
      setForm({
        date: editData.date,
        type: editData.type,
        category: editData.category,
        client_id: editData.client_id || '',
        description: editData.description,
        amount: String(editData.amount),
        notes: editData.notes || '',
      })
      setImgPreview(editData.screenshot_path ? `http://localhost:8000${editData.screenshot_path}` : null)
    } else {
      setForm(EMPTY)
      setImgFile(null)
      setImgPreview(null)
    }
    setErrors({})
  }, [editData, open])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.description.trim()) e.description = 'Required'
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      e.amount = 'Enter a valid amount'
    if (!form.date) e.date = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImgFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        date: form.date,
        type: form.type,
        category: form.category,
        client_id: form.category === 'client' && form.client_id ? parseInt(form.client_id) : null,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        notes: form.notes || null,
      }

      if (editData) {
        await updateTransaction(editData.id, payload)
        if (imgFile) {
          const fd = new FormData()
          fd.append('screenshot', imgFile)
          await updateScreenshot(editData.id, fd)
        }
        toast.success('Transaction updated!')
      } else {
        if (imgFile) {
          const fd = new FormData()
          Object.entries(payload).forEach(([k, v]) => v != null && fd.append(k, v))
          fd.append('screenshot', imgFile)
          await createTransactionWithScreenshot(fd)
        } else {
          await createTransaction(payload)
        }
        toast.success('Transaction added!')
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editData ? 'Edit Transaction' : 'New Transaction'}>
      <div className="flex-col gap-4">
        {/* Responsive Grid for Date and amount */}
        <div className="grid-2">
          <Input
            label="Date *"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            error={errors.date}
          />
          <Input
            label="Amount (₹) *"
            type="number"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            error={errors.amount}
          />
        </div>

        <div className="grid-2">
          {/* Type */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Type *</label>
            <ToggleGroup
              value={form.type}
              onChange={v => set('type', v)}
              options={[{ value: 'income', label: '↑ Income' }, { value: 'expense', label: '↓ Expense' }]}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Category *</label>
            <ToggleGroup
              value={form.category}
              onChange={v => set('category', v)}
              options={[
                { value: 'client', label: '🤝 Client' },
                { value: 'company', label: '🏢 Company' },
                { value: 'personal', label: '🏠 Personal' }
              ]}
            />
          </div>
        </div>

        {/* Client Selector (if category is client) */}
        {form.category === 'client' && (
          <div className="fade-in">
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Select Client</label>
            <Select
              value={form.client_id}
              onChange={e => set('client_id', e.target.value)}
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        )}

        {/* Description */}
        <Input
          label="Description *"
          type="text"
          placeholder="e.g. Invoice #1042, Office Rent"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          error={errors.description}
        />

        {/* Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 4 }}>Notes</label>
          <textarea
            rows={3}
            placeholder="Client name, invoice #, remarks..."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            style={{ width: '100%', resize: 'vertical', minHeight: 72 }}
          />
        </div>

        {/* Screenshot Upload */}
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>
            Receipt / Screenshot
          </label>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            background: 'var(--bg-base)',
            transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
          >
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            <Upload size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', color: imgFile ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {imgFile ? imgFile.name : 'Upload receipt or bank screenshot (PNG, JPG, max 5MB)'}
            </span>
          </label>

          {imgPreview && (
            <div style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}>
              <img
                src={imgPreview}
                alt="preview"
                style={{ maxWidth: 200, maxHeight: 130, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'block' }}
              />
              <button
                onClick={() => { setImgFile(null); setImgPreview(null) }}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  background: 'rgba(0,0,0,0.75)', color: '#fff',
                  border: 'none', borderRadius: '50%',
                  width: 22, height: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
            {loading ? 'Saving...' : editData ? 'Update Transaction' : 'Add Transaction'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}
