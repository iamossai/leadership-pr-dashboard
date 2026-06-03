import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function hasServiceToken(request) {
  const expected = process.env.AUDIT_API_KEY
  if (!expected) return false
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  const apiKey = (request.headers.get('x-api-key') || '').trim()
  const provided = bearer || apiKey
  if (!provided || provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Always allow public routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Automated endpoints (/api/settings, /api/audit*): allow CORS preflight, then a
  // valid service TOKEN (Authorization: Bearer <t> or X-API-Key). No hardcoded
  // fallback — fails closed if AUDIT_API_KEY is unset. Otherwise require a session.
  if (pathname === '/api/settings' || pathname.startsWith('/api/audit')) {
    if (request.method === 'OPTIONS') return NextResponse.next()
    if (hasServiceToken(request)) return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', request.url))

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'ldr-jwt-secret-change-in-production'
    )
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const resp = NextResponse.redirect(new URL('/login', request.url))
    resp.cookies.delete('auth-token')
    return resp
  }
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
