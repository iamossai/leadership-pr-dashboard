import { NextResponse } from 'next/server'
import { saveAuditRun, getAuditRuns } from '@/lib/storage'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const hours = parseInt(searchParams.get('hours') || '2160') // default 90 days
  const runs = await getAuditRuns(hours)
  return NextResponse.json({ runs, count: runs.length }, { headers: CORS })
}

export async function POST(request) {
  const expected = process.env.AUDIT_API_KEY
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  const provided = bearer || (request.headers.get('X-API-Key') || '').trim()
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })
  }
  try {
    const body = await request.json()
    const run = {
      ...body,
      id: body.id || crypto.randomUUID(),
      timestamp: body.timestamp || new Date().toISOString(),
    }
    await saveAuditRun(run)
    return NextResponse.json({ success: true, id: run.id }, { headers: CORS })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS })
  }
}
