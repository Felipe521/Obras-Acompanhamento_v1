'use client'

import { Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/status-badge'
import { ProgressBar } from '@/components/common/progress-bar'
import { computeServiceProgress } from '@/lib/progress-calc'
import { SERVICE_UNIT_MAP } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

interface ServiceTableProps {
  stageOrder?: number
  services: any[]
  canEdit: boolean
  onEdit: (service: any) => void
  onDelete: (id: string) => void
  onMove: (index: number, direction: -1 | 1) => void
}

/**
 * Tabela hierárquica de subtópicos (numerada 1, 2, 3...), no padrão de
 * orçamento por etapa — nome, quantidade, valores e progresso em colunas,
 * com uma linha de totais ao final.
 */
export function ServiceTable({ stageOrder, services, canEdit, onEdit, onDelete, onMove }: ServiceTableProps) {
  const totalValue = services.reduce((sum, s) => sum + Number(s.plannedQty) * Number(s.unitPrice), 0)
  const avgProgress = services.length > 0
    ? services.reduce((sum, s) => sum + computeServiceProgress(s), 0) / services.length
    : 0

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs min-w-[640px]">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="text-left p-2 pl-3 font-medium text-muted-foreground w-10">#</th>
            <th className="text-left p-2 font-medium text-muted-foreground">Subtópico</th>
            <th className="text-right p-2 font-medium text-muted-foreground whitespace-nowrap">Qtd. (prev/exec)</th>
            <th className="text-right p-2 font-medium text-muted-foreground whitespace-nowrap">Valor unit.</th>
            <th className="text-right p-2 font-medium text-muted-foreground whitespace-nowrap">Valor total</th>
            <th className="text-left p-2 font-medium text-muted-foreground w-32">Progresso</th>
            <th className="text-center p-2 font-medium text-muted-foreground">Status</th>
            {canEdit && <th className="text-center p-2 pr-3 font-medium text-muted-foreground w-20">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {services.map((svc, index) => {
            const pct = computeServiceProgress(svc)
            const value = Number(svc.plannedQty) * Number(svc.unitPrice)
            const unitLabel = SERVICE_UNIT_MAP[svc.unit as keyof typeof SERVICE_UNIT_MAP]?.label || svc.unit
            return (
              <tr key={svc.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group">
                <td className="p-2 pl-3 text-muted-foreground tabular-nums align-top">
                  {stageOrder != null ? `${stageOrder}.${index + 1}` : index + 1}
                </td>
                <td className="p-2 align-top">
                  <p className="font-medium">{svc.name}</p>
                  {svc.notes && <p className="text-muted-foreground text-[11px] mt-0.5">{svc.notes}</p>}
                </td>
                <td className="p-2 text-right tabular-nums align-top whitespace-nowrap">
                  {Number(svc.plannedQty) > 0 ? (
                    <>{Number(svc.executedQty)}/{Number(svc.plannedQty)} <span className="text-muted-foreground">{unitLabel}</span></>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-2 text-right tabular-nums align-top">
                  {Number(svc.unitPrice) > 0 ? formatCurrency(svc.unitPrice) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="p-2 text-right tabular-nums align-top font-medium">
                  {value > 0 ? formatCurrency(value) : <span className="text-muted-foreground font-normal">—</span>}
                </td>
                <td className="p-2 align-top">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={pct} size="sm" className="flex-1" />
                    <span className="tabular-nums text-muted-foreground w-8 text-right">{pct.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="p-2 text-center align-top">
                  <StatusBadge status={svc.status} type="service" />
                </td>
                {canEdit && (
                  <td className="p-2 pr-3 align-top">
                    <div className="flex items-center justify-center gap-0.5">
                      <div className="hidden group-hover:flex flex-col mr-0.5">
                        <button disabled={index === 0} onClick={() => onMove(index, -1)} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button disabled={index === services.length - 1} onClick={() => onMove(index, 1)} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(svc)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(svc.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/40 font-semibold">
            <td className="p-2 pl-3" colSpan={2}>Total ({services.length} subtópico{services.length !== 1 ? 's' : ''})</td>
            <td />
            <td />
            <td className="p-2 text-right tabular-nums">{formatCurrency(totalValue)}</td>
            <td className="p-2 tabular-nums text-muted-foreground">{avgProgress.toFixed(0)}% médio</td>
            <td colSpan={canEdit ? 2 : 1} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
