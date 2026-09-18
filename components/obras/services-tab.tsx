'use client'

import { useEffect, useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ServiceForm } from '@/components/obras/service-form'
import { ServiceTable } from '@/components/obras/service-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ServicesTabProps {
  stages: { id: string; name: string; code?: string | null }[]
  canEdit: boolean
}

export function ServicesTab({ stages, canEdit }: ServicesTabProps) {
  const [stageId, setStageId] = useState<string>(stages[0]?.id || '')
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editService, setEditService] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchServices() {
    if (!stageId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/stages/${stageId}/services`)
      if (!res.ok) throw new Error()
      setServices(await res.json())
    } catch {
      toast.error('Erro ao carregar subetapas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [stageId])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/services/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Subetapa excluída com sucesso')
      setDeleteId(null)
      await fetchServices()
    } catch {
      toast.error('Erro ao excluir subetapa')
    } finally {
      setDeleting(false)
    }
  }

  async function moveService(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= services.length) return
    // Reatribui a ordem sequencial de toda a lista (não só troca dois valores) —
    // isso também corrige de vez subetapas antigas que empatavam no mesmo número.
    const reordered = [...services]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)
    try {
      const res = await fetch(`/api/stages/${stageId}/services/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reordered.map((s, i) => ({ id: s.id, order: i })) }),
      })
      if (!res.ok) throw new Error()
      await fetchServices()
    } catch {
      toast.error('Erro ao reordenar subetapas')
    }
  }

  if (stages.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Nenhuma etapa cadastrada"
        description="Crie etapas na aba 'Etapas' antes de adicionar subetapas."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Select value={stageId} onValueChange={setStageId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Selecionar etapa" />
          </SelectTrigger>
          <SelectContent>
            {stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && stageId && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova subetapa
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nenhuma subetapa cadastrada"
          description="Divida esta etapa em subetapas para acompanhar o progresso em detalhe."
          action={canEdit ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova subetapa
            </Button>
          ) : undefined}
        />
      ) : (
        <ServiceTable
          services={services}
          canEdit={canEdit}
          onEdit={setEditService}
          onDelete={setDeleteId}
          onMove={moveService}
        />
      )}

      <Dialog
        open={showForm || !!editService}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setEditService(null)
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editService ? 'Editar subetapa' : 'Nova subetapa'}</DialogTitle>
          </DialogHeader>
          <ServiceForm
            stageId={stageId}
            service={editService}
            onSuccess={() => {
              setShowForm(false)
              setEditService(null)
              fetchServices()
            }}
            onCancel={() => {
              setShowForm(false)
              setEditService(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir subetapa?"
        description="Esta ação removerá a subetapa. O progresso da etapa será recalculado. Não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
