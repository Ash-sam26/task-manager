import { prisma } from '../../../../lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentUserId } from '../../../../lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const existingTask = await prisma.task.findUnique({ where: { id: Number(id) } })
  if (!existingTask || existingTask.ownerId !== userId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
    },
  })

  return NextResponse.json(task)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params

  const existingTask = await prisma.task.findUnique({ where: { id: Number(id) } })
  if (!existingTask || existingTask.ownerId !== userId) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  await prisma.task.delete({ where: { id: Number(id) } })

  return NextResponse.json({ success: true })
}