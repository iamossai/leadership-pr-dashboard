import { getAuditRuns, isKVConfigured } from '@/lib/storage'
import LogoutButton from './LogoutButton'
import Link from 'next/link'

function fmt(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}
function fmtDate(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', year: 'numeric',
  })
}
function naira(n) { return '₦' + Number(n).toLocaleString() }

export const revalidate = 0 // Always fresh

export default async function Dashboard() {
  const runs = await getAuditRuns(48)
  const isDemo = !isKVConfigured()

  // Aggregate stats
  const allPR = runs.flatMap(r => r.pr_articles || [])
  const totalPR = allPR.length
  const totalCost = allPR.reduce((s, a) => s + (a.cost || 107500), 0)
  const emailsSent = runs.filter(r => r.email_sent).length
  const lastRun = runs[0]?.timestamp

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
              <span className="text-blue-200/50 text-sm hidden sm:block px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                Last 48 hours
              </span>
              <Link href="/archive"
                className="text-blue-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                Archive (7d)
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Demo banner */}
        {isDemo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="text-amber-500 text-xl mt-0.5">⚡</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Demo Mode — Sample Data Displayed</p>
              <p className="text-amber-700 text-xs mt-1">
                Real audit data will appear here once your Vercel KV store is connected.
                Go to <strong>Vercel Dashboard → Storage → KV → Create Store</strong>, connect it to this project, then redeploy.
              </p>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'PR Articles Flagged', value: totalPR, icon: '🚨',
              sub: 'Last 48 hours', color: totalPR > 0 ? '#dc2626' : '#16a34a' },
            { label: 'Total Amount Due', value: naira(totalCost), icon: '💰',
              sub: `${totalPR} × ₦107,500`, color: '#0a2342' },
            { label: 'Audit Emails Sent', value: emailsSent, icon: '📧',
              sub: `of ${runs.length} runs`, color: '#0a2342' },
            { label: 'Last Scan', value: lastRun ? fmt(lastRun) : 'No data',
              icon: '⏱', sub: 'Runs every 6 hours', color: '#0a2342' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{s.sub}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* PR Articles table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">PR Articles Detected</h2>
              <p className="text-gray-400 text-xs mt-0.5">Last 48 hours · ₦107,500 per piece</p>
            </div>
            {totalPR > 0 && (
              <span className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-100">
                {totalPR} flagged
              </span>
            )}
          </div>

          {allPR.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="text-4xl">✅</span>
              <p className="text-gray-600 font-medium mt-3">No PR content detected in the last 48 hours</p>
              <p className="text-gray-400 text-sm mt-1">All recent articles passed the news authenticity check</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['#', 'Article Title', 'Author', 'Published', 'Detection Signals', 'Cost'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allPR.map((art, i) => (
                    <tr key={art.id || i} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <a href={art.url} target="_blank" rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-red-700 hover:underline line-clamp-2 leading-snug">
                          {art.title}
                        </a>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{art.url}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">
                          👤 {art.author || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(art.date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(art.signals || []).slice(0, 3).map((s, j) => (
                            <span key={j} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded border border-orange-100">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-red-600 whitespace-nowrap">{naira(art.cost || 107500)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-red-50 border-t-2 border-red-100">
                    <td colSpan={5} className="px-4 py-3 font-bold text-gray-700 text-sm">TOTAL AMOUNT DUE</td>
                    <td className="px-4 py-3 font-bold text-red-700 text-base">{naira(totalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Audit run history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Audit Run History</h2>
            <p className="text-gray-400 text-xs mt-0.5">Last 48 hours · Every 6 hours</p>
          </div>
          {runs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No audit runs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Run Time', 'Articles Scanned', 'PR Detected', 'Amount', 'Email Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {runs.map((run, i) => (
                    <tr key={run.id || i} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{fmt(run.timestamp)}</td>
                      <td className="px-4 py-3 text-gray-500">{run.articles_scanned || 0}</td>
                      <td className="px-4 py-3">
                        {run.pr_count > 0
                          ? <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100">🚨 {run.pr_count} found</span>
                          : <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">✅ Clean</span>
                        }
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{run.total_cost > 0 ? naira(run.total_cost) : '—'}</td>
                      <td className="px-4 py-3">
                        {run.email_sent
                          ? <span className="text-green-600 text-xs flex items-center gap-1">✅ Sent to {run.email_sent_to?.length || 3} recipients</span>
                          : <span className="text-gray-400 text-xs">— No PR to report</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs pb-4">
          Automated PR detection · Leadership Media Group © 2026 · Runs every 6 hours
        </p>
      </main>
    </div>
  )
}
