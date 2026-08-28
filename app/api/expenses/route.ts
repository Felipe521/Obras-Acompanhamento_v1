import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const isPrivileged = ['ADMIN', 'GESTOR'].includes(session.user.role as string)
    const where: any = { deletedAt: null }

    if (!isPrivileged) {
      where.project = { members: { some: { userId: session.user.id } } }
    }
    if (projectId) where.projectId = projectId
    if (category) where.category = category
    if (status) where.status = status

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        stage: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true, tradeName: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

    const summary = await prisma.expense.aggregate({
      where,
      _sum: { realizedValue: true },
      _count: true,
    })

    return NextResponse.json({
      expenses,
      summary: {
        total: Number(summary._sum.realizedValue || 0),
        count: summary._count,
      },
    })
  } catch (error) {
    console.error('[GET /api/expenses]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
