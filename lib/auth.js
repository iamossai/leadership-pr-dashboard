import { SignJWT, jwtVerify } from 'jose'

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'ldr-jwt-secret-change-in-production')

export async function createToken(username) {
  return new SignJWT({ username, sub: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getSecret())
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload
}

export function checkCredentials(username, password) {
  const u = process.env.DASHBOARD_USERNAME || 'leadershipadmin'
  const p = process.env.DASHBOARD_PASSWORD || 'Leadership@2026'
  return username === u && password === p
}
