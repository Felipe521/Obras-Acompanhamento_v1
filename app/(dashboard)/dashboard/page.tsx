import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import {
  HardHat,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react'
import { MetricCard } from '@/components/common/metric-card'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { RecentProjects } from '@/components/dashboard/recent-projects'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

async function getDashboardData(userId: string, role: string) {
  const isAdminOrGestor = ['ADMIN', 'GESTOR'].includes(role)

  const projectsWhere: any = {
    deletedAt: null,
    ...(isAdminOrGestor ? {} : { members: { some: { userId } } }),
  }

  const [
    totalProjects,
    inProgress,
    concluded,
    financialAgg,
    stagesAgg,
    recentProjects,
    overdueStages,
    pendingTasks,
  ] = await Promise.all([
    prisma.project.count({ where: { ...projectsWhere } }),
    prisma.project.count({ where: { ...projectsWhere, status: 'EM_ANDAMENTO' } }),
    prisma.project.count({ where: { ...projectsWhere, status: 'CONCLUIDA' } }),
    prisma.expense.aggregate({
      where: {
        project: projectsWhere,
        deletedAt: null,
      },
      _sum: { realizedValue: true },
    }),
    prisma.stage.groupBy({
      by: ['status'],
      where: {
        project: projectsWhere,
        deletedAt: null,
      },
      _count: { status: true },
    }),
    prisma.project.findMany({
      where: projectsWhere,
      include: {
        responsible: { select: { name: true } },
        stages: {
          where: { deletedAt: null },
          select: { actualProgress: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.stage.count({
      where: {
        project: projectsWhere,
        status: 'ATRASADA',
        deletedAt: null,
      },
    }),
    prisma.task.count({
      where: {
        project: projectsWhere,
        status: { in: ['A_FAZER', 'EM_ANDAMENTO'] },
        deletedAt: null,
      },
    }),
  ])

  const totalBudgetAgg = await prisma.project.aggregate({
    where: projectsWhere,
    _sum: { totalBudget: true },
  })

  return {
    totalProjects,
    inProgress,
    concluded,
    delayed: await prisma.project.count({
      where: {
        ...projectsWhere,
        endDate: { lt: new Date() },
        status: { in: ['EM_ANDAMENTO', 'PLANEJAMENTO'] },
      },
    }),
    totalBudget: Number(totalBudgetAgg._sum.totalBudget || 0),
    totalSpent: Number(financialAgg._sum.realizedValue || 0),
    stagesAgg,
    recentProjects: recentProjects.map((p) => ({
      ...p,
      avgProgress: p.stages.length > 0
        ? Math.round(p.stages.reduce((sum, s) => sum + Number(s.actualProgress), 0) / p.stages.length)
        : 0,
    })),
    overdueStages,
    pendingTasks,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const data = await getDashboardData(session.user.id as string, session.user.role as string)
  const balance = data.totalBudget - data.totalSpent
  const percentUsed = data.totalBudget > 0 ? (data.totalSpent / data.totalBudget) * 100 : 0

  const stagesMap = data.stagesAgg.reduce((acc, s) => {
    acc[s.status] = s._count.status
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral de todas as obras e indicadores
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de obras"
          value={data.totalProjects}
          icon={HardHat}
          variant="primary"
          subtitle={`${data.inProgress} em andamento`}
        />
        <MetricCard
          title="Obras concluídas"
          value={data.concluded}
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Obras atrasadas"
          value={data.delayed}
          icon={AlertTriangle}
          variant={data.delayed > 0 ? 'danger' : 'default'}
        />
        <MetricCard
          title="Etapas atrasadas"
          value={data.overdueStages}
          icon={Activity}
          variant={data.overdueStages > 0 ? 'warning' : 'default'}
          subtitle={`${data.pendingTasks} atividades pendentes`}
        />
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Orçamento total"
          value={formatCurrency(data.totalBudget)}
          icon={DollarSign}
          variant="primary"
        />
        <MetricCard
          title="Total gasto"
          value={formatCurrency(data.totalSpent)}
          icon={TrendingUp}
          variant={percentUsed > 90 ? 'danger' : percentUsed > 75 ? 'warning' : 'default'}
          subtitle={`${percentUsed.toFixed(1)}% do orçamento`}
        />
        <MetricCard
          title="Saldo disponível"
          value={formatCurrency(balance)}
          icon={DollarSign}
          variant={balance < 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Charts & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts stagesMap={stagesMap} />
        </div>
        <div>
          <AlertsPanel
            overdueStages={data.overdueStages}
            delayed={data.delayed}
            pendingTasks={data.pendingTasks}
            percentUsed={percentUsed}
          />
        </div>
      </div>

      {/* Recent Projects */}
      <RecentProjects projects={data.recentProjects} />
    </div>
  )
}
