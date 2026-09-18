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
import { EXPENSE_CATEGORY_MAP, SERVICE_UNIT_MAP, PAYMENT_METHODS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

const expenseSchema = z.object({
  projectId: z.string().min(1, 'Selecione a obra'),
  date: z.string().min(1, 'Data obrigatória'),
  description: z.string().min(2, 'Descrição obrigatória'),
  category: z.enum(['MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'TRANSPORTE', 'SERVICOS', 'OUTROS']),
  stageId: z.string().optional(),
  serviceId: z.string().optional(),
  supplierId: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  unitValue: z.string().optional(),
  realizedValue: z.string().optional(),
  paymentMethod: z.string().optional(),
  invoiceNumber: z.string().optional(),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO']),
  notes: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  expense?: any
  defaultProjectId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function ExpenseForm({ expense, defaultProjectId, onSuccess, onCancel }: ExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string; code: string }[]>([])
  const [stages, setStages] = useState<{ id: string; name: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; companyName: string; tradeName: string | null }[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      projectId: expense?.project?.id || defaultProjectId || '',
      date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: expense?.description || '',
      category: expense?.category || 'MATERIAL',
      stageId: expense?.stage?.id || '',
      serviceId: expense?.service?.id || '',
      supplierId: expense?.supplier?.id || '',
      quantity: expense?.quantity != null ? String(expense.quantity) : '',
      unit: expense?.unit || '',
      unitValue: expense?.unitValue != null ? String(expense.unitValue) : '',
      realizedValue: expense?.realizedValue != null ? String(expense.realizedValue) : '',
      paymentMethod: expense?.paymentMethod || '',
      invoiceNumber: expense?.invoiceNumber || '',
      status: expense?.status || 'PENDENTE',
      notes: expense?.notes || '',
    },
  })

  const projectId = watch('projectId')
  const stageId = watch('stageId')
  const category = watch('category')
  const unit = watch('unit')
  const status = watch('status')
  const quantity = parseFloat(watch('quantity') || '0')
  const unitValue = parseFloat(watch('unitValue') || '0')
  const hasQtyPricing = quantity > 0 && unitValue > 0
  const computedTotal = hasQtyPricing ? quantity * unitValue : null

  useEffect(() => {
    fetch('/api/projects?limit=200')
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d?.data) ? d.data : []))
      .catch(() => {})
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => setSuppliers(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!projectId) {
      setStages([])
      return
    }
    fetch(`/api/projects/${projectId}/stages`)
      .then((r) => r.json())
      .then((d) => setStages(Array.isArray(d) ? d.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => setStages([]))
  }, [projectId])

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

  async function onSubmit(data: ExpenseFormData) {
    if (!hasQtyPricing && !data.realizedValue) {
      toast.error('Informe o valor realizado ou quantidade + valor unitário')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        date: data.date,
        description: data.description,
        category: data.category,
        stageId: data.stageId || null,
        serviceId: data.serviceId || null,
        supplierId: data.supplierId || null,
        quantity: data.quantity ? parseFloat(data.quantity) : null,
        unit: data.unit || null,
        unitValue: data.unitValue ? parseFloat(data.unitValue) : null,
        realizedValue: hasQtyPricing ? computedTotal : parseFloat(data.realizedValue || '0'),
        paymentMethod: data.paymentMethod || null,
        invoiceNumber: data.invoiceNumber || null,
        status: data.status,
        notes: data.notes || null,
      }

      const url = expense ? `/api/expenses/${expense.id}` : `/api/projects/${data.projectId}/expenses`
      const method = expense ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro')
      }

      toast.success(expense ? 'Despesa atualizada!' : 'Despesa registrada!')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar despesa')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Obra *</Label>
          <Select value={projectId} onValueChange={(v) => { setValue('projectId', v); setValue('stageId', ''); setValue('serviceId', '') }} disabled={!!expense}>
            <SelectTrigger><SelectValue placeholder="Selecionar obra" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Data *</Label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Descrição *</Label>
        <Input placeholder="Ex: Compra de cimento" {...register('description')} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={category} onValueChange={(v) => setValue('category', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(EXPENSE_CATEGORY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Etapa</Label>
          <Select value={stageId || 'none'} onValueChange={(v) => { setValue('stageId', v === 'none' ? '' : v); setValue('serviceId', '') }} disabled={!projectId}>
            <SelectTrigger><SelectValue placeholder="Sem etapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem etapa</SelectItem>
              {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Subetapa</Label>
          <Select value={watch('serviceId') || 'none'} onValueChange={(v) => setValue('serviceId', v === 'none' ? '' : v)} disabled={!stageId || services.length === 0}>
            <SelectTrigger><SelectValue placeholder="Sem subetapa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem subetapa</SelectItem>
              {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Fornecedor</Label>
        <Select value={watch('supplierId') || 'none'} onValueChange={(v) => setValue('supplierId', v === 'none' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Sem fornecedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem fornecedor</SelectItem>
            {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.tradeName || s.companyName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Quantidade</Label>
          <Input type="number" min="0" step="0.01" placeholder="0" {...register('quantity')} />
        </div>
        <div className="space-y-1.5">
          <Label>Unidade</Label>
          <Select value={unit || 'none'} onValueChange={(v) => setValue('unit', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {Object.entries(SERVICE_UNIT_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Valor unitário (R$)</Label>
          <Input type="number" min="0" step="0.01" placeholder="0,00" {...register('unitValue')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Valor total (R$) {hasQtyPricing && <span className="text-muted-foreground font-normal">— calculado (qtd × valor unitário)</span>}</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
          disabled={hasQtyPricing}
          value={hasQtyPricing ? computedTotal!.toFixed(2) : watch('realizedValue')}
          {...register('realizedValue')}
        />
        {hasQtyPricing && <p className="text-xs text-muted-foreground">{formatCurrency(computedTotal!)}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Forma de pagamento</Label>
          <Select value={watch('paymentMethod') || 'none'} onValueChange={(v) => setValue('paymentMethod', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setValue('status', v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Nº da nota fiscal</Label>
        <Input placeholder="Ex: 12345" {...register('invoiceNumber')} />
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
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : expense ? 'Salvar' : 'Registrar despesa'}
        </Button>
      </div>
    </form>
  )
}
