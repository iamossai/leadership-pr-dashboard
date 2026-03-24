import { NextResponse } from 'next/server'
import { saveAuditRun } from '@/lib/storage'

export const maxDuration = 60

const COST_PER_PR = 107500

function decodeHtml(str) {
  if (!str) return str
  return str
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
}

function scoreArticle(title, contentText, author) {
  const signals = []
  let score = 0
  const titleLower = (title || '').toLowerCase()
  const contentLower = (contentText || '').toLowerCase()
  const authorLower = (author || '').toLowerCase()
  const excerpt = contentText ? contentText.substring(0, 400) : ''

  // [C] Strong signal: Promotional title keywords
  const promoWords = [
    'unveils','launches','partners','appoints','sponsors','donates',
    'wins award','receives award','celebrates','commissions','inaugurates',
    'flags off','empowers','distributes','presents','rewards','honours',
    'honors','recognizes','congratulates','in partnership with',
    'collaborates with','scholarship','fellowship','reaffirms commitment',
    'announces appointment','flag off'
  ]
  if (promoWords.some(w => titleLower.includes(w))) {
    signals.push('[C] Promotional title')
    score += 3
  }

  // [B] Strong signal: PR dateline
  if (/^[A-Z][A-Z\s,]+,\s+\w+\s+\d{1,2}[,.]?\s*(\d{4})?\s*[–—-]/m.test(excerpt)) {
    signals.push('[B] PR dateline')
    score += 3
  }

  // [A] Strong signal: About boilerplate
  const boilerplate = [
    'about ', 'for more information', 'for further information',
    'media contact', 'press contact', 'press release', 'distributed by',
    'issued by', '###', '– end –', '— end —', 'signed:', 'enquiries to',
    'contact us', 'for enquiries'
  ]
  if (boilerplate.some(p => contentLower.includes(p))) {
    signals.push('[A] About boilerplate')
    score += 3
  }

  // Supporting: generic byline
  const genericBylines = ['reporter','correspondent','staff','leadership','agency','press','admin','desk']
  if (!author || genericBylines.some(w => authorLower.includes(w))) {
    signals.push('Generic byline')
    score += 1
  }

  // Supporting: short article
  const wordCount = contentText ? contentText.split(/\s+/).filter(Boolean).length : 0
  if (wordCount < 250) {
    signals.push('Short article')
    score += 1
  }

  // Supporting: quote-heavy
  const quoteCount = (contentLower.match(/\b(said|stated|noted|added|explained|disclosed|reiterated)\b/g) || []).length
  if (quoteCount >= 4) {
    signals.push('Quote-heavy')
    score += 1
  }

  // Negative signals
  if (/exclusive:|investigation:|probe:|scandal:/i.test(title)) score -= 3
  if (/\b(however|but)\b.{0,100}\b(critic|opposition|controversy|concern)\b/i.test(contentText)) score -= 1

  const hasStrongSignal = signals.some(s => s.startsWith('[A]') || s.startsWith('[B]') || s.startsWith('[C]'))
  const isPR = score >= 6 && hasStrongSignal

  return { score, signals, isPR }
}

async function fetchRSSPage(page) {
  try {
    const res = await fetch(`https://leadership.ng/feed/?paged=${page}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadershipPRAudit/1.0)' },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const xml = await res.text()
    const items = []

    for (const [, itemXml] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const get = (tag) => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i'))
        return m ? m[1].trim() : ''
      }

      const title = decodeHtml(get('title'))
      const link = get('link')
      const url = link.replace(/^[\s\S]*?(https?:\/\/leadership\.ng[^\s<"]+)[\s\S]*$/, '$1').trim() || link.trim()
      const pubDate = get('pubDate')
      const author = decodeHtml(get('dc:creator') || get('author'))
      const rawContent = get('content:encoded') || get('description')
      const contentText = rawContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

      if (!title || !url || !url.startsWith('http')) continue

      const { score, signals, isPR } = scoreArticle(title, contentText, author)
      items.push({
        title, url,
        date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        author: author || 'Unknown',
        score, signals, isPR,
        cost: isPR ? COST_PER_PR : 0,
      })
    }
    return items
  } catch {
    return []
  }
}

export async function POST() {
  // Auth handled by middleware
  try {
    // Fetch 6 pages in parallel — 10 articles/page × 6 = ~60 articles
    const results = await Promise.allSettled([
      fetchRSSPage(1), fetchRSSPage(2), fetchRSSPage(3),
      fetchRSSPage(4), fetchRSSPage(5), fetchRSSPage(6),
    ])

    const raw = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])

    // Deduplicate by URL
    const seen = new Set()
    const all_articles = raw.filter(a => {
      if (seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })

    const pr_articles = all_articles.filter(a => a.isPR)
    const pr_count = pr_articles.length
    const total_cost = pr_count * COST_PER_PR

    const run = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      articles_scanned: all_articles.length,
      pr_count,
      total_cost,
      email_sent: false,
      pr_articles,
      all_articles,
      source: 'manual',
    }

    await saveAuditRun(run)

    return NextResponse.json({
      success: true,
      id: run.id,
      articles_scanned: all_articles.length,
      pr_count,
      total_cost,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
