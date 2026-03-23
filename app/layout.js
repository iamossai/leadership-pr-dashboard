import './globals.css'

export const metadata = {
  title: 'PR Audit Dashboard — Leadership.ng',
  description: 'Content audit and PR detection system for Leadership Media Group',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  )
}
