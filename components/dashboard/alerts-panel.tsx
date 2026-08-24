import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock, DollarSign, CheckSquare, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertItem {
  icon: React.ElementType
  label: string
  value: number | string
  href: string
  variant: 'danger' | 'warning' | 'info'
  show: boolean
}

interface AlertsPanelProps {
  overdueStages: number
  delayed: number
  pendingTasks: number
  percentUsed: number
}

export function AlertsPanel({ overdueStages, delayed, pendingTasks, percentUsed }: AlertsPanelProps) {
  const alerts: AlertItem[] = [
    {
      icon: AlertTriangle,
      label: 'Etapas atrasadas',
      value: overdueStages,
      href: '/etapas?status=ATRASADA',
      variant: 'danger',
      show: overdueStages > 0,
    },
    {
      icon: Clock,
      label: 'Obras atrasadas',
      value: delayed,
      href: '/obras?status=atrasada',
      variant: 'danger',
      show: delayed > 0,
    },
    {
      icon: CheckSquare,
      label: 'Atividades pendentes',
      value: pendingTasks,
      href: '/atividades?status=A_FAZER',
      variant: 'warning',
      show: pendingTasks > 0,
    },
    {
      icon: DollarSign,
      label: 'Orçamento utilizado',
      value: `${percentUsed.toFixed(1)}%`,
      href: '/custos',
      variant: percentUsed > 90 ? 'danger' : 'warning',
      show: percentUsed > 75,
    },
  ].filter((a) => a.show)

  const variantStyles = {
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Necessita atenção
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">Tudo em ordem!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const Icon = alert.icon
              return (
                <Link
                  key={i}
                  href={alert.href}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80',
                    variantStyles[alert.variant]
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{alert.label}</span>
                  <span className="font-bold tabular-nums">{alert.value}</span>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
