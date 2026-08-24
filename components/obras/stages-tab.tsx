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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

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

  const STATUS_COLORS: Record<string, string> = {
    CONCLUIDA: 'border-l-green-500',
    EM_ANDAMENTO: 'border-l-blue-500',
    ATRASADA: 'border-l-red-500',
    PAUSADA: 'border-l-amber-500',
    NAO_INICIADA: 'border-l-slate-400',
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
            const borderColor = STATUS_COLORS[stage.status] || 'border-l-slate-400'

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

                      {/* Expanded: services */}
                      {isExpanded && stage.services && stage.services.length > 0 && (
                        <div className="mt-3 border-t border-border pt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Serviços ({stage.services.length})
                          </p>
                          <div className="space-y-1.5">
                            {stage.services.map((svc: any) => {
                              const pct = svc.plannedQty > 0
                                ? Math.min(100, (Number(svc.executedQty) / Number(svc.plannedQty)) * 100)
                                : 0
                              return (
                                <div key={svc.id} className="flex items-center gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs truncate">{svc.name}</p>
                                    <div className="flex items-center gap-2">
                                      <ProgressBar value={pct} size="sm" className="flex-1" />
                                      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                                        {pct.toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                  <StatusBadge status={svc.status} type="task" className="flex-shrink-0" />
                                </div>
                              )
                            })}
                          </div>
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir etapa?"
        description="Esta ação removerá a etapa e todos os seus serviços. Não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
