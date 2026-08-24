'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  HardHat,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/status-badge'
import { ProgressBar } from '@/components/common/progress-bar'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ProjectForm } from '@/components/obras/project-form'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ProjectStatus } from '@prisma/client'

interface Project {
  id: string
  code: string
  name: string
  client: string
  status: ProjectStatus
  startDate: string | null
  endDate: string | null
  totalBudget: number | null
  avgProgress: number
  responsible: { name: string } | null
  _count: { stages: number; tasks: number; members: number }
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'PLANEJAMENTO', label: 'Planejamento' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'PAUSADA', label: 'Pausada' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

export default function ObrasPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchProjects() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/projects?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar obras')
      const data = await res.json()
      setProjects(data.data)
    } catch {
      toast.error('Erro ao carregar obras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [search, statusFilter])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Obra excluída com sucesso')
      setDeleteId(null)
      fetchProjects()
    } catch {
      toast.error('Erro ao excluir obra')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Obras</h1>
          <p className="text-muted-foreground text-sm">
            {projects.length} obra{projects.length !== 1 ? 's' : ''} encontrada{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 self-start">
          <Plus className="w-4 h-4" />
          Nova obra
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="Nenhuma obra encontrada"
          description={search || statusFilter !== 'all' ? 'Tente ajustar os filtros.' : 'Comece criando sua primeira obra.'}
          action={
            !search && statusFilter === 'all' ? (
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova obra
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="card-hover group">
              <CardContent className="p-5">
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center flex-shrink-0">
                      <HardHat className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{project.code}</p>
                      <h3 className="font-semibold text-sm truncate leading-tight">{project.name}</h3>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/obras/${project.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditProject(project)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(project.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Client */}
                <p className="text-xs text-muted-foreground mb-3 truncate">
                  Cliente: <span className="text-foreground">{project.client}</span>
                </p>

                {/* Status + Responsible */}
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={project.status} type="project" />
                  {project.responsible && (
                    <span className="text-xs text-muted-foreground truncate ml-2">
                      {project.responsible.name}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progresso</span>
                    <span className="font-medium text-foreground tabular-nums">{project.avgProgress}%</span>
                  </div>
                  <ProgressBar value={project.avgProgress} />
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project._count.stages} etapas · {project._count.members} membros</span>
                  {project.endDate && (
                    <span>Prazo: {formatDate(project.endDate)}</span>
                  )}
                </div>

                {/* Budget */}
                {project.totalBudget && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Orçamento: <span className="font-medium text-foreground">{formatCurrency(project.totalBudget)}</span>
                    </p>
                  </div>
                )}

                {/* View button */}
                <div className="mt-3">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/obras/${project.id}`}>Ver detalhes</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm || !!editProject} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false)
          setEditProject(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProject ? 'Editar obra' : 'Nova obra'}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editProject}
            onSuccess={() => {
              setShowForm(false)
              setEditProject(null)
              fetchProjects()
            }}
            onCancel={() => {
              setShowForm(false)
              setEditProject(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir obra?"
        description="Esta ação irá remover a obra e todos os seus dados. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
