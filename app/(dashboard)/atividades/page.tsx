'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Search, Calendar, Clock, User, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/empty-state'
import { StatusBadge } from '@/components/common/status-badge'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const PRIORITY_COLORS: Record<string, string> = {
  URGENTE: 'border-l-red-500',
  ALTA: 'border-l-amber-500',
  MEDIA: 'border-l-blue-500',
  BAIXA: 'border-l-slate-400',
}
const PRIORITY_LABELS: Record<string, string> = {
  URGENTE: 'Urgente', ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa',
}

interface Task {
  id: string; title: string; description: string | null; priority: string; status: string
  dueDate: string | null; completedAt: string | null
  project: { id: string; name: string; code: string }
  stage: { id: string; name: string } | null
  assignee: { id: string; name: string } | null
  creator: { id: string; name: string }
  _count: { comments: number; attachments: number }
}

export default function AtividadesPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function fetchTasks() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/tasks?${params}`)
      if (!res.ok) throw new Error()
      setTasks(await res.json())
    } catch { toast.error('Erro ao carregar atividades') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTasks() }, [statusFilter])

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.project.name.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = {
    A_FAZER: filtered.filter(t => t.status === 'A_FAZER'),
    EM_ANDAMENTO: filtered.filter(t => t.status === 'EM_ANDAMENTO'),
    CONCLUIDA: filtered.filter(t => t.status === 'CONCLUIDA'),
    CANCELADA: filtered.filter(t => t.status === 'CANCELADA'),
  }

  const isOverdue = (d: string | null) => d && new Date(d) < new Date()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atividades</h1>
        <p className="text-muted-foreground text-sm">Acompanhe as atividades de todas as obras</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar atividade ou obra..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="A_FAZER">A fazer</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
            <SelectItem value="CONCLUIDA">Concluída</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'A fazer', count: grouped.A_FAZER.length, color: 'text-slate-400', bg: 'bg-slate-500/10' },
          { label: 'Em andamento', count: grouped.EM_ANDAMENTO.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Concluídas', count: grouped.CONCLUIDA.length, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Canceladas', count: grouped.CANCELADA.length, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
              </div>
              <span className="text-sm font-medium">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Nenhuma atividade" description="Não há atividades para exibir." />
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <Card key={task.id} className={`border-l-4 ${PRIORITY_COLORS[task.priority] || 'border-l-slate-400'} card-hover`}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{task.title}</h3>
                    <StatusBadge status={task.status as any} type="task" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <Link href={`/obras/${task.project.id}`} className="hover:text-primary transition-colors">
                      {task.project.code} — {task.project.name}
                    </Link>
                    {task.stage && <span>· {task.stage.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    task.priority === 'URGENTE' ? 'bg-red-500/10 text-red-400' :
                    task.priority === 'ALTA' ? 'bg-amber-500/10 text-amber-400' :
                    task.priority === 'MEDIA' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>{PRIORITY_LABELS[task.priority]}</span>
                  {task.assignee && <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assignee.name.split(' ')[0]}</span>}
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== 'CONCLUIDA' ? 'text-red-400' : ''}`}>
                      <Calendar className="w-3 h-3" />{formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
