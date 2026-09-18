'use client'

import { useState } from 'react'
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
import { SERVICE_UNIT_MAP } from '@/lib/constants'

const serviceSchema = z
  .object({
    name: z.string().min(2, 'Nome obrigatório'),
    description: z.string().optional(),
    unit: z.enum(['UNIDADE', 'METRO', 'METRO_QUADRADO', 'METRO_CUBICO', 'KG', 'HORA', 'DIARIA', 'PACOTE', 'OUTRO']),
    plannedQty: z.string().optional(),
    executedQty: z.string().optional(),
    unitPrice: z.string().optional(),
    progress: z.string().optional(),
    status: z.enum(['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']),
    plannedStartDate: z.string().optional(),
    plannedEndDate: z.string().optional(),
    actualEndDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => !data.plannedStartDate || !data.plannedEndDate || data.plannedStartDate <= data.plannedEndDate,
    { message: 'A data final não pode ser anterior à data inicial', path: ['plannedEndDate'] }
  )

type ServiceFormData = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  stageId: string
  service?: any
  onSuccess: () => void
  onCancel: () => void
}

export function ServiceForm({ stageId, service, onSuccess, onCancel }: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || '',
      description: service?.description || '',
      unit: service?.unit || 'UNIDADE',
      plannedQty: String(service?.plannedQty ?? 0),
      executedQty: String(service?.executedQty ?? 0),
      unitPrice: String(service?.unitPrice ?? 0),
      progress: String(service?.progress ?? 0),
      status: service?.status || 'NAO_INICIADO',
      plannedStartDate: service?.plannedStartDate ? new Date(service.plannedStartDate).toISOString().split('T')[0] : '',
      plannedEndDate: service?.plannedEndDate ? new Date(service.plannedEndDate).toISOString().split('T')[0] : '',
      actualEndDate: service?.actualEndDate ? new Date(service.actualEndDate).toISOString().split('T')[0] : '',
      notes: service?.notes || '',
    },
  })

  const unit = watch('unit')
  const status = watch('status')
  const plannedQty = parseFloat(watch('plannedQty') || '0')
  const hasQty = plannedQty > 0

  async function onSubmit(data: ServiceFormData) {
    setIsLoading(true)
    try {
      const plannedQtyNum = parseFloat(data.plannedQty || '0')
      const executedQtyNum = parseFloat(data.executedQty || '0')
      const payload = {
        ...data,
        plannedQty: plannedQtyNum,
        executedQty: executedQtyNum,
        unitPrice: parseFloat(data.unitPrice || '0'),
        progress: plannedQtyNum > 0 ? Math.min(100, (executedQtyNum / plannedQtyNum) * 100) : parseFloat(data.progress || '0'),
        plannedStartDate: data.plannedStartDate || null,
        plannedEndDate: data.plannedEndDate || null,
        actualEndDate: data.actualEndDate || null,
      }

      const url = service ? `/api/services/${service.id}` : `/api/stages/${stageId}/services`
      const method = service ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro')
      }

      toast.success(service ? 'Subetapa atualizada!' : 'Subetapa criada!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar subetapa')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nome *</Label>
        <Input placeholder="Ex: Escavação" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Unidade</Label>
          <Select value={unit} onValueChange={(v) => setValue('unit', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_UNIT_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NAO_INICIADO">Não iniciado</SelectItem>
              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
              <SelectItem value="CONCLUIDO">Concluído</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Qtd. planejada</Label>
          <Input type="number" min="0" step="0.01" {...register('plannedQty')} />
        </div>
        <div className="space-y-1.5">
          <Label>Qtd. executada</Label>
          <Input type="number" min="0" step="0.01" {...register('executedQty')} />
          {errors.executedQty && <p className="text-xs text-destructive">{errors.executedQty.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Valor unitário (R$)</Label>
          <Input type="number" min="0" step="0.01" {...register('unitPrice')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Progresso (%) {hasQty && <span className="text-muted-foreground font-normal">— calculado pela quantidade</span>}</Label>
        <Input type="number" min="0" max="100" step="0.1" disabled={hasQty} {...register('progress')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Data início prevista</Label>
          <Input type="date" {...register('plannedStartDate')} />
        </div>
        <div className="space-y-1.5">
          <Label>Data fim prevista</Label>
          <Input type="date" {...register('plannedEndDate')} />
          {errors.plannedEndDate && <p className="text-xs text-destructive">{errors.plannedEndDate.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Data de conclusão real</Label>
        <Input type="date" {...register('actualEndDate')} />
      </div>

      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea placeholder="Descrição da subetapa..." rows={2} {...register('description')} />
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
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : service ? 'Salvar' : 'Criar subetapa'}
        </Button>
      </div>
    </form>
  )
}
