'use client'
import { useState } from 'react'

function naira(n) { return '₦' + Number(n).toLocaleString() }

function fmt(ts) {
  return new Date(ts).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function decodeHtml(str) {
  if (!str) return str
  return str
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

const TABS = [
  { key: 'flagged', label: '🚨 Flagged', emptyMsg: 'No PR articles currently flagged' },
  { key: 'paid',    label: '✅ Paid',    emptyMsg: 'No articles marked as paid yet' },
  { key: 'false',   label: '🚫 False Positives', emptyMsg: 'No false positives recorded yet' },
]

export default function PRArticlesPanel({ articles: initialArticles, statuses: initialStatuses }) {
  const [statuses, setStatuses] = useState(initialStatuses || {})
  const [activeTab, setActiveTab] = useState('flagged')
  const [loading, setLoading] = useState({})

  const getStatus = (url) => statuses[url] || 'flagged'

  const updateStatus = async (url, newStatus) => {
    setLoading(prev => ({ ...prev, [url]: true }))
    // Optimistic update
    setStatuses(prev => ({ ...prev, [url]: newStatus }))
    try {
      const res = await fetch('/api/article-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, status: newStatus }),
      })
      if (!res.ok) throw new Error('Server error')
    } catch {
      // Revert on failure
      setStatuses(prev => ({ ...prev, [url]: statuses[url] || 'flagged' }))
      alert('Failed to update status. Please try again.')
    } finally {
      setLoading(prev => ({ ...prev, [url]: false }))
    }
  }

  const tabArticles = initialArticles.filter(art => getStatus(art.url) === activeTab)
  const flaggedCount = initialArticles.filter(art => getStatus(art.url) === 'flagged').length
  const paidCount    = initialArticles.filter(art => getStatus(art.url) === 'paid').length
  const falseCount   = initialArticles.filter(art => getStatus(art.url) === 'false').length
  const totalDue     = initialArticles.filter(art => getStatus(art.url) === 'flagged').reduce((s, a) => s + (a.cost || 107500), 0)
  const totalPaid    = initialArticles.filter(art => getStatus(art.url) === 'paid').reduce((s, a) => s + (a.cost || 107500), 0)
  const counts = { flagged: flaggedCount, paid: paidCount, false: falseCount }

  // All cleared state
  const allCleared = initialArticles.length > 0 && flaggedCount === 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">PR Articles Detected</h2>
          <p className="text-gray-400 text-xs mt-0.5">Last 48 hours · ₦107,500 per piece</p>
        </div>
        {initialArticles.length > 0 && (
          <div className="flex items-center gap-3">
            {allCleared ? (
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">✅ All resolved</span>
            ) : (
              <>
                <span className="text-sm font-bold text-red-700">Total due: {naira(totalDue)}</span>
                <span className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-100">{flaggedCount} flagged</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex border-b border-gray-100">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50/30'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab.key === 'flagged' ? 'bg-red-100 text-red-700' :
                tab.key === 'paid'    ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-600'
              }`}>{counts[tab.key]}</span>
            )}
          </button>
        ))}
      </div>

      {tabArticles.length === 0 ? (
        <div className="px-6 py-12 text-center">
          {activeTab === 'flagged' ? (
            <>
              <span className="text-4xl">{initialArticles.length === 0 ? '📭' : '✅'}</span>
              <p className="text-gray-600 font-medium mt-3">
                {initialArticles.length === 0
                  ? 'No PR content detected in the last 48 hours'
                  : 'All PR articles have been resolved'}
              </p>
              {allCleared && paidCount > 0 && (
                <p className="text-gray-400 text-sm mt-1">{naira(totalPaid)} marked as paid · {falseCount} false positive{falseCount !== 1 ? 's' : ''}</p>
              )}
            </>
          ) : (
            <>
              <span className="text-3xl">{activeTab === 'paid' ? '💳' : '🚫'}</span>
              <p className="text-gray-500 mt-3 text-sm">{TABS.find(t => t.key === activeTab)?.emptyMsg}</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['#', 'Article Title', 'Author', 'Published', 'Detection Signals', activeTab === 'flagged' ? 'Cost' : 'Amount', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tabArticles.map((art, i) => (
                <tr key={art.url || i} className={`transition-colors ${
                  activeTab === 'flagged' ? 'hover:bg-red-50/30' :
                  activeTab === 'paid'    ? 'bg-green-50/20 hover:bg-green-50/40' :
                  'bg-gray-50/30 hover:bg-gray-100/40'
                }`}>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <a href={art.url} target="_blank" rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-red-700 hover:underline line-clamp-2 leading-snug">
                      {decodeHtml(art.title)}
                    </a>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{art.url}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-medium">👤 {art.author || 'Unknown'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmt(art.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(art.signals || []).slice(0, 3).map((s, j) => (
                        <span key={j} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded border border-orange-100">{s}</span>
                      ))}
                      {(art.signals || []).length > 3 && (
                        <span className="text-gray-400 text-xs">+{art.signals.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap">
                    {activeTab === 'flagged'
                      ? <span className="text-red-600">{naira(art.cost || 107500)}</span>
                      : activeTab === 'paid'
                      ? <span className="text-green-600 line-through opacity-60">{naira(art.cost || 107500)}</span>
                      : <span className="text-gray-400 line-through opacity-50">{naira(art.cost || 107500)}</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {activeTab === 'flagged' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateStatus(art.url, 'paid')}
                          disabled={loading[art.url]}
                          className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                          {loading[art.url] ? '…' : '✓ Paid'}
                        </button>
                        <button
                          onClick={() => updateStatus(art.url, 'false')}
                          disabled={loading[art.url]}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                          {loading[art.url] ? '…' : '✗ False'}
                        </button>
                      </div>
                    )}
                    {(activeTab === 'paid' || activeTab === 'false') && (
                      <button
                        onClick={() => updateStatus(art.url, 'flagged')}
                        disabled={loading[art.url]}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                        {loading[art.url] ? '…' : '← Flag'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {activeTab === 'flagged' && tabArticles.length > 0 && (
              <tfoot>
                <tr className="bg-red-50 border-t-2 border-red-100">
                  <td colSpan={6} className="px-4 py-3 font-bold text-gray-700 text-sm">TOTAL AMOUNT DUE</td>
                  <td className="px-4 py-3 font-bold text-red-700 text-base">{naira(totalDue)}</td>
                </tr>
              </tfoot>
            )}
            {activeTab === 'paid' && tabArticles.length > 0 && (
              <tfoot>
                <tr className="bg-green-50 border-t-2 border-green-100">
                  <td colSpan={6} className="px-4 py-3 font-bold text-gray-700 text-sm">TOTAL PAID</td>
                  <td className="px-4 py-3 font-bold text-green-700 text-base">{naira(totalPaid)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}
