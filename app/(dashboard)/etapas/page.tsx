'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Layers, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/empty-state'
import { StatusBadge } from '@/components/common/status-badge'
import { ProgressBar } from '@/components/common/progress-bar'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface Stage {
  id: string; name: string; code: string | null; order: number; status: string
  actualProgress: string; plannedStartDate: string | null; plannedEndDate: string | null
  project: { id: string; name: string; code: string; status: string }
  responsible: { id: string; name: string } | null
  _count: { services: number; tasks: number }
}

export default function EtapasPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function fetchStages() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/stages?${params}`)
      if (!res.ok) throw new Error()
      setStages(await res.json())
    } catch { toast.error('Erro ao carregar etapas') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStages() }, [statusFilter])

  const filtered = stages.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.project.name.toLowerCase().includes(search.toLowerCase())
  )

  const countByStatus = {
    total: stages.length,
    concluida: stages.filter(s => s.status === 'CONCLUIDA').length,
    emAndamento: stages.filter(s => s.status === 'EM_ANDAMENTO').length,
    atrasada: stages.filter(s => s.status === 'ATRASADA').length,
    naoIniciada: stages.filter(s => s.status === 'NAO_INICIADA').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Etapas</h1>
        <p className="text-muted-foreground text-sm">Gerencie as etapas de todas as obras</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', count: countByStatus.total, color: 'text-foreground' },
          { label: 'Em andamento', count: countByStatus.emAndamento, color: 'text-blue-400' },
          { label: 'Concluídas', count: countByStatus.concluida, color: 'text-green-400' },
          { label: 'Atrasadas', count: countByStatus.atrasada, color: 'text-red-400' },
          { label: 'Não iniciadas', count: countByStatus.naoIniciada, color: 'text-slate-400' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar etapa ou obra..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="NAO_INICIADA">Não iniciada</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="PAUSADA">Pausada</SelectItem>
            <SelectItem value="CONCLUIDA">Concluída</SelectItem>
            <SelectItem value="ATRASADA">Atrasada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Layers} title="Nenhuma etapa" description="Não há etapas para exibir." />
      ) : (
        <div className="space-y-2">
          {filtered.map(stage => (
            <Card key={stage.id} className="card-hover">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{stage.name}</h3>
                    <StatusBadge status={stage.status as any} type="stage" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <Link href={`/obras/${stage.project.id}`} className="hover:text-primary transition-colors">
                      {stage.project.code} — {stage.project.name}
                    </Link>
                    {stage.responsible && <span>· Resp: {stage.responsible.name}</span>}
                    <span>· {stage._count.services} serviço{stage._count.services !== 1 ? 's' : ''}</span>
                    <span>· {stage._count.tasks} tarefa{stage._count.tasks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 min-w-[200px]">
                  <div className="flex-1">
                    <ProgressBar value={Number(stage.actualProgress)} size="sm" />
                  </div>
                  <span className="text-sm font-semibold tabular-nums w-12 text-right">{Number(stage.actualProgress).toFixed(0)}%</span>
                </div>
                {stage.plannedEndDate && (
                  <span className={`text-xs flex-shrink-0 ${new Date(stage.plannedEndDate) < new Date() && stage.status !== 'CONCLUIDA' ? 'text-red-400' : 'text-muted-foreground'}`}>
                    Prazo: {formatDate(stage.plannedEndDate)}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
