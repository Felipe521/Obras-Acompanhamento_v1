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
    const assigneeId = searchParams.get('assigneeId')

    const isPrivileged = ['ADMIN', 'GESTOR'].includes(session.user.role as string)
    const where: any = { deletedAt: null }

    if (!isPrivileged) {
      where.OR = [
        { assigneeId: session.user.id },
        { project: { members: { some: { userId: session.user.id } } } },
      ]
    }
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        stage: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, image: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 100,
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('[GET /api/tasks]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
