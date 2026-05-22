import React, { useState, useEffect } from 'react'
import { Card, Badge, StatCard, Button, Modal, Input, Spinner } from '../../components/UI'
import { fetchTransactions, fetchEvents, createEvent, deleteEvent } from '../../utils/api'
import { Plus, X, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { fmtCurrency, fmtDate, fmtMonth, thisMonth } from '../../utils/format'

export default function Calendar() {
  const [curr, setCurr] = useState(new Date())
  const [txs, setTxs] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selDay, setSelDay] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', time: '', color: 'var(--accent)' })
  const [saving, setSaving] = useState(false)

  // Use a stable string for dependencies - derived from state
  const [monthStr, setMonthStr] = useState(() => {
    try {
      return new Date().toISOString().slice(0, 7)
    } catch (e) {
      return '2024-04' 
    }
  })

  useEffect(() => {
    try {
      setMonthStr(curr.toISOString().slice(0, 7))
    } catch (e) {
      console.error('Date parsing error', e)
    }
  }, [curr])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!monthStr) return
      setLoading(true)
      try {
        console.log('[Calendar] Loading data for:', monthStr)
        const [t, e] = await Promise.all([
          fetchTransactions({ month: monthStr }),
          fetchEvents(monthStr)
        ])
        if (active) {
          setTxs(t || [])
          setEvents(e || [])
        }
      } catch (err) {
        console.error('[Calendar] Error loading data:', err)
        if (active) toast.error('Failed to load month data')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [monthStr])

  const handleAddEvent = async () => {
    if (!form.title) return toast.error('Enter a title')
    setSaving(true)
    try {
      const dateStr = `${monthStr}-${String(selDay).padStart(2, '0')}`
      await createEvent({ ...form, date: dateStr })
      toast.success('Event added')
      setShowForm(false)
      setForm({ title: '', description: '', time: '', color: 'var(--accent)' })
      // Reload events
      const updated = await fetchEvents(monthStr)
      setEvents(updated || [])
    } catch (e) {
      toast.error(e.message || 'Failed to add event')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try {
      await deleteEvent(id)
      setEvents(events.filter(e => e.id !== id))
      toast.success('Event deleted')
    } catch (e) {
      toast.error(e.message || 'Failed to delete event')
    }
  }

  // Pre-calculate calendar grid
  const daysInMonth = new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate()
  const startDay = new Date(curr.getFullYear(), curr.getMonth(), 1).getDay()
  
  const daysGrid = []
  for (let i = 0; i < startDay; i++) daysGrid.push(null)
  for (let i = 1; i <= daysInMonth; i++) daysGrid.push(i)

  const getDayTxs = (day) => {
    if (!day) return []
    const dStr = `${monthStr}-${String(day).padStart(2, '0')}`
    return txs.filter(t => t.date === dStr)
  }

  const getDayEvents = (day) => {
    if (!day) return []
    const dStr = `${monthStr}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dStr)
  }

  const changeMonth = (delta) => {
    const d = new Date(curr)
    d.setMonth(d.getMonth() + delta)
    setCurr(d)
  }

  const safeFmtMonth = (m) => {
    try { return fmtMonth(m) } catch (e) { return m || '—' }
  }

  return (
    <div className="fade-up calendar-root">
      <div className="calendar-header">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Events & Transactions</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 2 }}>Financial planning and reminders</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setCurr(new Date())} size="sm">Today</Button>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
            <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></Button>
            <div style={{ minWidth: 140, textAlign: 'center', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {safeFmtMonth(monthStr)}
            </div>
            <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>

      <Card style={{ padding: '1rem', position: 'relative', minHeight: '400px' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backdropFilter: 'blur(2px)' }}>
            <Spinner size={32} />
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="calendar-weekday-header">
              <span className="weekday-full">{d}</span>
              <span className="weekday-short">{d.slice(0, 2)}</span>
            </div>
          ))}
          
          {daysGrid.map((day, idx) => {
            const dayTxs = getDayTxs(day)
            const dayEvents = getDayEvents(day)
            const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
            const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
            
            return (
              <div 
                key={idx} 
                onClick={() => { if (day) { setSelDay(day); setShowForm(true) } }}
                className="calendar-cell"
                style={{ 
                  background: day ? 'var(--bg-card)' : 'transparent',
                  opacity: day ? 1 : 0,
                  cursor: day ? 'pointer' : 'default',
                }}
              >
                {day && (
                  <>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: dayTxs.length > 0 || dayEvents.length > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{day}</span>
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {inc > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)' }} />}
                      {exp > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--red)' }} />}
                      {dayEvents.map(e => (
                        <div key={e.id} style={{ width: 4, height: 4, borderRadius: '50%', background: e.color || 'var(--accent)' }} />
                      ))}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="calendar-event-pills">
                        {dayEvents.slice(0, 2).map(e => (
                          <div key={e.id} style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)', background: 'rgba(212,175,55,0.1)', padding: '2px 4px', borderRadius: 4, marginBottom: 2 }}>
                            {e.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={`Day View: ${safeFmtMonth(monthStr)} ${selDay || ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input 
            label="Event Name *" 
            placeholder="e.g. Income tax deadline" 
            icon={<CalendarIcon size={14} />}
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Time" 
              type="time" 
              icon={<Clock size={14} />}
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Label Color</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['var(--accent)', 'var(--blue)', 'var(--green)', 'var(--red)', 'var(--amber)'].map(c => (
                  <div 
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    style={{ 
                      width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: form.color === c ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: form.color === c ? '0 0 0 1px var(--accent)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <Input 
            label="Extra Notes" 
            placeholder="Meeting link, location, etc." 
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>Daily Schedule</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selDay && getDayEvents(selDay).map(e => (
                <div key={e.id} style={{ background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color || 'var(--accent)' }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.time && <span>{e.time} • </span>}{e.description}</div>
                    </div>
                  </div>
                  <button 
                    onClick={(ev) => { ev.stopPropagation(); handleDeleteEvent(e.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 4 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                  >
                    <X size={16} color="var(--red)" />
                  </button>
                </div>
              ))}
              {selDay && getDayEvents(selDay).length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No events recorded for this day.</p>}
            </div>
          </div>
          
          <div style={{ marginTop: '0.5rem' }}>
            <Button onClick={handleAddEvent} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? <Spinner size={16} /> : 'Save Event'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
