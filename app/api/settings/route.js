import { NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS })
}

export async function GET() {
  // Read recipients from env var — comma-separated list
  const raw = process.env.AUDIT_EMAIL_RECIPIENTS || 'miminaija@yahoo.com,digital@leadership.ng'
  const recipients = raw.split(',').map(e => e.trim()).filter(Boolean)

  return NextResponse.json({ recipients }, { headers: CORS })
}
