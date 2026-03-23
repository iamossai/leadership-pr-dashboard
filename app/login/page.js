'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) { router.push('/'); router.refresh() }
      else setError('Invalid username or password. Please try again.')
    } catch { setError('Connection error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a2342 0%, #1a3f6f 100%)' }}>
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leadership.ng</h1>
          <p className="text-blue-200 text-sm mt-1">PR Content Audit Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Sign in to continue</h2>
            <p className="text-gray-400 text-sm mt-0.5">Authorised personnel only</p>
          </div>
          <form onSubmit={handleLogin} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="Enter your username" required autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="••••••••••" required
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
                <span>⚠</span><span>{error}</span>
              </div>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: loading ? '#94a3b8' : '#0a2342' }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-300/60 text-xs mt-6">
          Leadership Media Group © 2026 — Confidential
        </p>
      </div>
    </div>
  )
}
