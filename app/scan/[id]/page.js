import { getAuditRunById } from '@/lib/storage'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

function fmt(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function ScoreBadge({ score, isPR }) {
  if (isPR) return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">🚨 {score} — PR</span>
  if (score >= 3) return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">⚠ {score}</span>
  return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">✓ {score}</span>
}

export default async function ScanDetailPage({ params }) {
  const run = await getAuditRunById(params.id)
  if (!run) notFound()

  const articles = (run.all_articles || []).sort((a, b) => b.score - a.score)
  const prCount = articles.filter(a => a.isPR).length
  const borderline = articles.filter(a => !a.isPR && a.score >= 3).length
  const clean = articles.filter(a => a.score < 3).length

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
              <Link href="/" className="text-blue-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">← Dashboard</Link>
              <Link href="/archive" className="text-blue-200 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Archive</Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/" className="hover:text-gray-600">Dashboard</Link><span>›</span><span>Scan Detail</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Scan — {fmt(run.timestamp)}</h2>
          <p className="text-gray-500 text-sm mt-1">{run.articles_scanned} articles scanned · Algorithm v2</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Articles Scanned', value: run.articles_scanned || articles.length, icon: '📄', color: '#0a2342' },
            { label: 'PR Detected', value: prCount, icon: '🚨', color: prCount > 0 ? '#dc2626' : '#16a34a' },
            { label: 'Borderline (3–5)', value: borderline, icon: '⚠️', color: borderline > 0 ? '#d97706' : '#6b7280' },
            { label: 'Clean (0–2)', value: clean, icon: '✅', color: '#16a34a' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-2xl font-bold mt-3" style={{ color: s.color }}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center">
            <span className="text-4xl">📫</span>
            <p className="text-gray-600 font-medium mt-3">No per-article scoring data for this run</p>
            <p className="text-gray-400 text-sm mt-1">Article-level detail is recorded from the next scan onward</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">All Scanned Articles</h3>
                <p className="text-gray-400 text-xs mt-0.5">Sorted by score · Algorithm v2 (≥6 + strong signal = PR)</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full border border-red-100 font-semibold">🚨 PR ≥6</span>
                <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100 font-semibold">⚠ 3–5</span>
                <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-100 font-semibold">✓ 0–2</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['#', 'Article Title', 'Author', 'Score', 'Signals Detected'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {articles.map((art, i) => {
                    const bg = art.isPR ? 'bg-red-50/40 hover:bg-red-50/70' : art.score >= 3 ? 'bg-amber-50/20 hover:bg-amber-50/50' : 'hover:bg-gray-50/60'
                    return (
                      <tr key={i} className={`transition-colors ${bg}`}>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs w-10">{i + 1}</td>
                        <td className="px-4 py-3" style={{ maxWidth: '360px' }}>
                          <a href={art.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 hover:text-blue-700 hover:underline leading-snug block">{art.title}</a>
                          <p className="text-gray-400 text-xs mt-0.5">{new Date(art.pubDate).toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">👤 {art.author || 'Unknown'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap"><ScoreBadge score={art.score} isPR={art.isPR} /></td>
                        <td className="px-4 py-3">
                          {art.signals && art.signals.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {art.signals.map((sig, j) => (
                                <span key={j} className={`text-xs px-2 py-0.5 rounded border ${art.isPR ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>{sig}</span>
                              ))}
                            </div>
                          ) : <span className="text-gray-300 text-xs">No signals</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p className="text-center text-gray-400 text-xs pb-4">Scan ID: {params.id} · Leadership Media Group © 2026</p>
      </main>
    </div>
  )
}
