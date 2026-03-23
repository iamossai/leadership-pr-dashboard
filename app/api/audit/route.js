import { NextResponse } from 'next/server'
import { saveAuditRun, getAuditRuns } from '@/lib/storage'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const hours = parseInt(searchParams.get('hours') || '168') // default 7 days
  const runs = await getAuditRuns(hours)
  return NextResponse.json({ runs, count: runs.length }, { headers: CORS })
}

export async function POST(request) {
  const key = request.headers.get('X-API-Key')
  const validKey = process.env.AUDIT_API_KEY || 'ldr_audit_k3y_2026'
  if (key !== validKey) {
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
