import Link from 'next/link'
import { Building2, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">404</h1>
        <p className="text-slate-400 text-sm mb-6">Esta página não existe ou foi removida.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors px-4 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
