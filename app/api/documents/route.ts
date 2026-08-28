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

    const documents = await prisma.document.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        responsible: { select: { id: true, name: true } },
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('[GET /api/documents]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
