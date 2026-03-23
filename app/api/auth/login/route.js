import { NextResponse } from 'next/server'
import { checkCredentials, createToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { username, password } = await request.json()
    if (!checkCredentials(username, password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    const token = await createToken(username)
    const res = NextResponse.json({ success: true })
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 43200,
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
