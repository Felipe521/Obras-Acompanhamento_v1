'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GanttChart, type GanttStage, type GanttTask, type GanttService } from '@/components/schedule/gantt-chart'
import { TaskForm } from '@/components/schedule/task-form'
import { ServiceForm } from '@/components/obras/service-form'
import { toast } from 'sonner'

export default function CronogramaPage() {
  const { data: session } = useSession()
  const [stages, setStages] = useState<GanttStage[]>([])
  const [loading, setLoading] = useState(true)
  const [projectFilter, setProjectFilter] = useState('all')
  const [taskForm, setTaskForm] = useState<{ projectId: string; stageId: string } | null>(null)
  const [editTask, setEditTask] = useState<{ task: GanttTask; projectId: string; stageId: string } | null>(null)
  const [serviceForm, setServiceForm] = useState<{ stageId: string } | null>(null)
  const [editService, setEditService] = useState<{ service: any; stageId: string } | null>(null)
  const [loadingService, setLoadingService] = useState(false)

  const canEdit = ['ADMIN', 'GESTOR', 'RESPONSAVEL'].includes((session?.user as any)?.role || '')

  async function fetchStages() {
    setLoading(true)
    try {
      const res = await fetch('/api/stages?includeTasks=true')
      if (!res.ok) throw new Error()
      setStages(await res.json())
    } catch {
      toast.error('Erro ao carregar cronograma')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStages()
  }, [])

  const projects = Array.from(new Map(stages.map((s: any) => [s.project.id, s.project])).values())
  const filtered = projectFilter === 'all' ? stages : stages.filter((s: any) => s.project.id === projectFilter)

  async function handleReschedule(taskId: string, startDate: Date, dueDate: Date) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startDate.toISOString(), dueDate: dueDate.toISOString() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro')
      }
      toast.success('Atividade reagendada')
      await fetchStages()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reagendar atividade')
    }
  }

  async function handleServiceReschedule(serviceId: string, startDate: Date, endDate: Date) {
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedStartDate: startDate.toISOString(), plannedEndDate: endDate.toISOString() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro')
      }
      toast.success('Subetapa reagendada')
      await fetchStages()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao reagendar subetapa')
    }
  }

  const projectStages = (projectId: string) =>
    stages.filter((s: any) => s.project.id === projectId).map((s) => ({ id: s.id, name: s.name }))

  // Busca o registro completo da subetapa antes de editar — os campos do
  // Gantt são resumidos (nome/status/datas/progresso) e não devem ser usados
  // para preencher o formulário, senão salvar apagaria qtd/preço/observações reais.
  async function openEditService(service: GanttService, stageId: string) {
    setLoadingService(true)
    try {
      const res = await fetch(`/api/services/${service.id}`)
      if (!res.ok) throw new Error()
      setEditService({ service: await res.json(), stageId })
    } catch {
      toast.error('Erro ao carregar subetapa')
    } finally {
      setLoadingService(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cronograma</h1>
          <p className="text-muted-foreground text-sm">Etapas, subetapas e atividades — arraste uma barra para reagendar</p>
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Todas as obras" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as obras</SelectItem>
            {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="h-80 rounded-xl bg-muted animate-pulse" />
      ) : (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">
              Gantt — {filtered.length} etapa{filtered.length !== 1 ? 's' : ''}
            </CardTitle>
            {canEdit && projectFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setServiceForm({ stageId: projectStages(projectFilter)[0]?.id || '' })}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Nova subetapa
                </Button>
                <Button
                  size="sm"
                  onClick={() => setTaskForm({ projectId: projectFilter, stageId: projectStages(projectFilter)[0]?.id || '' })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova atividade
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <GanttChart
              stages={filtered as any}
              editable={canEdit}
              groupByProject={projectFilter === 'all'}
              onTaskReschedule={handleReschedule}
              onAddTask={(stageId) => {
                const stage: any = stages.find((s) => s.id === stageId)
                if (stage) setTaskForm({ projectId: stage.project.id, stageId })
              }}
              onTaskClick={(task, stage: any) => setEditTask({ task, projectId: stage.project.id, stageId: stage.id })}
              onAddService={(stageId) => setServiceForm({ stageId })}
              onServiceClick={(service, stage: any) => openEditService(service, stage.id)}
              onServiceReschedule={handleServiceReschedule}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={!!taskForm} onOpenChange={(open) => !open && setTaskForm(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova atividade</DialogTitle>
          </DialogHeader>
          {taskForm && (
            <TaskForm
              projectId={taskForm.projectId}
              stages={projectStages(taskForm.projectId)}
              defaultStageId={taskForm.stageId}
              onSuccess={() => {
                setTaskForm(null)
                fetchStages()
              }}
              onCancel={() => setTaskForm(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTask} onOpenChange={(open) => !open && setEditTask(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar atividade</DialogTitle>
          </DialogHeader>
          {editTask && (
            <TaskForm
              projectId={editTask.projectId}
              stages={projectStages(editTask.projectId)}
              task={{ ...editTask.task, stageId: editTask.stageId }}
              onSuccess={() => {
                setEditTask(null)
                fetchStages()
              }}
              onCancel={() => setEditTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!serviceForm || !!editService} onOpenChange={(open) => { if (!open) { setServiceForm(null); setEditService(null) } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editService ? 'Editar subetapa' : 'Nova subetapa'}</DialogTitle>
          </DialogHeader>
          {(serviceForm || editService) && (
            <ServiceForm
              stageId={editService?.stageId || serviceForm?.stageId || ''}
              service={editService?.service}
              onSuccess={() => {
                setServiceForm(null)
                setEditService(null)
                fetchStages()
              }}
              onCancel={() => {
                setServiceForm(null)
                setEditService(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
