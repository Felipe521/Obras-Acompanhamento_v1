'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

const variantMap = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

function getVariantFromValue(value: number): 'default' | 'success' | 'warning' | 'danger' {
  if (value >= 100) return 'success'
  if (value >= 75) return 'default'
  if (value >= 50) return 'warning'
  return 'danger'
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = false,
  size = 'md',
  variant,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const resolvedVariant = variant || getVariantFromValue(percentage)

  return (
    <div className={cn('w-full', className)}>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showLabel && (
            <span className="text-xs font-medium tabular-nums">{percentage.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full overflow-hidden bg-muted', sizeMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', variantMap[resolvedVariant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
