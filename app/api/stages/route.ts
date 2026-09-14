import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeStageActualProgress, computeStageStatus } from '@/lib/stage-progress'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const includeTasks = searchParams.get('includeTasks') === 'true'

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
        services: includeTasks
          ? {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
              select: { id: true, name: true, status: true, plannedQty: true, executedQty: true, unitPrice: true, progress: true },
            }
          : false,
        tasks: includeTasks
          ? {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
              select: {
                id: true, title: true, status: true, priority: true, startDate: true, dueDate: true,
                progress: true, serviceId: true, assignee: { select: { id: true, name: true, image: true } },
              },
            }
          : false,
        _count: { select: { services: { where: { deletedAt: null } }, tasks: { where: { deletedAt: null } } } },
      },
      orderBy: [{ project: { name: 'asc' } }, { order: 'asc' }],
      take: 200,
    })

    if (!includeTasks) return NextResponse.json(stages)

    const stagesWithCalc = stages.map((stage: any) => {
      const actualProgress = stage.services.length > 0 ? computeStageActualProgress(stage.services) : Number(stage.actualProgress)
      const calcStatus = computeStageStatus({ status: stage.status, plannedEndDate: stage.plannedEndDate, actualProgress })
      return { ...stage, actualProgress, status: calcStatus }
    })

    return NextResponse.json(stagesWithCalc)
  } catch (error) {
    console.error('[GET /api/stages]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
