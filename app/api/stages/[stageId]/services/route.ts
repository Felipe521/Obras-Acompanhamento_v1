import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recalculateAndPersistStageProgress } from '@/lib/stage-progress'
import { z } from 'zod'

const serviceSchema = z
  .object({
    name: z.string().min(2),
    description: z.string().optional().nullable(),
    unit: z
      .enum(['UNIDADE', 'METRO', 'METRO_QUADRADO', 'METRO_CUBICO', 'KG', 'HORA', 'DIARIA', 'PACOTE', 'OUTRO'])
      .default('UNIDADE'),
    plannedQty: z.number().nonnegative().default(0),
    executedQty: z.number().nonnegative().default(0),
    unitPrice: z.number().nonnegative().default(0),
    progress: z.number().min(0).max(100).default(0),
    status: z.enum(['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).default('NAO_INICIADO'),
    plannedStartDate: z.string().optional().nullable(),
    plannedEndDate: z.string().optional().nullable(),
    actualEndDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => !data.plannedStartDate || !data.plannedEndDate || new Date(data.plannedStartDate) <= new Date(data.plannedEndDate),
    { message: 'A data final não pode ser anterior à data inicial', path: ['plannedEndDate'] }
  )
  .refine((data) => data.plannedQty === 0 || data.executedQty <= data.plannedQty * 1.5, {
    message: 'Quantidade executada muito acima da planejada — confira o valor',
    path: ['executedQty'],
  })

export async function GET(req: NextRequest, { params }: { params: { stageId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const services = await prisma.service.findMany({
    where: { stageId: params.stageId, deletedAt: null },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  })

  return NextResponse.json(services)
}

export async function POST(req: NextRequest, { params }: { params: { stageId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR', 'RESPONSAVEL'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const stage = await prisma.stage.findFirst({ where: { id: params.stageId, deletedAt: null } })
    if (!stage) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })

    const body = await req.json()
    const data = serviceSchema.parse(body)

    const lastService = await prisma.service.findFirst({
      where: { stageId: params.stageId, deletedAt: null },
      orderBy: { order: 'desc' },
    })
    const order = lastService ? lastService.order + 1 : 0

    const service = await prisma.service.create({
      data: {
        stageId: params.stageId,
        name: data.name,
        description: data.description || null,
        unit: data.unit,
        order,
        plannedQty: data.plannedQty,
        executedQty: data.executedQty,
        unitPrice: data.unitPrice,
        progress: data.progress,
        status: data.status,
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : null,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : null,
        actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
        notes: data.notes || null,
      },
    })

    await recalculateAndPersistStageProgress(params.stageId)

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: stage.projectId,
        action: 'CREATE',
        entity: 'Service',
        entityId: service.id,
        newValue: { name: service.name },
        description: `${session.user.name} criou o subtópico "${service.name}" na etapa "${stage.name}"`,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[POST /api/stages/:stageId/services]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
