import { POST as loginPOST } from './route'
import { POST as signupPOST } from '../signup/route'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}))

describe('/api/login', () => {
  it('logs in successfully with correct credentials', async () => {
    const email = `login-test-${Date.now()}@example.com`
    const password = 'password123'

    const signupRequest = new Request('http://localhost/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Login Test' }),
    })
    await signupPOST(signupRequest)

    const loginRequest = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const res = await loginPOST(loginRequest)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.email).toBe(email)
  })

  it('rejects login with wrong password', async () => {
    const email = `login-test-wrong-${Date.now()}@example.com`
    const password = 'password123'

    const signupRequest = new Request('http://localhost/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Login Test' }),
    })
    await signupPOST(signupRequest)

    const loginRequest = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrongpassword' }),
    })
    const res = await loginPOST(loginRequest)

    expect(res.status).toBe(401)
  })

  it('rejects login for a nonexistent email', async () => {
    const loginRequest = new Request('http://localhost/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doesnotexist@example.com', password: 'anything' }),
    })
    const res = await loginPOST(loginRequest)

    expect(res.status).toBe(401)
  })
})