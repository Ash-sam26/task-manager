import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcrypt'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('userId', String(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return NextResponse.json({ id: user.id, email: user.email, name: user.name })
}