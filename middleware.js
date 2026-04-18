import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Always allow public routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/audit') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Allow automated access to /api/settings via API key (no session required)
  if (pathname === '/api/settings') {
    const apiKey = request.headers.get('x-api-key')
    const validKey = process.env.AUDIT_API_KEY || 'ldr_audit_k3y_2026'
    if (apiKey === validKey) return NextResponse.next()
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
