import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Edit2, Trash2, ZoomIn } from 'lucide-react'
import { SecureImage, Modal, Badge, Button } from './UI'
import { deleteTransaction } from '../utils/api'
import { fmtCurrency, fmtDate } from '../utils/format'

export default function TransactionDetail({ tx, open, onClose, onEdit, onDeleted }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [imgOpen, setImgOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!tx) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteTransaction(tx.id)
      toast.success('Transaction deleted')
      onDeleted()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  const isIncome = tx.type === 'income'
  const amtColor = isIncome ? 'var(--green)' : 'var(--red)'

  return (
    <>
      <Modal open={open && !imgOpen} onClose={onClose} title="Transaction Details">
        {/* Amount Header */}
        <div style={{
          textAlign: 'center', padding: '1rem 0 1.25rem',
          borderBottom: '1px solid var(--border)', marginBottom: '1.25rem',
        }}>
          <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: amtColor }}>
            {isIncome ? '+' : '-'}₹{fmtCurrency(tx.amount)}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 6 }}>{tx.description}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
            <Badge text={tx.type} variant={tx.type} />
            <Badge text={tx.category} variant={tx.category} />
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.25rem' }}>
          {(() => {
            const detailsList = [
              { label: 'Date', value: fmtDate(tx.date) },
              { label: 'Running Balance', value: `₹${fmtCurrency(tx.running_balance)}` },
            ];
            if (tx.category === 'client' && tx.client) {
              detailsList.push({
                label: 'Client',
                value: tx.client.company ? `${tx.client.name} (${tx.client.company})` : tx.client.name
              });
            }
            detailsList.push({ label: 'Notes', value: tx.notes || '—' });
            return detailsList.map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', minWidth: 120 }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, textAlign: 'right', color: label === 'Running Balance' ? 'var(--text-primary)' : undefined }}>{value}</span>
              </div>
            ));
          })()}
        </div>

        {/* Screenshot */}
        {tx.screenshot_name && (
          <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 8 }}>Transaction Screenshot</div>
            <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={() => setImgOpen(true)}>
              <SecureImage
                filename={tx.screenshot_name}
                alt="receipt"
                style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'block' }}
              />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
              >
                <ZoomIn size={22} color="#fff" style={{ opacity: 0 }} />
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>{tx.screenshot_name} · Click to enlarge</div>
          </div>
        )}

        {/* Actions */}
        {!confirmDel ? (
          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <Button onClick={() => { onEdit(tx); onClose() }} style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
              <Edit2 size={14} /> Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmDel(true)} style={{ gap: 6 }}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Are you sure? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="danger" onClick={handleDelete} disabled={deleting} style={{ flex: 1, justifyContent: 'center' }}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDel(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Full-screen image */}
      {imgOpen && tx.screenshot_name && (
        <div
          onClick={() => setImgOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.93)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', cursor: 'zoom-out',
          }}
        >
          <SecureImage filename={tx.screenshot_name} alt="receipt full" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 'var(--radius-md)', objectFit: 'contain' }} />
          <div style={{ position: 'absolute', bottom: 20, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Click anywhere to close</div>
        </div>
      )}
    </>
  )
}
