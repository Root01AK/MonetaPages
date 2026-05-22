import React, { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Download, TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, PieChart as PieIcon, Activity } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts'
import { StatCard, Card, Badge, Button, Spinner, EmptyState, ProgressBar } from '../components/UI'
import TransactionForm from '../components/TransactionForm'
import TransactionDetail from '../components/TransactionDetail'
import { fetchSummary, fetchMonthlyReport, fetchTransactions, fetchBudgetSummary } from '../utils/api'
import { fmtCurrency, fmtShort, fmtDate, fmtMonthShort } from '../utils/format'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass" style={{ borderRadius: 12, padding: '12px 16px', fontSize: 13, border: '1px solid var(--border-strong)' }}>
      <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 700 }}>₹{fmtShort(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [recent, setRecent] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [detail, setDetail] = useState(null)
  const [editTx, setEditTx] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const currentMonth = new Date().toISOString().slice(0, 7)
    try {
      const [s, m, r, b] = await Promise.all([
        fetchSummary(),
        fetchMonthlyReport(),
        fetchTransactions({ with_balance: true }),
        fetchBudgetSummary(currentMonth)
      ])
      setSummary(s)
      setMonthly(m)
      setRecent([...r].reverse().slice(0, 10))
      setBudgets(b)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleExport = () => {
    if (!recent.length) return
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Balance']
    const rows = recent.map(t => [
      t.date, t.type, t.category, `"${t.description.replace(/"/g, '""')}"`, t.amount, t.running_balance
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monetabank_export_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const chartData = monthly.slice(-6).map(m => ({
    name: fmtMonthShort(m.month),
    Income: m.total_income,
    Expense: m.total_expense,
    Balance: m.closing_balance,
  }))

  const pieData = [
    { name: 'Client', value: summary?.client_expense || 0, color: 'var(--accent)' }, /* Gold */
    { name: 'Company', value: summary?.company_expense || 0, color: 'var(--red)' }, /* Maroon */
    { name: 'Personal', value: summary?.personal_expense || 0, color: '#8b5cf6' }, /* Purple */
  ].filter(d => d.value > 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <Spinner size={40} />
    </div>
  )

  const net = summary?.net_profit_loss || 0
  const netColor = net >= 0 ? 'var(--green)' : 'var(--red)'

  return (
    <div className="fade-up" style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 className="grad-text" style={{ fontSize: '32px', fontWeight: 800, marginBottom: 4 }}>Moneta Bank Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <Badge text={`${summary?.total_transactions || 0} Transactions`} variant="client" />
             <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" onClick={handleExport} size="md">
            <Download size={18} /> Export CSV
          </Button>
          <Button onClick={() => { setEditTx(null); setShowForm(true) }} size="md">
            <Plus size={18} /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Main Stats Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: '2.5rem' }}>
        <StatCard
          label="Available Balance"
          value={`₹${fmtCurrency(summary?.closing_balance || 0)}`}
          sub="Current net standing"
          accent="var(--accent)"
          icon={<Wallet size={20} />}
        />
        <StatCard
          label="Total Income"
          value={`₹${fmtCurrency(summary?.total_income || 0)}`}
          color="var(--green)"
          sub="Cumulative revenue"
          accent="var(--green)"
          icon={<ArrowUpCircle size={20} />}
        />
        <StatCard
          label="Total Expenses"
          value={`₹${fmtCurrency(summary?.total_expense || 0)}`}
          color="var(--red)"
          sub="Cumulative spending"
          accent="var(--red)"
          icon={<ArrowDownCircle size={20} />}
        />
      </div>

      {/* Primary Analytics Grid */}
      <div className="db-grid-2col" style={{ marginBottom: '2.5rem' }}>
        {/* Trend Chart */}
        <Card glass>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color="var(--accent)" /> Capital Flow Trends
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--red)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tickFormatter={v => '₹' + fmtShort(v)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Income" stroke="var(--green)" fill="url(#incGrad)" strokeWidth={3} />
              <Area type="monotone" dataKey="Expense" stroke="var(--red)" fill="url(#expGrad)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Budget Monitor */}
        <Card glass style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--accent)" /> Budget Performance
          </div>
          
          {budgets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
              {budgets.map(b => (
                <div key={b.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '13px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{b.category}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{fmtShort(b.spent)} / ₹{fmtShort(b.budget)}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: b.percent > 90 ? 'var(--red)' : 'var(--text-primary)' }}>{b.percent}%</span>
                  </div>
                  <ProgressBar 
                    value={b.spent} 
                    max={b.budget} 
                    color={b.percent > 90 ? 'var(--red)' : (b.category === 'client' ? 'var(--accent)' : (b.category === 'company' ? 'var(--red)' : '#8b5cf6'))} 
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState icon="🎯" title="No Targets Set" description="Define monthly targets in settings to track progress." />
            </div>
          )}
          
          <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
             <Button variant="ghost" style={{ width: '100%', fontSize: '12px' }} onClick={() => window.location.href='/settings'}>Configure Targets</Button>
          </div>
        </Card>
      </div>

      <div className="db-grid-asymmetric-1" style={{ marginBottom: '2.5rem' }}>
        {/* Expense Distribution */}
        <Card glass>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieIcon size={18} color="var(--accent)" /> Expense Distribution
          </div>
          <div className="expense-dist-flex">
            <ResponsiveContainer className="expense-dist-chart">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {pieData.map(item => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: item.color }}>{item.name}</span>
                    <span>{((item.value / summary.total_expense) * 100).toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={item.value} max={summary.total_expense} color={item.color} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="db-grid-asymmetric-2">
        {/* Recent Transactions */}
        <Card glass noPadding>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Stream of Transactions</div>
            <Button variant="ghost" onClick={load} size="sm"><RefreshCw size={14} /></Button>
          </div>
          <div style={{ padding: '0 1.5rem' }}>
            {recent.length === 0 ? (
              <EmptyState icon="📒" title="Empty Ledger" description="Your financial story starts here." />
            ) : (
              recent.slice(0, 6).map(tx => (
                <div
                  key={tx.id}
                  onClick={() => setDetail(tx)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1.25rem 0', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', gap: 16, transition: 'all 0.2s ease',
                  }}
                  className="tx-item"
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius-md)', background: tx.type === 'income' ? 'var(--green-bg)' : 'var(--red-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                    }}>
                      {tx.type === 'income' ? '↓' : '↑'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fmtDate(tx.date)}</span>
                        <Badge text={tx.category} variant={tx.category} />
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '-'}₹{fmtCurrency(tx.amount)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>Balance: ₹{fmtShort(tx.running_balance)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Global Position */}
        <Card style={{ background: 'var(--accent-grad)', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9, marginBottom: 12 }}>Global Financial Position</div>
          <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
            {net >= 0 ? '+' : '-'}₹{fmtCurrency(Math.abs(net))}
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {net >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {net >= 0 ? 'Surplus' : 'Deficit'} this period
          </div>
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
             <Button variant="secondary" onClick={() => setShowForm(true)} style={{ width: '100%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
               Log Entry
             </Button>
          </div>
        </Card>
      </div>

      <TransactionForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditTx(null) }}
        onSuccess={load}
        editData={editTx}
      />
      <TransactionDetail
        tx={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onEdit={tx => { setEditTx(tx); setShowForm(true) }}
        onDeleted={load}
      />
    </div>
  )
}
