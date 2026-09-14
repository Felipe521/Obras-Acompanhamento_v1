'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { STAGE_STATUS_HEX, EXPENSE_CATEGORY_HEX, EXPENSE_CATEGORY_MAP } from '@/lib/constants'

const STAGE_STATUS_LABELS: Record<string, string> = {
  NAO_INICIADA: 'Não iniciada',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  ATRASADA: 'Atrasada',
  PAUSADA: 'Pausada',
}

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
}

interface DashboardChartsProps {
  stagesMap: Record<string, number>
  expensesByCategory?: { category: string; total: number }[]
  expensesByStage?: { stageId: string; stageName: string; total: number }[]
  topExpenses?: { id: string; description: string; realizedValue: number; date: string; project: { code: string } }[]
  monthlyTrend?: { key: string; label: string; total: number }[]
}

export function DashboardCharts({ stagesMap, expensesByCategory = [], expensesByStage = [], topExpenses = [], monthlyTrend = [] }: DashboardChartsProps) {
  const pieData = Object.entries(stagesMap)
    .filter(([_, v]) => v > 0)
    .map(([status, count]) => ({
      name: STAGE_STATUS_LABELS[status] || status,
      value: count,
      color: STAGE_STATUS_HEX[status] || '#94a3b8',
    }))

  const barData = Object.entries(stagesMap).map(([status, count]) => ({
    name: STAGE_STATUS_LABELS[status] || status,
    total: count,
    fill: STAGE_STATUS_HEX[status] || '#94a3b8',
  }))

  const categoryData = expensesByCategory
    .filter((e) => e.total > 0)
    .map((e) => ({
      name: EXPENSE_CATEGORY_MAP[e.category as keyof typeof EXPENSE_CATEGORY_MAP]?.label || e.category,
      value: e.total,
      color: EXPENSE_CATEGORY_HEX[e.category as keyof typeof EXPENSE_CATEGORY_HEX] || '#94a3b8',
    }))

  const stageData = [...expensesByStage].sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Etapas por status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bar Chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="h-[200px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend iconSize={8} formatter={(value) => (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                    )} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Nenhuma etapa cadastrada
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Custos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                      {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => formatCurrency(v)} />
                    <Legend iconSize={8} formatter={(value) => (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{value}</span>
                    )} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Nenhum custo registrado</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução dos gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => formatCurrency(v)} />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados suficientes</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Custos por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {stageData.length > 0 ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="stageName" width={90} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => formatCurrency(v)} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Nenhum custo vinculado a etapas</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Maiores despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {topExpenses.length > 0 ? (
              <div className="space-y-2">
                {topExpenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{e.project.code}</p>
                    </div>
                    <span className="font-semibold tabular-nums flex-shrink-0">{formatCurrency(e.realizedValue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">Nenhuma despesa registrada</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
