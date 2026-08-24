import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    label?: string
    positive?: boolean
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

const variantStyles = {
  default: {
    icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    border: '',
  },
  primary: {
    icon: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/50 dark:border-blue-800/50',
  },
  success: {
    icon: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    border: 'border-green-200/50 dark:border-green-800/50',
  },
  warning: {
    icon: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/50 dark:border-amber-800/50',
  },
  danger: {
    icon: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    border: 'border-red-200/50 dark:border-red-800/50',
  },
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={cn('card-hover', styles.border, className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.positive === false ? 'text-red-500' : 'text-green-500'
                  )}
                >
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl flex-shrink-0 ml-4', styles.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
