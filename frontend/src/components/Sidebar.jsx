import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, BarChart2, Settings, Users, Calendar, CheckSquare, Clock, User } from 'lucide-react'

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ledger',  icon: BookOpen,        label: 'Ledger' },
  { to: '/clients', icon: Users,           label: 'Clients' },
  { to: '/calendar',icon: Calendar,        label: 'Calendar' },
  { to: '/tasks',   icon: CheckSquare,     label: 'Tasks' },
  { to: '/reports', icon: BarChart2,       label: 'Reports' },
  { to: '/settings',icon: Settings,        label: 'Settings' },
  { to: '/profile', icon: User,            label: 'Profile' },
]

export default function Sidebar({ balance, balanceColor }) {
  const loc = useLocation()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const linkStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    fontSize: '14px', fontWeight: active ? 700 : 500,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    background: active ? 'var(--bg-hover)' : 'transparent',
    border: `1px solid ${active ? 'var(--border-strong)' : 'transparent'}`,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: 4,
  })

  const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const formatDate = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <aside className="sidebar-desktop" style={{
      width: 250, flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      height: '100vh', position: 'sticky', top: 0,
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Logo */}
      <div style={{ padding: '2rem 1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
          <img src="/m-icon.png" alt="Moneta Logo" style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>Moneta Bank</div>
            <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>v1.2 Premium</div>
          </div>
        </div>

        <div style={{ padding: '14px 16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, fontWeight: 700 }}>Available Capital</div>
          <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: balanceColor }}>
            ₹{balance}
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ padding: '1.5rem 1rem', flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to} style={linkStyle(active)}>
              <Icon size={18} />
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer Branding & Clock */}
      <div style={{ 
        padding: '1.25rem', 
        borderTop: '1px solid var(--border)', 
        background: 'rgba(255,255,255,0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: 'var(--accent)', opacity: 0.9 }}>
          <Clock size={14} />
          <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {formatTime(now)}
          </div>
        </div>
        
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>
            Secure personal instance<br/>Moneta Digital Command
          </div>
          <div style={{ letterSpacing: '0.3px' }}>
            {formatDate(now)}<br/>
            Monakin Services @ 2026
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .sidebar-desktop { display: none !important; }
        }
      `}</style>
    </aside>
  )
}
