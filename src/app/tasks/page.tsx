'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'

type Task = {
  id: number
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  createdAt: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)

  return days
}

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0]
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [sortBy, setSortBy] = useState<'status' | 'dueDate'>('status')
  const [username, setUsername] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const router = useRouter()

  async function loadTasks() {
    const res = await fetch('/api/tasks')

    if (res.status === 401) {
      router.push('/login')
      return
    }

    const { username: fetchedUsername, tasks: data } = await res.json()
    setUsername(fetchedUsername)

    const sorted = [...data].sort((a: Task, b: Task) => {
      if (sortBy === 'status') {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1
        if (a.status !== 'DONE' && b.status === 'DONE') return -1
        return 0
      } else {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
    })

    setTasks(sorted)
    setLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [sortBy])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || null,
        dueDate: dueDate || null,
      }),
    })

    setTitle('')
    setDescription('')
    setDueDate('')
    loadTasks()
  }

  async function toggleDone(task: Task) {
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    loadTasks()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    loadTasks()
  }

  function startEditing(task: Task) {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditDueDate('')
  }

  async function saveEdit(id: number) {
    if (!editTitle.trim()) return

    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription || null,
        dueDate: editDueDate || null,
      }),
    })

    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
    setEditDueDate('')
    loadTasks()
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const calendarDays = getCalendarDays(year, month)

  const tasksByDate: Record<string, Task[]> = {}
  for (const task of tasks) {
    if (!task.dueDate) continue
    const key = task.dueDate.split('T')[0]
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(task)
  }

  const todayKey = toDateKey(new Date())

  return (
    <main className="min-h-screen bg-amber-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {username ? `${username}'s tasks` : 'Your tasks'}
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Log out
          </button>
        </div>

        <form onSubmit={handleCreate} className="mb-6 space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task..."
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Due date:</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Add
          </button>
        </form>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'status' | 'dueDate')}
              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="status">Status</option>
              <option value="dueDate">Due date</option>
            </select>
          </div>

          <div className="flex rounded border border-gray-300 text-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
            >
              Calendar
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : viewMode === 'list' ? (
          tasks.length === 0 ? (
            <p className="text-gray-500">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded bg-white p-3 shadow-sm transition-transform duration-150 hover:scale-105 hover:shadow-md"
                >
                  {editingId === task.id ? (
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="rounded border border-gray-300 px-2 py-1 text-gray-900 focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={task.status === 'DONE'}
                          onChange={() => toggleDone(task)}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex flex-col">
                          <span
                            className={
                              task.status === 'DONE'
                                ? 'text-gray-400 line-through'
                                : 'text-gray-900'
                            }
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-sm text-gray-600">
                              {task.description}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-amber-600">
                              Due {formatDate(task.dueDate)}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            Created {formatDate(task.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditing(task)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : (
          <div className="rounded bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
              >
                ← Prev
              </button>
              <span className="font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
              >
                Next →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={i} className="min-h-20" />

                const key = toDateKey(date)
                const dayTasks = tasksByDate[key] ?? []
                const isToday = key === todayKey

                return (
                  <div
                    key={i}
                    className={`min-h-20 rounded border p-1 text-xs ${
                      isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="mb-1 font-medium text-gray-700">
                      {date.getDate()}
                    </div>
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`mb-0.5 truncate rounded px-1 ${
                          t.status === 'DONE'
                            ? 'bg-gray-100 text-gray-400 line-through'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-gray-400">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}