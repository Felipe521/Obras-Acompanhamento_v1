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

const taskSchema = z
  .object({
    title: z.string().min(2, 'Título obrigatório'),
    description: z.string().optional(),
    stageId: z.string().optional(),
    serviceId: z.string().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
    status: z.enum(['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    progress: z.string().optional(),
  })
  .refine((data) => !data.startDate || !data.dueDate || data.startDate <= data.dueDate, {
    message: 'A data final não pode ser anterior à data inicial',
    path: ['dueDate'],
  })

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  projectId: string
  stages: { id: string; name: string }[]
  task?: any
  defaultStageId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function TaskForm({ projectId, stages, task, defaultStageId, onSuccess, onCancel }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string }[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      stageId: task?.stageId || defaultStageId || '',
      serviceId: task?.serviceId || '',
      assigneeId: task?.assigneeId || '',
      priority: task?.priority || 'MEDIA',
      status: task?.status || 'A_FAZER',
      startDate: task?.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      progress: String(task?.progress ?? 0),
    },
  })

  const stageId = watch('stageId')
  const serviceId = watch('serviceId')
  const assigneeId = watch('assigneeId')
  const priority = watch('priority')
  const status = watch('status')

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!stageId) {
      setServices([])
      return
    }
    fetch(`/api/stages/${stageId}/services`)
      .then((r) => r.json())
      .then((d) => setServices(Array.isArray(d) ? d : []))
      .catch(() => setServices([]))
  }, [stageId])

  async function onSubmit(data: TaskFormData) {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        stageId: data.stageId || null,
        serviceId: data.serviceId || null,
        assigneeId: data.assigneeId || null,
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        progress: parseFloat(data.progress || '0'),
      }

      const url = task ? `/api/tasks/${task.id}` : `/api/projects/${projectId}/tasks`
      const method = task ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro')
      }

      toast.success(task ? 'Atividade atualizada!' : 'Atividade criada!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar atividade')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Título *</Label>
        <Input placeholder="Ex: Concretagem da laje" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Etapa</Label>
          <Select value={stageId || 'none'} onValueChange={(v) => { setValue('stageId', v === 'none' ? '' : v); setValue('serviceId', '') }}>
            <SelectTrigger><SelectValue placeholder="Sem etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem etapa</SelectItem>
              {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Subetapa</Label>
          <Select value={serviceId || 'none'} onValueChange={(v) => setValue('serviceId', v === 'none' ? '' : v)} disabled={!stageId || services.length === 0}>
            <SelectTrigger><SelectValue placeholder="Sem subetapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem subetapa</SelectItem>
              {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setValue('priority', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="URGENTE">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A_FAZER">A fazer</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="CONCLUIDA">Concluída</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Data inicial</Label>
          <Input type="date" {...register('startDate')} />
        </div>
        <div className="space-y-1.5">
          <Label>Data final</Label>
          <Input type="date" {...register('dueDate')} />
          {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Progresso (%)</Label>
        <Input type="number" min="0" max="100" step="1" {...register('progress')} />
      </div>

      {users.length > 0 && (
        <div className="space-y-1.5">
          <Label>Responsável</Label>
          <Select value={assigneeId || 'none'} onValueChange={(v) => setValue('assigneeId', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecionar responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea placeholder="Observações..." rows={2} {...register('description')} />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : task ? 'Salvar' : 'Criar atividade'}
        </Button>
      </div>
    </form>
  )
}
