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
  const router = useRouter()

  async function loadTasks() {
    const res = await fetch('/api/tasks')

    if (res.status === 401) {
      router.push('/login')
      return
    }

    const data: Task[] = await res.json()

    const sorted = [...data].sort((a, b) => {
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

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Your tasks</h1>
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

        <div className="mb-4 flex items-center gap-2">
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

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">No tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded bg-white p-3 shadow-sm"
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
        )}
      </div>
    </main>
  )
}