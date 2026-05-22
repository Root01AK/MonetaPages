import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, Button, Badge, Spinner } from '../components/UI'
import { User, Mail, LogOut, ShieldCheck, Calendar, Save, Edit2, X } from 'lucide-react'
import { updateProfile } from '../utils/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, logout, login } = useAuth() // login here is actually the re-sync function if we have one, or we just refresh page
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || ''
  })

  if (!user) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateProfile(form)
      toast.success('Command center identity updated')
      setEditing(false)
      // Refresh the page to reload user context from LS/API
      window.location.reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update rejected by server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-up" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ 
          width: 80, height: 80, borderRadius: '50%', 
          background: 'var(--bg-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem', padding: 12,
          boxShadow: '0 0 40px rgba(184, 150, 89, 0.1)'
        }}>
          <img src="/m-icon.png" alt="User Profile" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>{user.full_name || 'Personal Account'}</h1>
        <Badge text="Moneta Bank Elite" variant="client" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Card glass style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Account Credentials</div>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditing(!editing)}
                style={{ height: 32, padding: '0 8px' }}
            >
                {editing ? <X size={16} /> : <Edit2 size={16} />}
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, fontWeight: 700 }}>
                Full Legal Name
              </label>
              {editing ? (
                <input 
                  className="input"
                  value={form.full_name}
                  onChange={e => setForm({...form, full_name: e.target.value})}
                  style={{ width: '100%' }}
                />
              ) : (
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{user.full_name || 'Not set'}</div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, fontWeight: 700 }}>
                Email Address
              </label>
              {editing ? (
                <input 
                  className="input"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  style={{ width: '100%' }}
                />
              ) : (
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{user.email}</div>
              )}
            </div>

            {editing && (
              <Button onClick={handleSave} disabled={loading} style={{ width: '100%', marginTop: 10 }}>
                {loading ? <Spinner size={16} /> : <><Save size={16} style={{ marginRight: 8 }} /> Save Identity Modifications</>}
              </Button>
            )}
          </div>
        </Card>

        <Card glass style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Security Lifecycle</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Member since {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
          </div>
        </Card>

        <Card glass style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Security Status</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>Verified & Protected Instance</div>
          </div>
        </Card>

        <div style={{ marginTop: '1.5rem' }}>
          <Button variant="danger" onClick={logout} style={{ width: '100%', height: 44, borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)' }}>
            <LogOut size={16} style={{ marginRight: 8 }} /> Terminate Session
          </Button>
          <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Moneta Bank v1.2.0 · Digital Financial Command Center
          </p>
        </div>
      </div>
    </div>
  )
}
