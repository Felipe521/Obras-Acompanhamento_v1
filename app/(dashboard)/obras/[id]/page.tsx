import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { ProjectDetailClient } from '@/components/obras/project-detail-client'
import { computeStageActualProgress, computeStageStatus } from '@/lib/progress-calc'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await prisma.project.findUnique({
    where: { id: params.id, deletedAt: null },
    select: { name: true },
  })
  return { title: project?.name || 'Obra' }
}

export default async function ObraPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const project = await prisma.project.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      responsible: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true, role: true, position: true } },
        },
      },
      stages: {
        where: { deletedAt: null },
        include: {
          responsible: { select: { id: true, name: true } },
          services: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, unit: true, order: true, plannedQty: true, executedQty: true, unitPrice: true, progress: true, status: true, plannedStartDate: true, plannedEndDate: true, notes: true },
          },
          tasks: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
            select: {
              id: true, title: true, status: true, priority: true, startDate: true, dueDate: true,
              progress: true, serviceId: true, description: true,
              assignee: { select: { id: true, name: true, image: true } },
            },
          },
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

  if (!project) notFound()

  // Check access (non-admin/gestor must be member)
  const isPrivileged = ['ADMIN', 'GESTOR'].includes(session.user.role as string)
  const isMember = project.members.some((m) => m.userId === session.user.id)
  if (!isPrivileged && !isMember) redirect('/obras')

  // Financial summary
  const [expenses, budgetItems] = await Promise.all([
    prisma.expense.aggregate({
      where: { projectId: params.id, deletedAt: null },
      _sum: { realizedValue: true },
    }),
    prisma.budgetItem.aggregate({
      where: { projectId: params.id },
      _sum: { plannedValue: true },
    }),
  ])

  const totalSpent = Number(expenses._sum.realizedValue || 0)
  const totalBudget = Number(project.totalBudget || budgetItems._sum.plannedValue || 0)

  // Progresso/status calculados a partir dos subtópicos (não persistido no GET —
  // a persistência acontece ao criar/editar/excluir um subtópico, ver lib/stage-progress.ts)
  const stages = project.stages.map((stage) => {
    const actualProgress = stage.services.length > 0
      ? computeStageActualProgress(stage.services)
      : Number(stage.actualProgress)
    const status = computeStageStatus({ status: stage.status, plannedEndDate: stage.plannedEndDate, actualProgress })
    return { ...stage, actualProgress, status: status as typeof stage.status }
  })

  const avgProgress = stages.length > 0
    ? Math.round(stages.reduce((sum, s) => sum + Number(s.actualProgress), 0) / stages.length)
    : 0

  return (
    <ProjectDetailClient
      project={{
        ...project,
        startDate: project.startDate?.toISOString() || null,
        endDate: project.endDate?.toISOString() || null,
        actualEndDate: project.actualEndDate?.toISOString() || null,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        stages: stages.map((s) => ({
          ...s,
          plannedStartDate: s.plannedStartDate?.toISOString() || null,
          plannedEndDate: s.plannedEndDate?.toISOString() || null,
          actualStartDate: s.actualStartDate?.toISOString() || null,
          actualEndDate: s.actualEndDate?.toISOString() || null,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          services: s.services.map((svc) => ({
            ...svc,
            plannedStartDate: svc.plannedStartDate?.toISOString() || null,
            plannedEndDate: svc.plannedEndDate?.toISOString() || null,
          })),
          tasks: s.tasks.map((t) => ({
            ...t,
            startDate: t.startDate?.toISOString() || null,
            dueDate: t.dueDate?.toISOString() || null,
          })),
        })),
      }}
      financialSummary={{ totalBudget, totalSpent, balance: totalBudget - totalSpent }}
      avgProgress={avgProgress}
      currentUser={{ id: session.user.id as string, role: session.user.role as string }}
    />
  )
}
