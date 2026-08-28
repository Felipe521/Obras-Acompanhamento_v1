import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const isPrivileged = ['ADMIN', 'GESTOR'].includes(session.user.role as string)
    const where: any = { deletedAt: null }

    if (!isPrivileged) {
      where.project = { deletedAt: null, members: { some: { userId: session.user.id } } }
    } else {
      where.project = { deletedAt: null }
    }
    if (projectId) where.projectId = projectId
    if (status) where.status = status

    const stages = await prisma.stage.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true, status: true } },
        responsible: { select: { id: true, name: true } },
        _count: { select: { services: { where: { deletedAt: null } }, tasks: { where: { deletedAt: null } } } },
      },
      orderBy: [{ project: { name: 'asc' } }, { order: 'asc' }],
      take: 200,
    })

    return NextResponse.json(stages)
  } catch (error) {
    console.error('[GET /api/stages]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
