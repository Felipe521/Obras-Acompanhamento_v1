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
      where.project = { members: { some: { userId: session.user.id } } }
    }
    if (projectId) where.projectId = projectId
    if (status) where.status = status

    const measurements = await prisma.measurement.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        stage: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json(measurements)
  } catch (error) {
    console.error('[GET /api/measurements]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
