import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateExpenseSchema = z.object({
  date: z.string().optional(),
  description: z.string().min(2).optional(),
  category: z.enum(['MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'TRANSPORTE', 'SERVICOS', 'OUTROS']).optional(),
  stageId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  budgetItemId: z.string().optional().nullable(),
  quantity: z.number().nonnegative().optional().nullable(),
  unit: z.enum(['UNIDADE', 'METRO', 'METRO_QUADRADO', 'METRO_CUBICO', 'KG', 'HORA', 'DIARIA', 'PACOTE', 'OUTRO']).optional().nullable(),
  unitValue: z.number().nonnegative().optional().nullable(),
  plannedValue: z.number().nonnegative().optional().nullable(),
  realizedValue: z.number().nonnegative().optional(),
  paymentMethod: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  status: z.enum(['PENDENTE', 'PAGO', 'CANCELADO', 'ATRASADO']).optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      stage: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      supplier: { select: { id: true, companyName: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })
  if (!expense) return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })

  return NextResponse.json(expense)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const existing = await prisma.expense.findFirst({ where: { id: params.id, deletedAt: null } })
    if (!existing) return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })

    const body = await req.json()
    const data = updateExpenseSchema.parse(body)

    const quantity = data.quantity !== undefined ? data.quantity : Number(existing.quantity ?? 0) || null
    const unitValue = data.unitValue !== undefined ? data.unitValue : Number(existing.unitValue ?? 0) || null
    const realizedValue =
      quantity != null && unitValue != null ? quantity * unitValue : data.realizedValue ?? Number(existing.realizedValue)

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...data,
        date: data.date !== undefined ? new Date(data.date) : undefined,
        realizedValue,
      },
      include: {
        stage: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: expense.projectId,
        action: 'UPDATE',
        entity: 'Expense',
        entityId: expense.id,
        oldValue: { realizedValue: existing.realizedValue },
        newValue: { realizedValue: expense.realizedValue },
        description: `${session.user.name} editou a despesa "${expense.description}"`,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[PUT /api/expenses/:id]', error)
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
    const expense = await prisma.expense.findFirst({ where: { id: params.id, deletedAt: null } })
    if (!expense) return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 })

    await prisma.expense.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id as string,
        projectId: expense.projectId,
        action: 'DELETE',
        entity: 'Expense',
        entityId: expense.id,
        description: `${session.user.name} excluiu a despesa "${expense.description}"`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/expenses/:id]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
