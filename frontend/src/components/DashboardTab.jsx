import React, { useState, useEffect } from 'react'

const CANDIDATE_ID = 'priya.sharma@gmail.com'

function DashboardTab({ apiBase }) {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetch(`${apiBase}/tasks?candidate_id=${CANDIDATE_ID}`),
        fetch(`${apiBase}/api/stats?candidate_id=${CANDIDATE_ID}`)
      ])
      const tasksData = await tasksRes.json()
      const statsData = await statsRes.json()
      setTasks(Array.isArray(tasksData) ? tasksData : [])
      setStats(statsData)
    } catch (e) {
      console.error('Failed to fetch data:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.assignee_id === filter)

  const assigneeColors = {
    u_aarti: 'bg-purple-100 text-purple-800',
    u_rohit: 'bg-blue-100 text-blue-800',
    u_meera: 'bg-pink-100 text-pink-800',
    u_karan: 'bg-orange-100 text-orange-800',
    u_divya: 'bg-green-100 text-green-800',
    u_triage: 'bg-yellow-100 text-yellow-800',
  }

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total || tasks.length}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.created || 0}</div>
            <div className="text-sm text-gray-500">Created</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.updated || 0}</div>
            <div className="text-sm text-gray-500">Updated</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.skipped || 0}</div>
            <div className="text-sm text-gray-500">Skipped</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">Filter by assignee:</span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All</option>
          <option value="u_aarti">Aarti (Enterprise)</option>
          <option value="u_rohit">Rohit (SMB)</option>
          <option value="u_meera">Meera (Marketing)</option>
          <option value="u_karan">Karan (Alliances)</option>
          <option value="u_divya">Divya (Finance)</option>
          <option value="u_triage">Triage</option>
        </select>
        <button onClick={fetchData} className="px-3 py-1 bg-gray-100 rounded-md text-sm hover:bg-gray-200">
          Refresh
        </button>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Tasks ({filteredTasks.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.task_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{task.task_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{task.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${assigneeColors[task.assignee_id] || 'bg-gray-100 text-gray-800'}`}>
                      {task.assignee_id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{task.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{(task.confidence * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{task.due_date || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {task.deal_value_inr ? `₹${task.deal_value_inr.toLocaleString()}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DashboardTab
