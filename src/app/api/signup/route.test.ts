import { POST } from './route'
import { describe, it, expect } from 'vitest'

describe('/api/signup', () => {
  it('creates a new user with valid data', async () => {
    const request = new Request('http://localhost/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Vitest User',
      }),
    })

    const res = await POST(request)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.email).toContain('@example.com')
    expect(data).not.toHaveProperty('passwordHash')
  })

  it('rejects signup with missing password', async () => {
    const request = new Request('http://localhost/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nopassword@example.com' }),
    })

    const res = await POST(request)
    expect(res.status).toBe(400)
  })
})