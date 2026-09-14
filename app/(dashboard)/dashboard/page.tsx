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
  const expenseWhere = { project: projectsWhere, deletedAt: null }

  const [
    totalProjects,
    inProgress,
    concluded,
    financialAgg,
    stagesAgg,
    recentProjects,
    overdueStages,
    pendingTasks,
    expensesByCategory,
    expensesByStageRaw,
    topExpenses,
    expensesForTrend,
  ] = await Promise.all([
    prisma.project.count({ where: { ...projectsWhere } }),
    prisma.project.count({ where: { ...projectsWhere, status: 'EM_ANDAMENTO' } }),
    prisma.project.count({ where: { ...projectsWhere, status: 'CONCLUIDA' } }),
    prisma.expense.aggregate({ where: expenseWhere, _sum: { realizedValue: true } }),
    prisma.stage.groupBy({
      by: ['status'],
      where: { project: projectsWhere, deletedAt: null },
      _count: { status: true },
    }),
    prisma.project.findMany({
      where: projectsWhere,
      include: {
        responsible: { select: { name: true } },
        stages: { where: { deletedAt: null }, select: { actualProgress: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.stage.count({ where: { project: projectsWhere, status: 'ATRASADA', deletedAt: null } }),
    prisma.task.count({
      where: { project: projectsWhere, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] }, deletedAt: null },
    }),
    prisma.expense.groupBy({ by: ['category'], where: expenseWhere, _sum: { realizedValue: true } }),
    prisma.expense.groupBy({
      by: ['stageId'],
      where: { ...expenseWhere, stageId: { not: null } },
      _sum: { realizedValue: true },
      orderBy: { _sum: { realizedValue: 'desc' } },
      take: 6,
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      select: { id: true, description: true, realizedValue: true, date: true, project: { select: { code: true } } },
      orderBy: { realizedValue: 'desc' },
      take: 5,
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      select: { date: true, realizedValue: true },
      orderBy: { date: 'asc' },
    }),
  ])

  const totalBudgetAgg = await prisma.project.aggregate({
    where: projectsWhere,
    _sum: { totalBudget: true },
  })

  const stageIds = expensesByStageRaw.map((e) => e.stageId).filter(Boolean) as string[]
  const stageNames = stageIds.length
    ? await prisma.stage.findMany({ where: { id: { in: stageIds } }, select: { id: true, name: true } })
    : []
  const stageNameMap = Object.fromEntries(stageNames.map((s) => [s.id, s.name]))
  const expensesByStage = expensesByStageRaw.map((e) => ({
    stageId: e.stageId as string,
    stageName: stageNameMap[e.stageId as string] || 'Sem etapa',
    total: Number(e._sum.realizedValue || 0),
  }))

  // Evolução mensal (agrupado em JS para evitar SQL raw)
  const monthlyMap = new Map<string, number>()
  for (const e of expensesForTrend) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(e.realizedValue))
  }
  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, total]) => {
      const [year, month] = key.split('-')
      const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      return { key, label, total }
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
    expensesByCategory: expensesByCategory.map((e) => ({ category: e.category, total: Number(e._sum.realizedValue || 0) })),
    expensesByStage,
    topExpenses: topExpenses.map((e) => ({ ...e, realizedValue: Number(e.realizedValue), date: e.date.toISOString() })),
    monthlyTrend,
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

      {percentUsed > 100 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Orçamento estourado: gastos já superam o orçamento total em {(percentUsed - 100).toFixed(1)}%.</span>
        </div>
      )}

      {/* Charts & Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCharts
            stagesMap={stagesMap}
            expensesByCategory={data.expensesByCategory}
            expensesByStage={data.expensesByStage}
            topExpenses={data.topExpenses}
            monthlyTrend={data.monthlyTrend}
          />
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

      <RecentProjects projects={data.recentProjects} />
    </div>
  )
}
