import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const expenseSchema = z.object({
  date: z.string(),
  description: z.string().min(2),
  category: z.enum(['MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'TRANSPORTE', 'SERVICOS', 'OUTROS']),
  stageId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  budgetItemId: z.string().optional().nullable(),
  plannedValue: z.number().nonnegative().optional().nullable(),
  realizedValue: z.number().nonnegative(),
  paymentMethod: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO']).default('PENDENTE'),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const stageId = searchParams.get('stageId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      projectId: params.id,
      deletedAt: null,
    }

    if (category) where.category = category
    if (status) where.status = status
    if (stageId) where.stageId = stageId

    const [expenses, total, aggregate] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          stage: { select: { id: true, name: true } },
          supplier: { select: { id: true, companyName: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({
        where: { projectId: params.id, deletedAt: null },
        _sum: { realizedValue: true, plannedValue: true },
      }),
    ])

    // Summary by category
    const byCategoryRaw = await prisma.expense.groupBy({
      by: ['category'],
      where: { projectId: params.id, deletedAt: null },
      _sum: { realizedValue: true },
    })

    return NextResponse.json({
      data: expenses,
      meta: { total, page, limit },
      summary: {
        totalSpent: Number(aggregate._sum.realizedValue || 0),
        totalPlanned: Number(aggregate._sum.plannedValue || 0),
        byCategory: byCategoryRaw,
      },
    })
  } catch (error) {
    console.error('[GET /api/projects/:id/expenses]', error)
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
    const data = expenseSchema.parse(body)

    const expense = await prisma.expense.create({
      data: {
        projectId: params.id,
        stageId: data.stageId || null,
        supplierId: data.supplierId || null,
        budgetItemId: data.budgetItemId || null,
        createdById: session.user.id as string,
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        plannedValue: data.plannedValue || null,
        realizedValue: data.realizedValue,
        paymentMethod: data.paymentMethod || null,
        invoiceNumber: data.invoiceNumber || null,
        status: data.status,
        notes: data.notes || null,
      },
      include: {
        stage: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: params.id,
        action: 'CREATE',
        entity: 'Expense',
        entityId: expense.id,
        newValue: { description: expense.description, value: expense.realizedValue },
        description: `${session.user.name} registrou despesa "${expense.description}" (R$ ${expense.realizedValue})`,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[POST /api/projects/:id/expenses]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
