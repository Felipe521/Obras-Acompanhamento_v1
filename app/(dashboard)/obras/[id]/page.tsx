import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { ProjectDetailClient } from '@/components/obras/project-detail-client'
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
            select: { id: true, name: true, unit: true, plannedQty: true, executedQty: true, unitPrice: true, status: true },
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

  // Calculate avg progress
  const stages = project.stages
  const avgProgress = stages.length > 0
    ? Math.round(stages.reduce((sum, s) => sum + Number(s.actualProgress), 0) / stages.length)
    : 0

  // Auto-update delayed stages
  const now = new Date()
  for (const stage of stages) {
    if (
      stage.plannedEndDate &&
      new Date(stage.plannedEndDate) < now &&
      stage.status !== 'CONCLUIDA' &&
      stage.status !== 'ATRASADA'
    ) {
      await prisma.stage.update({
        where: { id: stage.id },
        data: { status: 'ATRASADA' },
      })
      stage.status = 'ATRASADA'
    }
  }

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
        })),
      }}
      financialSummary={{ totalBudget, totalSpent, balance: totalBudget - totalSpent }}
      avgProgress={avgProgress}
      currentUser={{ id: session.user.id as string, role: session.user.role as string }}
    />
  )
}
