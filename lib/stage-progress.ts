import { prisma } from '@/lib/prisma'
import { computeStageActualProgress, computeStageStatus } from '@/lib/progress-calc'

export { computeServiceProgress, computeStageActualProgress, computeStageStatus } from '@/lib/progress-calc'
export type { ServiceForProgress } from '@/lib/progress-calc'

/**
 * Recalcula o progresso de uma etapa a partir dos seus subtópicos e persiste
 * (actualProgress + status, se o status calculado mudar). Chamado após
 * criar/editar/excluir um Service. Server-only (usa Prisma).
 */
export async function recalculateAndPersistStageProgress(stageId: string) {
  const [services, stage] = await Promise.all([
    prisma.service.findMany({
      where: { stageId, deletedAt: null },
      select: { progress: true, plannedQty: true, unitPrice: true, executedQty: true },
    }),
    prisma.stage.findUnique({ where: { id: stageId } }),
  ])

  if (!stage) return null

  const actualProgress = computeStageActualProgress(services)
  const status = computeStageStatus({
    status: stage.status,
    plannedEndDate: stage.plannedEndDate,
    actualProgress,
  })

  return prisma.stage.update({
    where: { id: stageId },
    data: {
      actualProgress,
      ...(status !== stage.status ? { status: status as typeof stage.status } : {}),
    },
  })
}
