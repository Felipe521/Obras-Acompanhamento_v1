import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const stageSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  description: z.string().optional().nullable(),
  order: z.number().int().default(0),
  responsibleId: z.string().optional().nullable(),
  plannedStartDate: z.string().optional().nullable(),
  plannedEndDate: z.string().optional().nullable(),
  actualStartDate: z.string().optional().nullable(),
  actualEndDate: z.string().optional().nullable(),
  plannedProgress: z.number().min(0).max(100).default(0),
  status: z.enum(['NAO_INICIADA', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'ATRASADA']).default('NAO_INICIADA'),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
  notes: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const stages = await prisma.stage.findMany({
      where: { projectId: params.id, deletedAt: null },
      include: {
        responsible: { select: { id: true, name: true, image: true } },
        services: { where: { deletedAt: null }, select: { status: true, plannedQty: true, executedQty: true, unitPrice: true } },
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
      orderBy: { order: 'asc' },
    })

    // Auto-calculate and update status for overdue stages
    const now = new Date()
    const stagesWithCalc = stages.map((stage) => {
      const services = stage.services
      let actualProgress = Number(stage.actualProgress)

      if (services.length > 0) {
        const totalQty = services.reduce((sum, s) => sum + Number(s.plannedQty), 0)
        const executedQty = services.reduce((sum, s) => sum + Number(s.executedQty), 0)
        actualProgress = totalQty > 0 ? Math.min(100, (executedQty / totalQty) * 100) : 0
      }

      // Auto status: if past end date and not concluded => ATRASADA
      let status = stage.status
      if (
        stage.plannedEndDate &&
        new Date(stage.plannedEndDate) < now &&
        stage.status !== 'CONCLUIDA' &&
        (stage.status as string) !== 'CANCELADA'
      ) {
        status = 'ATRASADA'
      }

      return { ...stage, actualProgress, status }
    })

    return NextResponse.json(stagesWithCalc)
  } catch (error) {
    console.error('[GET /api/projects/:id/stages]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = stageSchema.parse(body)

    // Get next order if not provided
    const lastStage = await prisma.stage.findFirst({
      where: { projectId: params.id, deletedAt: null },
      orderBy: { order: 'desc' },
    })
    const order = data.order || (lastStage ? lastStage.order + 1 : 1)

    const stage = await prisma.stage.create({
      data: {
        projectId: params.id,
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        order,
        responsibleId: data.responsibleId || null,
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : null,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : null,
        actualStartDate: data.actualStartDate ? new Date(data.actualStartDate) : null,
        actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : null,
        plannedProgress: data.plannedProgress,
        status: data.status,
        priority: data.priority,
        notes: data.notes || null,
        color: data.color || null,
      },
      include: {
        responsible: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: params.id,
        action: 'CREATE',
        entity: 'Stage',
        entityId: stage.id,
        newValue: { name: stage.name },
        description: `${session.user.name} criou a etapa "${stage.name}"`,
      },
    })

    return NextResponse.json(stage, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[POST /api/projects/:id/stages]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
