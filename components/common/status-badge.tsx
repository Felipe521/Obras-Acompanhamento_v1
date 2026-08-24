'use client'

import { cn } from '@/lib/utils'
import { PROJECT_STATUS_MAP, STAGE_STATUS_MAP, TASK_STATUS_MAP, TASK_PRIORITY_MAP, MEASUREMENT_STATUS_MAP, EXPENSE_STATUS_MAP, OCCURRENCE_STATUS_MAP, OCCURRENCE_PRIORITY_MAP } from '@/lib/constants'
import type { ProjectStatus, StageStatus, TaskStatus, TaskPriority, MeasurementStatus, ExpenseStatus, OccurrenceStatus, OccurrencePriority } from '@prisma/client'

interface StatusBadgeProps {
  status: ProjectStatus | StageStatus | TaskStatus | TaskPriority | MeasurementStatus | ExpenseStatus | OccurrenceStatus | OccurrencePriority
  type: 'project' | 'stage' | 'task' | 'priority' | 'measurement' | 'expense' | 'occurrence' | 'occurrencePriority'
  className?: string
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let label = status
  let colorClass = 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'

  const getMap = () => {
    switch (type) {
      case 'project': return PROJECT_STATUS_MAP[status as ProjectStatus]
      case 'stage': return STAGE_STATUS_MAP[status as StageStatus]
      case 'task': return TASK_STATUS_MAP[status as TaskStatus]
      case 'priority': return TASK_PRIORITY_MAP[status as TaskPriority]
      case 'measurement': return MEASUREMENT_STATUS_MAP[status as MeasurementStatus]
      case 'expense': return EXPENSE_STATUS_MAP[status as ExpenseStatus]
      case 'occurrence': return OCCURRENCE_STATUS_MAP[status as OccurrenceStatus]
      case 'occurrencePriority': return OCCURRENCE_PRIORITY_MAP[status as OccurrencePriority]
    }
  }

  const map = getMap()
  if (map) {
    label = map.label
    colorClass = `${map.color} ${map.bg} dark:bg-opacity-20`
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
