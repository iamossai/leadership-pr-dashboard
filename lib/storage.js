import { getDemoData } from './demo-data.js'

export function isKVConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function getKV() {
  if (!isKVConfigured()) return null
  const { kv } = await import('@vercel/kv')
  return kv
}

export async function saveAuditRun(run) {
  const kv = await getKV()
  if (!kv) return false
  await kv.lpush('ldr:audit-runs', JSON.stringify(run))
  await kv.ltrim('ldr:audit-runs', 0, 299)
  return true
}

export async function getAuditRuns(hoursBack = 48) {
  const kv = await getKV()
  if (!kv) return getDemoData(hoursBack)
  try {
    const raw = await kv.lrange('ldr:audit-runs', 0, -1)
    const cutoff = Date.now() - hoursBack * 3600000
    return raw
      .map(r => (typeof r === 'string' ? JSON.parse(r) : r))
      .filter(r => new Date(r.timestamp).getTime() > cutoff)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  } catch {
    return getDemoData(hoursBack)
  }
}

export async function getArticleStatuses() {
  const kv = await getKV()
  if (!kv) return {}
  try {
    const raw = await kv.get('ldr:article-statuses')
    if (!raw) return {}
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return {}
  }
}

export async function setArticleStatus(url, status) {
  const kv = await getKV()
  if (!kv) return false
  try {
    const existing = await getArticleStatuses()
    existing[url] = status
    await kv.set('ldr:article-statuses', JSON.stringify(existing))
    return true
  } catch {
    return false
  }
}

export async function getAuditRunById(id) {
  const kv = await getKV()
  if (!kv) return null
  try {
    const raw = await kv.lrange('ldr:audit-runs', 0, -1)
    const run = raw
      .map(r => (typeof r === 'string' ? JSON.parse(r) : r))
      .find(r => r.id === id)
    return run || null
  } catch {
    return null
  }
}
