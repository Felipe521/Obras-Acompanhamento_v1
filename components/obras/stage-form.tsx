'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const stageSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  code: z.string().optional(),
  description: z.string().optional(),
  responsibleId: z.string().optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  plannedProgress: z.string().optional(),
  status: z.enum(['NAO_INICIADA', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'ATRASADA']),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
  notes: z.string().optional(),
})

type StageFormData = z.infer<typeof stageSchema>

interface StageFormProps {
  projectId: string
  stage?: any
  onSuccess: () => void
  onCancel: () => void
}

export function StageForm({ projectId, stage, onSuccess, onCancel }: StageFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: stage?.name || '',
      code: stage?.code || '',
      description: stage?.description || '',
      responsibleId: stage?.responsibleId || '',
      plannedStartDate: stage?.plannedStartDate
        ? new Date(stage.plannedStartDate).toISOString().split('T')[0] : '',
      plannedEndDate: stage?.plannedEndDate
        ? new Date(stage.plannedEndDate).toISOString().split('T')[0] : '',
      plannedProgress: String(stage?.plannedProgress || 0),
      status: stage?.status || 'NAO_INICIADA',
      priority: stage?.priority || 'MEDIA',
      notes: stage?.notes || '',
    },
  })

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  async function onSubmit(data: StageFormData) {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        plannedProgress: parseFloat(data.plannedProgress || '0'),
        responsibleId: data.responsibleId || null,
        plannedStartDate: data.plannedStartDate || null,
        plannedEndDate: data.plannedEndDate || null,
      }

      const url = stage ? `/api/stages/${stage.id}` : `/api/projects/${projectId}/stages`
      const method = stage ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro')
      }

      toast.success(stage ? 'Etapa atualizada!' : 'Etapa criada!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar etapa')
    } finally {
      setIsLoading(false)
    }
  }

  const status = watch('status')
  const priority = watch('priority')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nome *</Label>
          <Input placeholder="Ex: Fundação" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Código</Label>
          <Input placeholder="Ex: FUND" {...register('code')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setValue('status', v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NAO_INICIADA">Não iniciada</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="PAUSADA">Pausada</SelectItem>
              <SelectItem value="CONCLUIDA">Concluída</SelectItem>
              <SelectItem value="ATRASADA">Atrasada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setValue('priority', v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="URGENTE">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Data início planejada</Label>
          <Input type="date" {...register('plannedStartDate')} />
        </div>
        <div className="space-y-1.5">
          <Label>Data fim planejada</Label>
          <Input type="date" {...register('plannedEndDate')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Progresso planejado (%)</Label>
        <Input type="number" min="0" max="100" step="0.1" placeholder="0" {...register('plannedProgress')} />
      </div>

      {users.length > 0 && (
        <div className="space-y-1.5">
          <Label>Responsável</Label>
          <Select
            value={watch('responsibleId') || 'none'}
            onValueChange={(v) => setValue('responsibleId', v === 'none' ? '' : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecionar responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea placeholder="Descrição da etapa..." rows={2} {...register('description')} />
      </div>

      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea placeholder="Observações..." rows={2} {...register('notes')} />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : stage ? 'Salvar' : 'Criar etapa'}
        </Button>
      </div>
    </form>
  )
}
