'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanButton() {
  const [state, setState] = useState('idle') // idle | scanning | done | error
  const [result, setResult] = useState(null)
  const router = useRouter()

  async function runScan() {
    setState('scanning')
    setResult(null)
    try {
      const res = await fetch('/api/scan/run', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scan failed')
      setResult(data)
      setState('done')
      // Refresh dashboard data after a short delay so the user sees the result first
      setTimeout(() => {
        router.refresh()
        setState('idle')
        setResult(null)
      }, 4000)
    } catch (e) {
      setResult({ error: e.message })
      setState('error')
      setTimeout(() => { setState('idle'); setResult(null) }, 5000)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {state === 'done' && result && (
        <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg animate-pulse">
          ✅ Done — {result.articles_scanned} articles scanned · {result.pr_count} PR found
          {result.pr_count > 0 && ` · ₦${Number(result.total_cost).toLocaleString()} detected`}
        </span>
      )}
      {state === 'error' && result && (
        <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg">
          ❌ {result.error}
        </span>
      )}
      <button
        onClick={runScan}
        disabled={state === 'scanning'}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border transition-all"
        style={{
          background: state === 'scanning' ? '#f1f5f9' : '#ffffff',
          color: state === 'scanning' ? '#94a3b8' : '#0a2342',
          borderColor: state === 'scanning' ? '#e2e8f0' : '#0a2342',
          cursor: state === 'scanning' ? 'not-allowed' : 'pointer',
          boxShadow: state !== 'scanning' ? '0 1px 3px rgba(10,35,66,0.12)' : 'none',
        }}
      >
        {state === 'scanning' ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Scanning…
          </>
        ) : (
          <>🔄 Run Scan Now</>
        )}
      </button>
    </div>
  )
}
