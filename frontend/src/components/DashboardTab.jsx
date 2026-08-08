import React, { useState, useEffect, useMemo } from 'react'
import {
  LayoutDashboard,
  FileText,
  Rocket,
  Megaphone,
  Handshake,
  Receipt,
  HelpCircle,
  Ban,
  Target,
  IndianRupee,
  Search,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import NumberTicker from './ui/NumberTicker'
import GradientText from './ui/GradientText'
import { IconRefresh } from './ui/Icons'

const CANDIDATE_ID = 'priya.sharma@gmail.com'

const CATEGORY_META = [
  { key: 'enterprise_rfp', label: 'Enterprise RFP', short: 'RFP', icon: FileText },
  { key: 'smb_enquiry', label: 'SMB Enquiry', short: 'SMB', icon: Rocket },
  { key: 'marketing', label: 'Marketing', short: 'Mktg', icon: Megaphone },
  { key: 'alliances', label: 'Alliances', short: 'All', icon: Handshake },
  { key: 'finance', label: 'Finance', short: 'Fin', icon: Receipt },
  { key: 'triage', label: 'Triage', short: 'Tri', icon: HelpCircle },
]

const ASSIGNEE_LABELS = {
  u_aarti: 'Aarti',
  u_rohit: 'Rohit',
  u_meera: 'Meera',
  u_karan: 'Karan',
  u_divya: 'Divya',
  u_triage: 'Triage',
}

const ASSIGNEE_STYLES = {
  u_aarti: 'border-purple-400/30 bg-purple-500/15 text-purple-300',
  u_rohit: 'border-blue-400/30 bg-blue-500/15 text-blue-300',
  u_meera: 'border-pink-400/30 bg-pink-500/15 text-pink-300',
  u_karan: 'border-orange-400/30 bg-orange-500/15 text-orange-300',
  u_divya: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
  u_triage: 'border-yellow-400/30 bg-yellow-500/15 text-yellow-300',
}

const PRIORITY_STYLES = {
  high: 'border-red-400/30 bg-red-500/15 text-red-300',
  medium: 'border-yellow-400/30 bg-yellow-500/15 text-yellow-300',
  low: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
}

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

const SKIP_REASON_LABELS = {
  out_of_office: 'Out-of-office auto-reply',
  newsletter: 'Newsletter',
  vendor_spam: 'Vendor spam',
  auto_reply: 'Auto-reply',
  unknown: 'Other',
}

const TOOLTIP_STYLE = {
  background: 'rgba(10, 10, 22, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 12,
  fontSize: 12,
  color: '#f1f5f9',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
}

function ChartCard({ title, subtitle, right, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:border-white/20 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent, decimals = 0, suffix = '' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.05]">
      <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-red-600/10 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
          {React.createElement(icon, { className: `h-5 w-5 ${accent}` })}
        </div>
        <span className="text-slate-600">{React.createElement(ArrowUpRight, { className: 'h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100' })}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-0.5">
        <NumberTicker value={value} decimals={decimals} className="text-3xl font-bold text-white" />
        {suffix && <span className="text-xl font-bold text-slate-200">{suffix}</span>}
      </div>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      {sub && <p className="mt-1.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  )
}

function SidebarItem({ active, icon, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] transition-all ${
        active
          ? 'bg-gradient-to-r from-red-600/20 to-rose-600/10 text-white ring-1 ring-red-500/30'
          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
      }`}
    >
      <span className={active ? 'text-red-400' : 'text-slate-500'}>{React.createElement(icon, { className: 'h-4 w-4' })}</span>
      <span className="flex-1 truncate">{label}</span>
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            active ? 'bg-red-500/25 text-red-200' : 'bg-white/[0.07] text-slate-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function DashboardTab({ apiBase }) {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const [tasksRes, statsRes] = await Promise.all([
        // Use the backend's /api/tasks wrapper, NOT the raw Task API (§7.2:
        // the browser should never talk to the Task API directly)
        fetch(`${apiBase}/api/tasks?candidate_id=${CANDIDATE_ID}`),
        fetch(`${apiBase}/api/stats?candidate_id=${CANDIDATE_ID}`),
      ])
      const tasksData = await tasksRes.json()
      const statsData = await statsRes.json()
      setTasks(Array.isArray(tasksData) ? tasksData : [])
      setStats(statsData)
    } catch (e) {
      console.error('Failed to fetch data:', e)
    } finally {
      setLoading(false)
      setTimeout(() => setRefreshing(false), 400)
    }
  }

  const byCategory = useMemo(() => {
    const source = stats?.by_category || {}
    return CATEGORY_META.map((c) => ({ key: c.key, label: c.short, full: c.label, count: source[c.key] || 0 }))
  }, [stats])

  const byAssignee = useMemo(() => {
    const source = stats?.by_assignee || {}
    return Object.entries(ASSIGNEE_LABELS).map(([id, label]) => ({
      name: label,
      count: source[id] || 0,
    }))
  }, [stats])

  const byPriority = useMemo(() => {
    const source = stats?.by_priority || {}
    return ['high', 'medium', 'low'].map((p) => ({
      name: p,
      value: source[p] || 0,
    }))
  }, [stats])

  const skipReasons = useMemo(() => {
    const source = stats?.skip_reasons || {}
    return Object.entries(source).map(([key, count]) => ({
      key,
      label: SKIP_REASON_LABELS[key] || key,
      count,
    }))
  }, [stats])

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter((t) => {
      if (filter !== 'all' && t.category !== filter) return false
      if (q) {
        const hay = `${t.title || ''} ${t.company_name || ''} ${t.task_id || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [tasks, filter, query])

  const activeCategory = CATEGORY_META.find((c) => c.key === filter)

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-24">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
          <span className="text-sm text-slate-300">Loading dashboard…</span>
        </div>
      </div>
    )
  }

  const navItems = [
    { key: 'all', label: 'Overview', icon: LayoutDashboard, count: stats?.total || 0 },
    ...CATEGORY_META.map((c) => ({ key: c.key, label: c.label, icon: c.icon, count: byCategory.find((b) => b.key === c.key)?.count || 0 })),
    { key: 'skipped', label: 'Skipped', icon: Ban, count: stats?.skipped || 0 },
  ]

  return (
    <div className="flex gap-6">
      {/* ---------- Sidebar (desktop) ---------- */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 space-y-6">
          <nav className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-sm">
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Routing
            </p>
            {navItems
              .filter((item) => item.key !== 'skipped')
              .map((item) => (
                <SidebarItem
                  key={item.key}
                  active={filter === item.key}
                  icon={item.icon}
                  label={item.label}
                  count={item.count}
                  onClick={() => setFilter(item.key)}
                />
              ))}
            <div className="my-2 border-t border-white/[0.07]" />
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Ignored
            </p>
            <SidebarItem
              active={filter === 'skipped'}
              icon={Ban}
              label="Skipped emails"
              count={stats?.skipped || 0}
              onClick={() => setFilter('skipped')}
            />
          </nav>

          {/* Candidate card */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-600/15 via-white/[0.03] to-rose-600/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-600 text-xs font-bold text-white">
                PS
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">Priya Sharma</p>
                <p className="truncate text-[11px] text-slate-400">candidate · FDE</p>
              </div>
            </div>
            <p className="mt-3 truncate rounded-lg bg-black/30 px-2.5 py-1.5 font-mono text-[10px] text-slate-400">
              {CANDIDATE_ID}
            </p>
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="min-w-0 flex-1 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              <GradientText>Routing overview</GradientText>
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Everything the inbox routed — at a glance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-slate-300 md:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              live · {stats?.processed || 0} emails processed
            </span>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Mobile category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                filter === item.key
                  ? 'border-red-500/40 bg-red-600/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'
              }`}
            >
              {React.createElement(item.icon, { className: 'h-3.5 w-3.5' })}
              {item.label}
              <span className="text-[10px] text-slate-500">{item.count}</span>
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            icon={LayoutDashboard}
            accent="text-red-400"
            label="Total Tasks"
            value={stats?.total || 0}
            sub={`${stats?.threads?.updated_multiple_times || 0} threads updated more than once`}
          />
          <StatCard
            icon={Ban}
            accent="text-amber-400"
            label="Skipped Emails"
            value={stats?.skipped || 0}
            sub="out-of-office · newsletters · spam"
          />
          <StatCard
            icon={Target}
            accent="text-rose-400"
            label="Avg Confidence"
            value={Math.round((stats?.confidence?.average || 0) * 100)}
            suffix="%"
            sub={`${stats?.confidence?.low_confidence_count || 0} tasks below 60%`}
          />
          <StatCard
            icon={IndianRupee}
            accent="text-emerald-400"
            label="Deal Value"
            value={(stats?.total_deal_value_inr || 0) / 100000}
            decimals={1}
            suffix="L"
            sub="sum of stated deal values (₹ lakhs)"
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCard
            title="Tasks per category"
            subtitle="Live routing decisions by category"
            className="lg:col-span-2"
            right={
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-400">
                <TrendingUp className="h-3 w-3 text-red-400" />
                {stats?.created || 0} created
              </span>
            }
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={byCategory} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [`${v} task${v === 1 ? '' : 's'}`, 'Count']}
                    labelFormatter={(l) => byCategory.find((b) => b.label === l)?.full || l}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#gradCat)"
                    dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#f43f5e' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Priority mix" subtitle="High · medium · low">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byPriority}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={4}
                    stroke="rgba(6,6,15,0.9)"
                    strokeWidth={2}
                  >
                    {byPriority.map((p) => (
                      <Cell key={p.name} fill={PRIORITY_COLORS[p.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v, n) => [`${v} task${v === 1 ? '' : 's'}`, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-4">
              {byPriority.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PRIORITY_COLORS[p.name] }}
                  />
                  <span className="capitalize">{p.name}</span>
                  <span className="font-semibold text-slate-200">{p.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-5 lg:grid-cols-3">
          <ChartCard
            title="Assignee workload"
            subtitle="Tasks per owner"
            className="lg:col-span-2"
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byAssignee} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [`${v} task${v === 1 ? '' : 's'}`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {byAssignee.map((_, i) => (
                      <Cell key={i} fill="#ef4444" fillOpacity={0.9 - i * 0.08} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Correctly ignored"
            subtitle="Skipped emails by reason"
            right={
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-400">
                <Ban className="h-3 w-3 text-amber-400" />
                {stats?.skipped || 0} total
              </span>
            }
          >
            <div className="space-y-3 pt-1">
              {skipReasons.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">Nothing skipped yet.</p>
              )}
              {skipReasons.map((r) => (
                <div key={r.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{r.label}</span>
                    <span className="font-semibold text-slate-200">{r.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500/80 to-red-500/80"
                      style={{
                        width: `${stats?.skipped ? Math.min((r.count / stats.skipped) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Search + table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                {filter === 'skipped' ? 'Skipped emails' : activeCategory ? activeCategory.label : 'All tasks'}
              </h2>
              <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-slate-400">
                {filteredTasks.length}
              </span>
            </div>
            {filter !== 'skipped' && (
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks…"
                  aria-label="Search tasks"
                  className="w-56 rounded-lg border border-white/10 bg-[#0b0b1a] py-1.5 pr-3 pl-8 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-red-400/50"
                />
              </div>
            )}
          </div>

          {filter === 'skipped' ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Skipped emails never become tasks — they're recorded and correctly ignored.
              <span className="mt-1 block text-xs text-slate-600">
                Ask the Chat tab for details, e.g. “how many were marketing versus actual spam we ignored?”
              </span>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/[0.06]">
                <thead>
                  <tr className="bg-white/[0.03] text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3">Task</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Assignee</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Confidence</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredTasks.map((task) => (
                    <tr key={task.task_id} className="transition-colors hover:bg-white/[0.04]">
                      <td className="px-5 py-3.5">
                        <p className="max-w-[220px] truncate text-sm font-medium text-slate-200">{task.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-slate-600">
                          {task.task_id}
                          {task.company_name && (
                            <>
                              <ChevronRight className="h-2.5 w-2.5" />
                              {task.company_name}
                            </>
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-slate-300">
                          {(() => {
                            const meta = CATEGORY_META.find((c) => c.key === task.category)
                            return meta
                              ? React.createElement(meta.icon, { className: 'h-3 w-3 text-red-400/80' })
                              : null
                          })()}
                          {CATEGORY_META.find((c) => c.key === task.category)?.label || task.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            ASSIGNEE_STYLES[task.assignee_id] || 'border-white/10 bg-white/5 text-slate-300'
                          }`}
                        >
                          {ASSIGNEE_LABELS[task.assignee_id] || task.assignee_id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                            PRIORITY_STYLES[task.priority] || 'border-white/10 bg-white/5 text-slate-300'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-500"
                              style={{ width: `${Math.min((task.confidence || 0) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">
                            {Math.round((task.confidence || 0) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{task.due_date || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-300">
                        {task.deal_value_inr ? `₹${task.deal_value_inr.toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-sm text-slate-500">
                        <GradientText>No tasks found.</GradientText> Ingest some emails to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardTab
