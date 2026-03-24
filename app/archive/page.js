import { getAuditRuns, isKVConfigured, getArticleStatuses } from '@/lib/storage'
import LogoutButton from '../LogoutButton'
import Link from 'next/link'

function fmt(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}
function naira(n) { return '₦' + Number(n).toLocaleString() }
function decodeHtml(str) {
  if (!str) return str
  return str
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

export const revalidate = 0

export default async function ArchivePage() {
  const [runs, statuses] = await Promise.all([
    getAuditRuns(168),
    getArticleStatuses(),
  ])
  const isDemo = !isKVConfigured()

  // Deduplicate PR articles by URL across all runs
  const seenUrls = new Set()
  const allPR = runs.flatMap(r => r.pr_articles || []).filter(a => {
    if (seenUrls.has(a.url)) return false
    seenUrls.add(a.url)
    return true
  })
  const flaggedPR = allPR.filter(a => !statuses[a.url] || statuses[a.url] === 'flagged')
  const paidPR    = allPR.filter(a => statuses[a.url] === 'paid')
  const falsePR   = allPR.filter(a => statuses[a.url] === 'false')
  const totalDetected = allPR.length
  const totalOwed = flaggedPR.reduce((s, a) => s + (a.cost || 107500), 0)
  const totalRuns = runs.length
  const flaggedRuns = runs.filter(r => r.pr_count > 0).length

  const byDay = {}
  runs.forEach(r => {
    const day = new Date(r.timestamp).toLocaleDateString('en-NG', {
      timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', year: 'numeric'
    })
    if (!byDay[day]) byDay[day] = { runs: 0, pr: 0, cost: 0 }
    byDay[day].runs++
    byDay[day].pr   += r.pr_count    || 0
    byDay[day].cost += r.total_cost  || 0
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <header style={{ background: '#0a2342' }} className="shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Leadership.ng</h1>
                <p className="text-blue-300 text-xs">PR Audit Dashboard</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <Link href="/" className="text-blue-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">← Dashboard (48h)</Link>
              <span className="text-blue-200/50 text-sm hidden sm:block px-2 py-1 rounded-lg bg-white/5 border border-white/10">7-day archive</span>
              <LogoutButton />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isDemo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="text-amber-500 text-xl mt-0.5">⚡</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Demo Mode — Sample Data Displayed</p>
              <p className="text-amber-700 text-xs mt-1">Connect Vercel KV to store and view real audit history.</p>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-gray-900">7-Day Archive</h2>
          <p className="text-gray-500 text-sm mt-1">Full audit history — last 7 days</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total PR Detected',    value: totalDetected,    icon: '🚨', color: totalDetected > 0 ? '#dc2626' : '#16a34a' },
            { label: 'Amount Outstanding',   value: naira(totalOwed), icon: '💰', sub: flaggedPR.length + ' flagged', color: totalOwed > 0 ? '#dc2626' : '#16a34a' },
            { label: 'Audit Runs',           value: totalRuns,        icon: '📋', color: '#0a2342' },
            { label: 'Runs With PR',         value: flaggedRuns,      icon: '⚠',  color: flaggedRuns > 0 ? '#d97706' : '#16a34a' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-2xl font-bold mt-3" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
              {s.sub && <p className="text-gray-400 text-xs">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Status breakdown bar */}
        {totalDetected > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex items-center gap-6 flex-wrap">
            <p className="text-sm font-semibold text-gray-700">Article Status</p>
            <span className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /><span className="font-bold text-red-700">{flaggedPR.length}</span><span className="text-gray-500">Flagged (unpaid)</span></span>
            <span className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /><span className="font-bold text-green-700">{paidPR.length}</span><span className="text-gray-500">Paid</span></span>
            <span className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /><span className="font-bold text-gray-600">{falsePR.length}</span><span className="text-gray-500">False positives</span></span>
          </div>
        )}

        {Object.keys(byDay).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Daily Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Date', 'Audit Runs', 'PR Articles', 'Detected Amount'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(byDay).map(([day, d]) => (
                    <tr key={day} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-700">{day}</td>
                      <td className="px-5 py-3 text-gray-500">{d.runs}</td>
                      <td className="px-5 py-3">
                        {d.pr > 0
                          ? <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">🚨 {d.pr}</span>
                          : <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">✅ None</span>}
                      </td>
                      <td className="px-5 py-3 font-semibold text-gray-700">{d.cost > 0 ? naira(d.cost) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">All Detected PR Articles</h3>
              <p className="text-gray-400 text-xs mt-0.5">Last 7 days · deduplicated by URL</p>
            </div>
            {allPR.length > 0 && (
              <span className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-100">
                {allPR.length} total · {naira(totalOwed)} outstanding
              </span>
            )}
          </div>
          {allPR.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="text-4xl">✅</span>
              <p className="text-gray-600 font-medium mt-3">No PR content detected in the past 7 days</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['#', 'Article Title', 'Author', 'Published', 'Detection Signals', 'Score', 'Status', 'Cost'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allPR.map((art, i) => {
                    const status = statuses[art.url] || 'flagged'
                    const rowBg = status === 'paid' ? 'bg-green-50/20' : status === 'false' ? 'bg-gray-50/40 opacity-60' : 'hover:bg-red-50/20'
                    return (
                      <tr key={art.url || i} className={`transition-colors ${rowBg}`}>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                        <td className="px-4 py-3 max-w-xs">
                          <a href={art.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-red-700 hover:underline leading-snug block">{decodeHtml(art.title)}</a>
                          <p className="text-gray-400 text-xs mt-0.5 truncate">{art.url}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">👤 {art.author || 'Unknown'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(art.date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(art.signals || []).map((s, j) => (
                              <span key={j} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded border border-orange-100">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block bg-red-100 text-red-700 text-xs font-bold w-7 h-7 rounded-full leading-7 text-center">{art.score}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {status === 'paid'  ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✅ Paid</span>
                          : status === 'false' ? <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">🚫 False +ve</span>
                          :                     <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">🚨 Flagged</span>}
                        </td>
                        <td className="px-4 py-3 font-bold whitespace-nowrap">
                          {status === 'paid'  ? <span className="text-green-600 line-through opacity-50">{naira(art.cost || 107500)}</span>
                          : status === 'false' ? <span className="text-gray-400 line-through opacity-50">{naira(art.cost || 107500)}</span>
                          :                      <span className="text-red-600">{naira(art.cost || 107500)}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-red-50 border-t-2 border-red-100">
                    <td colSpan={7} className="px-4 py-3 font-bold text-gray-700 text-sm">TOTAL OUTSTANDING (7 DAYS)</td>
                    <td className="px-4 py-3 font-bold text-red-700 text-base">{naira(totalOwed)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Complete Audit Log (7 Days)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Run Time', 'Articles Scanned', 'PR Found', 'Amount', 'Email', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {runs.map((run, i) => (
                  <tr key={run.id || i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                      {run.id
                        ? <Link href={`/scan/${run.id}`} className="hover:text-blue-700 hover:underline">{fmt(run.timestamp)}</Link>
                        : fmt(run.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{run.articles_scanned || 0}</td>
                    <td className="px-4 py-3">
                      {run.pr_count > 0
                        ? <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100">🚨 {run.pr_count}</span>
                        : <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">✅ 0</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">{run.total_cost > 0 ? naira(run.total_cost) : '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {run.email_sent
                        ? <span className="text-green-600">✅ Sent</span>
                        : run.pr_count > 0
                          ? <span className="text-amber-600">⚠ Not sent</span>
                          : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {run.id && (
                        <Link href={`/scan/${run.id}`} className="text-blue-500 hover:text-blue-700 text-xs font-medium whitespace-nowrap">View scan →</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs pb-4">
          Leadership Media Group © 2026 · Automated PR detection · 7-day retention
        </p>
      </main>
    </div>
  )
          }
