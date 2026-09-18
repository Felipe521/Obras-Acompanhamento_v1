import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const taskSchema = z
  .object({
    title: z.string().min(2),
    description: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    stageId: z.string().optional().nullable(),
    serviceId: z.string().optional().nullable(),
    priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).default('MEDIA'),
    status: z.enum(['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).default('A_FAZER'),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    progress: z.number().min(0).max(100).default(0),
    order: z.number().int().default(0),
    tags: z.array(z.string()).default([]),
  })
  .refine(
    (data) => !data.startDate || !data.dueDate || new Date(data.startDate) <= new Date(data.dueDate),
    { message: 'A data final não pode ser anterior à data inicial', path: ['dueDate'] }
  )

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')
    const stageId = searchParams.get('stageId')

    const where: any = { projectId: params.id, deletedAt: null }
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    if (stageId) where.stageId = stageId

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        creator: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true, color: true } },
        service: { select: { id: true, name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ status: 'asc' }, { order: 'asc' }, { id: 'asc' }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('[GET /api/projects/:id/tasks]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isPrivileged = ['ADMIN', 'GESTOR'].includes(session.user.role as string)
  if (!isPrivileged) {
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId: params.id, userId: session.user.id as string },
    })
    if (!isMember) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }
  }

  try {
    const body = await req.json()
    const data = taskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        projectId: params.id,
        stageId: data.stageId || null,
        serviceId: data.serviceId || null,
        title: data.title,
        description: data.description || null,
        assigneeId: data.assigneeId || null,
        creatorId: session.user.id as string,
        priority: data.priority,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        progress: data.progress,
        order: data.order,
        tags: data.tags,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        creator: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true, color: true } },
        service: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[POST /api/projects/:id/tasks]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
