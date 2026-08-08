import React, { useState, useEffect } from 'react'
import MagicCard from './ui/MagicCard'
import NumberTicker from './ui/NumberTicker'
import SpotlightCard from './ui/SpotlightCard'
import GradientText from './ui/GradientText'
import {
  IconChart,
  IconCheck,
  IconRefresh,
  IconClock,
  IconAlert,
  IconUser,
  IconZap,
} from './ui/Icons'

const CANDIDATE_ID = 'priya.sharma@gmail.com'

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

const ASSIGNEE_LABELS = {
  u_aarti: 'Aarti · Enterprise',
  u_rohit: 'Rohit · SMB',
  u_meera: 'Meera · Marketing',
  u_karan: 'Karan · Alliances',
  u_divya: 'Divya · Finance',
  u_triage: 'Triage',
}

function StatCard({ icon, label, value, accent }) {
  return (
    <MagicCard className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <NumberTicker
            value={value || 0}
            className="mt-2 block text-3xl font-bold text-white"
          />
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] ${accent}`}
        >
          {icon}
        </div>
      </div>
    </MagicCard>
  )
}

function DashboardTab({ apiBase }) {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
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

  const filteredTasks =
    filter === 'all' ? tasks : tasks.filter((t) => t.assignee_id === filter)

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

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<IconChart className="h-5 w-5 text-red-300" />}
          label="Total Tasks"
          value={stats?.total}
        />
        <StatCard
          icon={<IconCheck className="h-5 w-5 text-emerald-300" />}
          label="Created"
          value={stats?.created}
        />
        <StatCard
          icon={<IconClock className="h-5 w-5 text-blue-300" />}
          label="Updated"
          value={stats?.updated}
        />
        <StatCard
          icon={<IconAlert className="h-5 w-5 text-yellow-300" />}
          label="Skipped"
          value={stats?.skipped}
        />
      </div>

      {/* Secondary stats */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          {[
            { icon: <IconUser className="h-3.5 w-3.5" />, label: 'Emails processed', value: stats.processed },
            { icon: <IconZap className="h-3.5 w-3.5" />, label: 'Avg confidence', value: `${Math.round((stats.confidence?.average || 0) * 100)}%` },
            { icon: <IconClock className="h-3.5 w-3.5" />, label: 'Threads updated >1×', value: stats.threads?.updated_multiple_times },
          ].map((chip, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-slate-300"
            >
              <span className="text-red-300">{chip.icon}</span>
              {chip.label}: <span className="font-semibold text-white">{chip.value ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
          <span className="text-sm text-slate-400">Filter by assignee</span>
          <select
            aria-label="Filter by assignee"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="cursor-pointer rounded-lg border border-white/10 bg-[#0b0b1a] px-3 py-1 text-sm text-slate-200 outline-none transition-colors hover:border-white/25 focus:border-red-400/60"
          >
            <option value="all">All</option>
            <option value="u_aarti">Aarti (Enterprise)</option>
            <option value="u_rohit">Rohit (SMB)</option>
            <option value="u_meera">Meera (Marketing)</option>
            <option value="u_karan">Karan (Alliances)</option>
            <option value="u_divya">Divya (Finance)</option>
            <option value="u_triage">Triage</option>
          </select>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
        >
          <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tasks table */}
      <SpotlightCard>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            Tasks <span className="text-slate-500">({filteredTasks.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/[0.06]">
            <thead>
              <tr className="bg-white/[0.03] text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3">Task ID</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Assignee</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Confidence</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Deal Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredTasks.map((task) => (
                <tr key={task.task_id} className="transition-colors hover:bg-white/[0.04]">
                  <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{task.task_id}</td>
                  <td className="max-w-xs truncate px-6 py-3.5 text-sm text-slate-200">
                    {task.title}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        ASSIGNEE_STYLES[task.assignee_id] || 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      {ASSIGNEE_LABELS[task.assignee_id] || task.assignee_id}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        PRIORITY_STYLES[task.priority] || 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
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
                  <td className="px-6 py-3.5 text-sm text-slate-400">{task.due_date || '—'}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-300">
                    {task.deal_value_inr ? (
                      <span>
                        ₹{task.deal_value_inr.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                    <GradientText>No tasks found.</GradientText> Ingest some emails to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  )
}

export default DashboardTab
