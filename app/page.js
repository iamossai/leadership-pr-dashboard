import { getAuditRuns, isKVConfigured, getArticleStatuses } from '@/lib/storage'
import LogoutButton from './LogoutButton'
import Link from 'next/link'
import PRArticlesPanel from './components/PRArticlesPanel'

function fmt(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}
function naira(n) { return '\u20a6' + Number(n).toLocaleString() }

export const revalidate = 0

export default async function Dashboard() {
  const [runs, statuses] = await Promise.all([
    getAuditRuns(48),
    getArticleStatuses(),
  ])
  const isDemo = !isKVConfigured()

  const allPR = runs.flatMap(r => r.pr_articles || [])
  const flaggedPR = allPR.filter(a => !statuses[a.url] || statuses[a.url] === 'flagged')
  const totalCost = flaggedPR.reduce((s, a) => s + (a.cost || 107500), 0)
  const emailsSent = runs.filter(r => r.email_sent).length
  const lastRun = runs[0]?.timestamp

  return (
    <div className="min-h-screen bg-slate-50">
      <header style={{ background: '#0a2342' }} className="shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">\ud83d\udd0d</span>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Leadership.ng</h1>
                <p className="text-blue-300 text-xs">PR Audit Dashboard</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <span className="text-blue-200/50 text-sm hidden sm:block px-2 py-1 rounded-lg bg-white/5 border border-white/10">Last 48 hours</span>
              <Link href="/archive" className="text-blue-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Archive (7d)</Link>
              <LogoutButton />
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isDemo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="text-amber-500 text-xl mt-0.5">\u26a1</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Demo Mode</p>
              <p className="text-amber-700 text-xs mt-1">Connect Vercel KV to display real audit data.</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'PR Articles Flagged', value: flaggedPR.length, icon: '\ud83d\udea8', sub: 'Last 48 hours', color: flaggedPR.length > 0 ? '#dc2626' : '#16a34a' },
            { label: 'Total Amount Due', value: naira(totalCost), icon: '\ud83d\udcb0', sub: flaggedPR.length + ' \u00d7 \u20a6107,500', color: '#0a2342' },
            { label: 'Audit Emails Sent', value: emailsSent, icon: '\ud83d\udce7', sub: 'of ' + runs.length + ' runs', color: '#0a2342' },
            { label: 'Last Scan', value: lastRun ? fmt(lastRun) : 'No data', icon: '\u23f1', sub: 'Runs every 6 hours', color: '#0a2342' },
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
        <PRArticlesPanel articles={allPR} statuses={statuses} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Audit Run History</h2>
            <p className="text-gray-400 text-xs mt-0.5">Last 48 hours \u00b7 Every 6 hours</p>
          </div>
          {runs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">No audit runs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Run Time', 'Articles Scanned', 'PR Detected', 'Amount', 'Email Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {runs.map((run, i) => (
                    <tr key={run.id || i} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                        {run.id ? <Link href={`/scan/${run.id}`} className="hover:text-blue-700 hover:underline">{fmt(run.timestamp)}</Link> : fmt(run.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{run.articles_scanned || 0}</td>
                      <td className="px-4 py-3">
                        {run.pr_count > 0
                          ? <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100">\ud83d\udea8 {run.pr_count} found</span>
                          : <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">\u2705 Clean</span>
                        }
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{run.total_cost > 0 ? naira(run.total_cost) : '\u2014'}</td>
                      <td className="px-4 py-3">
                        {run.email_sent
                          ? <span className="text-green-600 text-xs">\u2705 Sent</span>
                          : <span className="text-gray-400 text-xs">\u2014 No PR</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {run.id && <Link href={`/scan/${run.id}`} className="text-blue-500 hover:text-blue-700 text-xs font-medium whitespace-nowrap">View scan \u2192</Link>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-center text-gray-400 text-xs pb-4">Automated PR detection \u00b7 Leadership Media Group \u00a9 2026</p>
      </main>
    </div>
  )
                    }
