import { NextResponse } from 'next/server'
import { getAuditRunById } from '@/lib/storage'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS })
}

export async function GET(request, { params }) {
  const run = await getAuditRunById(params.id)
  if (!run) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS })
  }
  return NextResponse.json(run, { headers: CORS })
}
