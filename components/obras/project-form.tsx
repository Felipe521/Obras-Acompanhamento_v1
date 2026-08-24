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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const projectSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  client: z.string().min(2, 'Cliente obrigatório'),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'CANCELADA']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  totalBudget: z.string().optional(),
  responsibleId: z.string().optional(),
  notes: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: any
  onSuccess: () => void
  onCancel: () => void
  projectId?: string
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      client: project?.client || '',
      clientEmail: project?.clientEmail || '',
      clientPhone: project?.clientPhone || '',
      address: project?.address || '',
      city: project?.city || '',
      state: project?.state || '',
      description: project?.description || '',
      status: project?.status || 'PLANEJAMENTO',
      startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      totalBudget: project?.totalBudget ? String(project.totalBudget) : '',
      responsibleId: project?.responsibleId || '',
      notes: project?.notes || '',
    },
  })

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  async function onSubmit(data: ProjectFormData) {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        totalBudget: data.totalBudget ? parseFloat(data.totalBudget.replace(',', '.')) : null,
        responsibleId: data.responsibleId || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
      }

      const url = project ? `/api/projects/${project.id}` : '/api/projects'
      const method = project ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro desconhecido')
      }

      toast.success(project ? 'Obra atualizada com sucesso!' : 'Obra criada com sucesso!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar obra')
    } finally {
      setIsLoading(false)
    }
  }

  const status = watch('status')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome da obra *</Label>
          <Input id="name" placeholder="Ex: Residencial Alpha" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setValue('status', v as any)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLANEJAMENTO">Planejamento</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="PAUSADA">Pausada</SelectItem>
              <SelectItem value="CONCLUIDA">Concluída</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="client">Cliente *</Label>
          <Input id="client" placeholder="Nome do cliente" {...register('client')} />
          {errors.client && <p className="text-xs text-destructive">{errors.client.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clientPhone">Telefone do cliente</Label>
          <Input id="clientPhone" placeholder="(11) 99999-9999" {...register('clientPhone')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="clientEmail">Email do cliente</Label>
        <Input id="clientEmail" type="email" placeholder="cliente@email.com" {...register('clientEmail')} />
        {errors.clientEmail && <p className="text-xs text-destructive">{errors.clientEmail.message}</p>}
      </div>

      {/* Address */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" placeholder="Rua, número" {...register('address')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" placeholder="São Paulo" {...register('city')} />
        </div>
      </div>

      {/* Dates & Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Data de início</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Previsão de conclusão</Label>
          <Input id="endDate" type="date" {...register('endDate')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="totalBudget">Orçamento total (R$)</Label>
          <Input id="totalBudget" placeholder="0,00" {...register('totalBudget')} />
        </div>
      </div>

      {/* Responsible */}
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
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descrição da obra..."
          rows={3}
          {...register('description')}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          placeholder="Observações gerais..."
          rows={2}
          {...register('notes')}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : project ? (
            'Salvar alterações'
          ) : (
            'Criar obra'
          )}
        </Button>
      </div>
    </form>
  )
}
