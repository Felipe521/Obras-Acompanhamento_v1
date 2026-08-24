import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateProjectCode } from '@/lib/utils'
import { UserRole } from '@prisma/client'

const createProjectSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  client: z.string().min(2, 'Cliente deve ter pelo menos 2 caracteres'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['PLANEJAMENTO', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'CANCELADA']).default('PLANEJAMENTO'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  totalBudget: z.number().positive().optional().nullable(),
  responsibleId: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      deletedAt: null,
    }

    // Non-admins only see projects they're members of
    if (session.user.role !== 'ADMIN' && session.user.role !== 'GESTOR') {
      where.members = {
        some: { userId: session.user.id },
      }
    }

    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { client: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          responsible: { select: { id: true, name: true, image: true } },
          _count: {
            select: {
              stages: { where: { deletedAt: null } },
              tasks: { where: { deletedAt: null } },
              members: true,
            },
          },
          stages: {
            where: { deletedAt: null },
            select: { actualProgress: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    // Calculate average progress per project
    const projectsWithProgress = projects.map((p) => {
      const stages = p.stages
      const avgProgress = stages.length > 0
        ? stages.reduce((sum, s) => sum + Number(s.actualProgress), 0) / stages.length
        : 0
      return { ...p, avgProgress: Math.round(avgProgress) }
    })

    return NextResponse.json({
      data: projectsWithProgress,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[GET /api/projects]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (!['ADMIN', 'GESTOR'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createProjectSchema.parse(body)

    // Generate code
    const lastProject = await prisma.project.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { code: true },
    })
    const code = generateProjectCode(lastProject?.code || null)

    const project = await prisma.project.create({
      data: {
        code,
        name: data.name,
        client: data.client,
        clientEmail: data.clientEmail || null,
        clientPhone: data.clientPhone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zipCode: data.zipCode || null,
        description: data.description || null,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        totalBudget: data.totalBudget || null,
        responsibleId: data.responsibleId || null,
        notes: data.notes || null,
        // Auto add creator as member
        members: {
          create: {
            userId: session.user.id as string,
            role: 'RESPONSAVEL',
          },
        },
      },
      include: {
        responsible: { select: { id: true, name: true, image: true } },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: project.id,
        action: 'CREATE',
        entity: 'Project',
        entityId: project.id,
        newValue: { name: project.name, code: project.code },
        description: `${session.user.name} criou a obra "${project.name}"`,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[POST /api/projects]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
