'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/empty-state'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ABERTA: { label: 'Aberta', color: 'text-red-400', bg: 'bg-red-500/10' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  RESOLVIDA: { label: 'Resolvida', color: 'text-green-400', bg: 'bg-green-500/10' },
  CANCELADA: { label: 'Cancelada', color: 'text-slate-400', bg: 'bg-slate-500/10' },
}
const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  CRITICA: { label: 'Crítica', color: 'text-red-400', bg: 'bg-red-500/10' },
  ALTA: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  MEDIA: { label: 'Média', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  BAIXA: { label: 'Baixa', color: 'text-slate-400', bg: 'bg-slate-500/10' },
}
const CATEGORY_MAP: Record<string, string> = {
  SEGURANCA: 'Segurança', MATERIAL: 'Material', MAO_DE_OBRA: 'Mão de obra', PROJETO: 'Projeto',
  FINANCEIRO: 'Financeiro', PRAZO: 'Prazo', QUALIDADE: 'Qualidade', OUTROS: 'Outros',
}

interface Occurrence {
  id: string; title: string; description: string; category: string; priority: string; status: string
  date: string; resolvedAt: string | null
  project: { id: string; name: string; code: string }
  stage: { id: string; name: string } | null
  responsible: { id: string; name: string } | null
  _count: { photos: number; comments: number }
}

export default function OcorrenciasPage() {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      const res = await fetch(`/api/occurrences?${params}`)
      if (!res.ok) throw new Error()
      setOccurrences(await res.json())
    } catch { toast.error('Erro ao carregar ocorrências') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [statusFilter, priorityFilter])

  const filtered = occurrences.filter(o =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.project.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCount = occurrences.filter(o => o.status === 'ABERTA' || o.status === 'EM_ANDAMENTO').length
  const criticalCount = occurrences.filter(o => o.priority === 'CRITICA' && o.status !== 'RESOLVIDA').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ocorrências</h1>
        <p className="text-muted-foreground text-sm">
          {openCount} aberta{openCount !== 1 ? 's' : ''}
          {criticalCount > 0 && <span className="text-red-400"> · {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}</span>}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar ocorrência..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            {Object.entries(PRIORITY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Nenhuma ocorrência" description="Não há ocorrências registradas." />
      ) : (
        <div className="space-y-3">
          {filtered.map(occ => {
            const st = STATUS_MAP[occ.status] || STATUS_MAP.ABERTA
            const pr = PRIORITY_MAP[occ.priority] || PRIORITY_MAP.MEDIA
            return (
              <Card key={occ.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${pr.bg} flex items-center justify-center flex-shrink-0`}>
                      <AlertTriangle className={`w-5 h-5 ${pr.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-sm">{occ.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color} ${st.bg} font-medium`}>{st.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${pr.color} ${pr.bg} font-medium`}>{pr.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{CATEGORY_MAP[occ.category]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{occ.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <Link href={`/obras/${occ.project.id}`} className="hover:text-primary transition-colors">
                          {occ.project.code} — {occ.project.name}
                        </Link>
                        {occ.stage && <span>· {occ.stage.name}</span>}
                        <span>· {formatDate(occ.date)}</span>
                        {occ.responsible && <span>· Resp: {occ.responsible.name}</span>}
                        {occ._count.comments > 0 && <span>· {occ._count.comments} comentário{occ._count.comments !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
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
