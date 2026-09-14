import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTaskSchema = z
  .object({
    title: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    stageId: z.string().optional().nullable(),
    serviceId: z.string().optional().nullable(),
    priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
    status: z.enum(['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    progress: z.number().min(0).max(100).optional(),
    order: z.number().int().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => !data.startDate || !data.dueDate || new Date(data.startDate) <= new Date(data.dueDate),
    { message: 'A data final não pode ser anterior à data inicial', path: ['dueDate'] }
  )

async function canWrite(session: any, task: { projectId: string; assigneeId: string | null }) {
  if (['ADMIN', 'GESTOR'].includes(session.user.role as string)) return true
  if (task.assigneeId === session.user.id) return true
  const isMember = await prisma.projectMember.findFirst({
    where: { projectId: task.projectId, userId: session.user.id as string },
  })
  return !!isMember
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const task = await prisma.task.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      creator: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true, color: true } },
      service: { select: { id: true, name: true } },
    },
  })
  if (!task) return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })

  return NextResponse.json(task)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const existing = await prisma.task.findFirst({ where: { id: params.id, deletedAt: null } })
    if (!existing) return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })

    if (!(await canWrite(session, existing))) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateTaskSchema.parse(body)

    const startDate = data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined
    const dueDate = data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined
    const effectiveStart = startDate !== undefined ? startDate : existing.startDate
    const effectiveDue = dueDate !== undefined ? dueDate : existing.dueDate
    if (effectiveStart && effectiveDue && effectiveStart > effectiveDue) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: [{ path: ['dueDate'], message: 'A data final não pode ser anterior à data inicial' }] },
        { status: 400 }
      )
    }

    const willComplete = data.status === 'CONCLUIDA' && existing.status !== 'CONCLUIDA'

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...data,
        startDate,
        dueDate,
        progress: willComplete ? 100 : data.progress,
        completedAt: willComplete ? new Date() : data.status && data.status !== 'CONCLUIDA' ? null : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        creator: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true, color: true } },
        service: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[PUT /api/tasks/:id]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const existing = await prisma.task.findFirst({ where: { id: params.id, deletedAt: null } })
    if (!existing) return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })

    if (!(await canWrite(session, existing))) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    await prisma.task.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/tasks/:id]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
