import { prisma } from '../../../lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentUserId } from '../../../lib/session'

export async function GET() {
  const userId = await getCurrentUserId()

  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const tasks = await prisma.task.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId()

  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { title, description, priority, dueDate } = await request.json()

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority ?? 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
      ownerId: userId,
    },
  })

  return NextResponse.json(task)
}