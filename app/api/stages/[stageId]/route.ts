import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStageSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  order: z.number().int().optional(),
  responsibleId: z.string().optional().nullable(),
  plannedStartDate: z.string().optional().nullable(),
  plannedEndDate: z.string().optional().nullable(),
  actualStartDate: z.string().optional().nullable(),
  actualEndDate: z.string().optional().nullable(),
  plannedProgress: z.number().min(0).max(100).optional(),
  actualProgress: z.number().min(0).max(100).optional(),
  status: z.enum(['NAO_INICIADA', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'ATRASADA']).optional(),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  notes: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: { stageId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR', 'RESPONSAVEL'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = updateStageSchema.parse(body)

    const existing = await prisma.stage.findFirst({
      where: { id: params.stageId, deletedAt: null },
    })
    if (!existing) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })

    const stage = await prisma.stage.update({
      where: { id: params.stageId },
      data: {
        ...data,
        plannedStartDate: data.plannedStartDate !== undefined
          ? (data.plannedStartDate ? new Date(data.plannedStartDate) : null)
          : undefined,
        plannedEndDate: data.plannedEndDate !== undefined
          ? (data.plannedEndDate ? new Date(data.plannedEndDate) : null)
          : undefined,
        actualStartDate: data.actualStartDate !== undefined
          ? (data.actualStartDate ? new Date(data.actualStartDate) : null)
          : undefined,
        actualEndDate: data.actualEndDate !== undefined
          ? (data.actualEndDate ? new Date(data.actualEndDate) : null)
          : undefined,
      },
      include: {
        responsible: { select: { id: true, name: true } },
      },
    })

    // Audit
    if (data.status && data.status !== existing.status) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id as string,
          projectId: existing.projectId,
          action: 'UPDATE',
          entity: 'Stage',
          entityId: stage.id,
          oldValue: { status: existing.status },
          newValue: { status: stage.status },
          description: `${session.user.name} alterou o status da etapa "${stage.name}" de "${existing.status}" para "${stage.status}"`,
        },
      })
    }

    return NextResponse.json(stage)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[PUT /api/stages/:stageId]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { stageId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const stage = await prisma.stage.findFirst({
      where: { id: params.stageId, deletedAt: null },
    })
    if (!stage) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })

    await prisma.stage.update({
      where: { id: params.stageId },
      data: { deletedAt: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: stage.projectId,
        action: 'DELETE',
        entity: 'Stage',
        entityId: stage.id,
        description: `${session.user.name} excluiu a etapa "${stage.name}"`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/stages/:stageId]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
