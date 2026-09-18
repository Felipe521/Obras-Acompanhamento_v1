'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/status-badge'
import { ProgressBar } from '@/components/common/progress-bar'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { StageForm } from '@/components/obras/stage-form'
import { ServiceForm } from '@/components/obras/service-form'
import { ServiceTable } from '@/components/obras/service-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { STAGE_STATUS_BORDER_CLASS } from '@/lib/constants'

interface StagesTabProps {
  project: any
  canEdit: boolean
}

export function StagesTab({ project, canEdit }: StagesTabProps) {
  const [stages, setStages] = useState<any[]>(project.stages || [])
  const [showForm, setShowForm] = useState(false)
  const [editStage, setEditStage] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  const [serviceFormStageId, setServiceFormStageId] = useState<string | null>(null)
  const [editService, setEditService] = useState<any | null>(null)
  const [deleteServiceId, setDeleteServiceId] = useState<{ stageId: string; id: string } | null>(null)
  const [deletingService, setDeletingService] = useState(false)

  async function fetchStages() {
    try {
      const res = await fetch(`/api/projects/${project.id}/stages`)
      if (res.ok) {
        const data = await res.json()
        setStages(data)
      }
    } catch {}
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/stages/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Etapa excluída com sucesso')
      setDeleteId(null)
      await fetchStages()
    } catch {
      toast.error('Erro ao excluir etapa')
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeleteService() {
    if (!deleteServiceId) return
    setDeletingService(true)
    try {
      const res = await fetch(`/api/services/${deleteServiceId.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Subetapa excluída com sucesso')
      setDeleteServiceId(null)
      await fetchStages()
    } catch {
      toast.error('Erro ao excluir subetapa')
    } finally {
      setDeletingService(false)
    }
  }

  async function moveService(stage: any, index: number, direction: -1 | 1) {
    const services = [...stage.services].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= services.length) return

    // Reatribui a ordem sequencial de toda a lista (não só troca dois valores) —
    // isso também corrige de vez subetapas antigas que empatavam no mesmo número.
    const reordered = [...services]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
    try {
      const res = await fetch(`/api/stages/${stage.id}/services/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reordered.map((s: any, i: number) => ({ id: s.id, order: i })) }),
      })
      if (!res.ok) throw new Error()
      await fetchStages()
    } catch {
      toast.error('Erro ao reordenar subetapas')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {stages.length} etapa{stages.length !== 1 ? 's' : ''} cadastrada{stages.length !== 1 ? 's' : ''}
        </p>
        {canEdit && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova etapa
          </Button>
        )}
      </div>

      {/* Stages */}
      {stages.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nenhuma etapa cadastrada"
          description="Crie as etapas da obra para acompanhar o progresso."
          action={
            canEdit ? (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova etapa
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {stages.map((stage) => {
            const isExpanded = expandedStage === stage.id
            const borderColor = STAGE_STATUS_BORDER_CLASS[stage.status] || 'border-l-slate-400'
            const sortedServices = [...(stage.services || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))

            return (
              <Card key={stage.id} className={`border-l-4 ${borderColor}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                      className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {/* Stage number */}
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {stage.order || stages.indexOf(stage) + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">{stage.name}</h3>
                            {stage.code && (
                              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {stage.code}
                              </span>
                            )}
                            <StatusBadge status={stage.status} type="stage" />
                          </div>
                          {stage.responsible && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Resp: {stage.responsible.name}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {canEdit && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditStage(stage)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(stage.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span className="font-medium text-foreground tabular-nums">
                            {Number(stage.actualProgress).toFixed(1)}%
                          </span>
                        </div>
                        <ProgressBar value={Number(stage.actualProgress)} size="sm" />
                      </div>

                      {/* Dates */}
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {stage.plannedStartDate && (
                          <span>Início: {formatDate(stage.plannedStartDate)}</span>
                        )}
                        {stage.plannedEndDate && (
                          <span>Prazo: {formatDate(stage.plannedEndDate)}</span>
                        )}
                      </div>

                      {/* Expanded: subetapas (services) */}
                      {isExpanded && (
                        <div className="mt-3 border-t border-border pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Subetapas ({sortedServices.length})
                            </p>
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => setServiceFormStageId(stage.id)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Subetapa
                              </Button>
                            )}
                          </div>

                          {sortedServices.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">Nenhuma subetapa cadastrada.</p>
                          ) : (
                            <ServiceTable
                              stageOrder={stage.order || stages.indexOf(stage) + 1}
                              services={sortedServices}
                              canEdit={canEdit}
                              onEdit={(svc) => setEditService({ ...svc, stageId: stage.id })}
                              onDelete={(id) => setDeleteServiceId({ stageId: stage.id, id })}
                              onMove={(index, direction) => moveService(stage, index, direction)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Stage Dialog */}
      <Dialog
        open={showForm || !!editStage}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setEditStage(null)
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editStage ? 'Editar etapa' : 'Nova etapa'}</DialogTitle>
          </DialogHeader>
          <StageForm
            projectId={project.id}
            stage={editStage}
            onSuccess={() => {
              setShowForm(false)
              setEditStage(null)
              fetchStages()
            }}
            onCancel={() => {
              setShowForm(false)
              setEditStage(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Create/Edit Service (subetapa) Dialog */}
      <Dialog
        open={!!serviceFormStageId || !!editService}
        onOpenChange={(open) => {
          if (!open) {
            setServiceFormStageId(null)
            setEditService(null)
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editService ? 'Editar subetapa' : 'Nova subetapa'}</DialogTitle>
          </DialogHeader>
          <ServiceForm
            stageId={editService?.stageId || serviceFormStageId || ''}
            service={editService}
            onSuccess={() => {
              setServiceFormStageId(null)
              setEditService(null)
              fetchStages()
            }}
            onCancel={() => {
              setServiceFormStageId(null)
              setEditService(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm — Stage */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir etapa?"
        description="Esta ação removerá a etapa e todos os seus subetapas. Não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Delete Confirm — Service */}
      <ConfirmDialog
        open={!!deleteServiceId}
        onOpenChange={(open) => !open && setDeleteServiceId(null)}
        title="Excluir subetapa?"
        description="Esta ação removerá a subetapa. O progresso da etapa será recalculado. Não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDeleteService}
        loading={deletingService}
      />
    </div>
  )
}
