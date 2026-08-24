import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  client: z.string().min(2).optional(),
  clientEmail: z.string().email().optional().or(z.literal('')).nullable(),
  clientPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'CANCELADA']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  actualEndDate: z.string().optional().nullable(),
  totalBudget: z.number().positive().optional().nullable(),
  responsibleId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// Check if user can access a project
async function canAccessProject(userId: string, projectId: string, role?: string) {
  if (role === 'ADMIN' || role === 'GESTOR') return true
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  return !!member
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const hasAccess = await canAccessProject(session.user.id as string, params.id, session.user.role as string)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        responsible: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true, role: true, position: true } },
          },
        },
        stages: {
          where: { deletedAt: null },
          include: {
            responsible: { select: { id: true, name: true } },
            _count: { select: { services: { where: { deletedAt: null } } } },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            tasks: { where: { deletedAt: null } },
            expenses: { where: { deletedAt: null } },
            documents: { where: { deletedAt: null } },
            photos: true,
            occurrences: { where: { deletedAt: null } },
            measurements: { where: { deletedAt: null } },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    // Calculate financial summary
    const [expenses, budgetItems] = await Promise.all([
      prisma.expense.aggregate({
        where: { projectId: params.id, deletedAt: null },
        _sum: { realizedValue: true, plannedValue: true },
      }),
      prisma.budgetItem.aggregate({
        where: { projectId: params.id },
        _sum: { plannedValue: true },
      }),
    ])

    const totalSpent = Number(expenses._sum.realizedValue || 0)
    const totalBudget = Number(project.totalBudget || budgetItems._sum.plannedValue || 0)
    const avgProgress = project.stages.length > 0
      ? project.stages.reduce((sum, s) => sum + Number(s.actualProgress), 0) / project.stages.length
      : 0

    return NextResponse.json({
      ...project,
      financialSummary: {
        totalBudget,
        totalSpent,
        balance: totalBudget - totalSpent,
        percentUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      },
      avgProgress: Math.round(avgProgress),
    })
  } catch (error) {
    console.error('[GET /api/projects/:id]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!['ADMIN', 'GESTOR'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = updateProjectSchema.parse(body)

    const existing = await prisma.project.findFirst({
      where: { id: params.id, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : data.startDate,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate,
        actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : data.actualEndDate,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: params.id,
        action: 'UPDATE',
        entity: 'Project',
        entityId: params.id,
        oldValue: { status: existing.status, name: existing.name },
        newValue: { status: project.status, name: project.name },
        description: `${session.user.name} atualizou a obra "${project.name}"`,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[PUT /api/projects/:id]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas administradores podem excluir obras' }, { status: 403 })
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id: params.id, deletedAt: null },
    })
    if (!project) {
      return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    }

    // Soft delete
    await prisma.project.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: params.id,
        action: 'DELETE',
        entity: 'Project',
        entityId: params.id,
        description: `${session.user.name} excluiu a obra "${project.name}"`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/projects/:id]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
