'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Ruler, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/empty-state'
import { ProgressBar } from '@/components/common/progress-bar'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  RASCUNHO: { label: 'Rascunho', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ENVIADA: { label: 'Enviada', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  APROVADA: { label: 'Aprovada', color: 'text-green-400', bg: 'bg-green-500/10' },
  REJEITADA: { label: 'Rejeitada', color: 'text-red-400', bg: 'bg-red-500/10' },
}

interface Measurement {
  id: string; number: number; date: string; value: string; progress: string; status: string
  notes: string | null
  project: { id: string; name: string; code: string }
  stage: { id: string; name: string } | null
  responsible: { id: string; name: string } | null
}

export default function MedicoesPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  async function fetchMeasurements() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/measurements?${params}`)
      if (!res.ok) throw new Error()
      setMeasurements(await res.json())
    } catch { toast.error('Erro ao carregar medições') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMeasurements() }, [statusFilter])

  const totalValue = measurements.reduce((s, m) => s + Number(m.value), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Medições</h1>
        <p className="text-muted-foreground text-sm">{measurements.length} medição{measurements.length !== 1 ? 'ões' : ''} · Total: {formatCurrency(totalValue)}</p>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : measurements.length === 0 ? (
        <EmptyState icon={Ruler} title="Nenhuma medição" description="As medições aparecerão aqui quando criadas." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {measurements.map(m => {
            const st = STATUS_MAP[m.status] || STATUS_MAP.RASCUNHO
            return (
              <Card key={m.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Medição #{m.number}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color} ${st.bg} font-medium`}>{st.label}</span>
                      </div>
                      <Link href={`/obras/${m.project.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        {m.project.code} — {m.project.name}
                      </Link>
                    </div>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(m.value)}</p>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progresso executado</span>
                      <span className="font-medium">{Number(m.progress).toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={Number(m.progress)} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(m.date)}</span>
                    {m.responsible && <span>Resp: {m.responsible.name}</span>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
