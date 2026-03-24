import { NextResponse } from 'next/server'
import { getArticleStatuses, setArticleStatus } from '@/lib/storage'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS })
}

export async function GET() {
  const statuses = await getArticleStatuses()
  return NextResponse.json(statuses, { headers: CORS })
}

export async function POST(request) {
  try {
    const { url, status } = await request.json()
    if (!url || !['flagged', 'paid', 'false'].includes(status)) {
      return NextResponse.json({ error: 'Invalid url or status' }, { status: 400, headers: CORS })
    }
    const ok = await setArticleStatus(url, status)
    return NextResponse.json({ success: ok }, { headers: CORS })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: CORS })
  }
}
