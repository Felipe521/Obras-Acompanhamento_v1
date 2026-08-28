'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/common/status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  CONCLUIDA: 'bg-green-500', EM_ANDAMENTO: 'bg-blue-500', ATRASADA: 'bg-red-500',
  PAUSADA: 'bg-amber-500', NAO_INICIADA: 'bg-slate-400',
}

interface Stage {
  id: string; name: string; status: string; actualProgress: string
  plannedStartDate: string | null; plannedEndDate: string | null
  project: { id: string; name: string; code: string; status: string }
}

export default function CronogramaPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [projectFilter, setProjectFilter] = useState('all')

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch('/api/stages')
        if (!res.ok) throw new Error()
        setStages(await res.json())
      } catch { toast.error('Erro ao carregar cronograma') }
      finally { setLoading(false) }
    }
    fetch_()
  }, [])

  const projects = Array.from(new Map(stages.map(s => [s.project.id, s.project])).values())
  const filtered = projectFilter === 'all' ? stages : stages.filter(s => s.project.id === projectFilter)
  const stagesWithDates = filtered.filter(s => s.plannedStartDate && s.plannedEndDate)

  const minDate = stagesWithDates.length > 0
    ? new Date(Math.min(...stagesWithDates.map(s => new Date(s.plannedStartDate!).getTime())))
    : new Date()
  const maxDate = stagesWithDates.length > 0
    ? new Date(Math.max(...stagesWithDates.map(s => new Date(s.plannedEndDate!).getTime())))
    : new Date()
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Generate month labels
  const months: { label: string; left: number; width: number }[] = []
  if (stagesWithDates.length > 0) {
    const current = new Date(minDate)
    current.setDate(1)
    while (current <= maxDate) {
      const startOfMonth = new Date(Math.max(current.getTime(), minDate.getTime()))
      const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0)
      const end = new Date(Math.min(endOfMonth.getTime(), maxDate.getTime()))
      const left = Math.ceil((startOfMonth.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
      const width = Math.ceil((end.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24))
      const label = current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      months.push({ label, left: (left / totalDays) * 100, width: (width / totalDays) * 100 })
      current.setMonth(current.getMonth() + 1)
      current.setDate(1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cronograma</h1>
          <p className="text-muted-foreground text-sm">Visualização Gantt de todas as obras</p>
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Todas as obras" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as obras</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="h-80 rounded-xl bg-muted animate-pulse" />
      ) : stagesWithDates.length === 0 ? (
        <EmptyState icon={Calendar} title="Sem dados no cronograma" description="Adicione datas nas etapas para visualizar o Gantt." />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gantt — {stagesWithDates.length} etapa{stagesWithDates.length !== 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Month headers */}
              <div className="flex items-center h-8 mb-2 relative ml-48">
                {months.map((m, i) => (
                  <div key={i} className="absolute text-xs text-muted-foreground font-medium" style={{ left: `${m.left}%` }}>
                    {m.label}
                  </div>
                ))}
              </div>
              {/* Stages */}
              <div className="space-y-1.5">
                {filtered.map(stage => {
                  if (!stage.plannedStartDate || !stage.plannedEndDate) return null
                  const startDays = Math.ceil((new Date(stage.plannedStartDate).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
                  const duration = Math.max(1, Math.ceil((new Date(stage.plannedEndDate).getTime() - new Date(stage.plannedStartDate).getTime()) / (1000 * 60 * 60 * 24)))
                  const left = `${(startDays / totalDays) * 100}%`
                  const width = `${Math.max(2, (duration / totalDays) * 100)}%`
                  const color = STATUS_COLORS[stage.status] || 'bg-slate-400'
                  const progress = Number(stage.actualProgress)

                  return (
                    <div key={stage.id} className="flex items-center gap-3 h-9">
                      <div className="w-48 flex-shrink-0 pr-2">
                        <p className="text-xs font-medium truncate">{stage.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{stage.project.code}</p>
                      </div>
                      <div className="flex-1 relative h-7 bg-muted/50 rounded">
                        <div className={`absolute top-0 bottom-0 rounded ${color} opacity-25`} style={{ left, width }} />
                        <div className={`absolute top-0 bottom-0 rounded ${color}`} style={{ left, width: `calc(${width} * ${progress / 100})` }} />
                        <div className="absolute top-0 bottom-0 flex items-center" style={{ left, width }}>
                          <span className="text-[10px] text-white font-bold ml-1 drop-shadow">{progress}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${color}`} />
                    <StatusBadge status={status as any} type="stage" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
