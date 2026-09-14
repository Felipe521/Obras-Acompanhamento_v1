import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recalculateAndPersistStageProgress } from '@/lib/stage-progress'
import { z } from 'zod'

const updateServiceSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    unit: z
      .enum(['UNIDADE', 'METRO', 'METRO_QUADRADO', 'METRO_CUBICO', 'KG', 'HORA', 'DIARIA', 'PACOTE', 'OUTRO'])
      .optional(),
    order: z.number().int().optional(),
    plannedQty: z.number().nonnegative().optional(),
    executedQty: z.number().nonnegative().optional(),
    unitPrice: z.number().nonnegative().optional(),
    progress: z.number().min(0).max(100).optional(),
    status: z.enum(['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional(),
    plannedStartDate: z.string().optional().nullable(),
    plannedEndDate: z.string().optional().nullable(),
    actualEndDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => !data.plannedStartDate || !data.plannedEndDate || new Date(data.plannedStartDate) <= new Date(data.plannedEndDate),
    { message: 'A data final não pode ser anterior à data inicial', path: ['plannedEndDate'] }
  )

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const service = await prisma.service.findFirst({ where: { id: params.id, deletedAt: null } })
  if (!service) return NextResponse.json({ error: 'Subtópico não encontrado' }, { status: 404 })

  return NextResponse.json(service)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR', 'RESPONSAVEL'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const existing = await prisma.service.findFirst({ where: { id: params.id, deletedAt: null } })
    if (!existing) return NextResponse.json({ error: 'Subtópico não encontrado' }, { status: 404 })

    const body = await req.json()
    const data = updateServiceSchema.parse(body)

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...data,
        plannedStartDate:
          data.plannedStartDate !== undefined ? (data.plannedStartDate ? new Date(data.plannedStartDate) : null) : undefined,
        plannedEndDate:
          data.plannedEndDate !== undefined ? (data.plannedEndDate ? new Date(data.plannedEndDate) : null) : undefined,
        actualEndDate:
          data.actualEndDate !== undefined ? (data.actualEndDate ? new Date(data.actualEndDate) : null) : undefined,
      },
    })

    await recalculateAndPersistStageProgress(service.stageId)

    return NextResponse.json(service)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[PUT /api/services/:id]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const service = await prisma.service.findFirst({ where: { id: params.id, deletedAt: null } })
    if (!service) return NextResponse.json({ error: 'Subtópico não encontrado' }, { status: 404 })

    await prisma.service.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    await recalculateAndPersistStageProgress(service.stageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/services/:id]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
