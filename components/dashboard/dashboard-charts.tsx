'use client'

import {
  BarChart,
  Bar,
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

const STAGE_STATUS_LABELS: Record<string, string> = {
  NAO_INICIADA: 'Não iniciada',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  ATRASADA: 'Atrasada',
  PAUSADA: 'Pausada',
}

const STAGE_STATUS_COLORS: Record<string, string> = {
  NAO_INICIADA: '#94a3b8',
  EM_ANDAMENTO: '#3b82f6',
  CONCLUIDA: '#22c55e',
  ATRASADA: '#ef4444',
  PAUSADA: '#f59e0b',
}

interface DashboardChartsProps {
  stagesMap: Record<string, number>
}

export function DashboardCharts({ stagesMap }: DashboardChartsProps) {
  const pieData = Object.entries(stagesMap)
    .filter(([_, v]) => v > 0)
    .map(([status, count]) => ({
      name: STAGE_STATUS_LABELS[status] || status,
      value: count,
      color: STAGE_STATUS_COLORS[status] || '#94a3b8',
    }))

  const barData = Object.entries(stagesMap).map(([status, count]) => ({
    name: STAGE_STATUS_LABELS[status] || status,
    total: count,
    fill: STAGE_STATUS_COLORS[status] || '#94a3b8',
  }))

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
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="h-[200px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                          {value}
                        </span>
                      )}
                    />
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
    </div>
  )
}
