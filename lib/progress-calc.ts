/**
 * Funções puras de cálculo de progresso (subtópico → etapa). Sem dependências
 * de servidor (Prisma) — seguras para uso em client components.
 */
export interface ServiceForProgress {
  progress: number | { toString(): string }
  plannedQty: number | { toString(): string }
  unitPrice: number | { toString(): string }
  executedQty: number | { toString(): string }
}

/**
 * Progresso de um subtópico/serviço: se há quantidade planejada, é derivado de
 * executedQty/plannedQty; senão usa o campo manual `progress`.
 */
export function computeServiceProgress(s: ServiceForProgress): number {
  const planned = Number(s.plannedQty)
  if (planned > 0) {
    return Math.min(100, Math.max(0, (Number(s.executedQty) / planned) * 100))
  }
  return Math.min(100, Math.max(0, Number(s.progress)))
}

/**
 * Progresso da etapa: média ponderada do progresso dos subtópicos.
 * Peso = plannedQty * unitPrice (valor financeiro do item); quando não há
 * valor monetário (peso 0), usa peso igual entre os itens.
 */
export function computeStageActualProgress(services: ServiceForProgress[]): number {
  if (services.length === 0) return 0

  const weighted = services.map((s) => {
    const weight = Number(s.plannedQty) * Number(s.unitPrice)
    return { progress: computeServiceProgress(s), weight: weight > 0 ? weight : 1 }
  })

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0)
  if (totalWeight === 0) return 0

  return weighted.reduce((sum, w) => sum + w.progress * w.weight, 0) / totalWeight
}

export function computeStageStatus(stage: {
  status: string
  plannedEndDate: Date | string | null
  actualProgress: number
}): string {
  if (
    stage.plannedEndDate &&
    new Date(stage.plannedEndDate) < new Date() &&
    stage.status !== 'CONCLUIDA' &&
    stage.status !== 'CANCELADA' &&
    stage.actualProgress < 100
  ) {
    return 'ATRASADA'
  }
  return stage.status
}
