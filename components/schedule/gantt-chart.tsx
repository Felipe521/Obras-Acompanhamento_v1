'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { STAGE_STATUS_HEX } from '@/lib/constants'
import { computeDateRange, computeBarPosition, computeMonthLabels, pixelsToDays, addDays, type GanttDateRange } from '@/lib/gantt-utils'

export interface GanttTask {
  id: string
  title: string
  status: string
  startDate: string | null
  dueDate: string | null
  progress: number | string
  serviceId?: string | null
  assignee?: { id: string; name: string } | null
}

export interface GanttStage {
  id: string
  name: string
  status: string
  color?: string | null
  plannedStartDate: string | null
  plannedEndDate: string | null
  actualProgress: number | string
  project?: { id: string; name: string; code: string } | null
  tasks: GanttTask[]
}

interface GanttChartProps {
  stages: GanttStage[]
  editable?: boolean
  groupByProject?: boolean
  onTaskClick?: (task: GanttTask, stage: GanttStage) => void
  onAddTask?: (stageId: string) => void
  onTaskReschedule?: (taskId: string, startDate: Date, dueDate: Date) => void | Promise<void>
}

function TaskBar({
  task,
  range,
  editable,
  onReschedule,
  onClick,
}: {
  task: GanttTask
  range: GanttDateRange
  editable: boolean
  onReschedule?: (id: string, start: Date, end: Date) => void | Promise<void>
  onClick?: () => void
}) {
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  if (!task.startDate || !task.dueDate) {
    return (
      <div className="flex-1 flex items-center">
        <span className="text-xs text-muted-foreground italic">Sem datas definidas</span>
      </div>
    )
  }

  const effectiveStart = dragging ? addDays(task.startDate, dragOffset) : task.startDate
  const effectiveEnd = dragging ? addDays(task.dueDate, dragOffset) : task.dueDate
  const { leftPct, widthPct } = computeBarPosition(effectiveStart, effectiveEnd, range)
  const color = STAGE_STATUS_HEX[task.status] || '#94a3b8'

  function handleMouseDown(e: React.MouseEvent) {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
    const track = trackRef.current
    if (!track) return
    const trackWidth = track.getBoundingClientRect().width
    const startX = e.clientX
    let moved = false
    setDragging(true)

    function handleMouseMove(ev: MouseEvent) {
      const deltaPx = ev.clientX - startX
      const deltaDays = pixelsToDays(deltaPx, trackWidth, range.totalDays)
      if (deltaDays !== 0) moved = true
      setDragOffset(deltaDays)
    }

    function handleMouseUp(ev: MouseEvent) {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      const deltaPx = ev.clientX - startX
      const deltaDays = pixelsToDays(deltaPx, trackWidth, range.totalDays)
      setDragging(false)
      setDragOffset(0)
      if (moved && deltaDays !== 0 && task.startDate && task.dueDate) {
        onReschedule?.(task.id, addDays(task.startDate, deltaDays), addDays(task.dueDate, deltaDays))
      } else if (!moved) {
        onClick?.()
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div ref={trackRef} className="flex-1 relative h-6 bg-muted/40 rounded">
      <div
        className="absolute top-0 bottom-0 rounded flex items-center px-1.5 overflow-hidden select-none"
        style={{
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          backgroundColor: color,
          cursor: editable ? (dragging ? 'grabbing' : 'grab') : 'pointer',
        }}
        onMouseDown={handleMouseDown}
        title={`${task.title} (${Number(task.progress).toFixed(0)}%)`}
      >
        <span className="text-[10px] text-white font-medium truncate drop-shadow">{task.title}</span>
      </div>
    </div>
  )
}

export function GanttChart({
  stages,
  editable = false,
  groupByProject = false,
  onTaskClick,
  onAddTask,
  onTaskReschedule,
}: GanttChartProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const range = useMemo(() => {
    const items = stages.flatMap((s) => [
      { start: s.plannedStartDate, end: s.plannedEndDate },
      ...s.tasks.map((t) => ({ start: t.startDate, end: t.dueDate })),
    ])
    return computeDateRange(items)
  }, [stages])

  if (!range || stages.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sem dados no cronograma"
        description="Adicione datas nas etapas ou atividades para visualizar o Gantt."
      />
    )
  }

  const months = computeMonthLabels(range)
  const now = Date.now()
  const todayPct = now >= range.minDate.getTime() && now <= range.maxDate.getTime()
    ? ((now - range.minDate.getTime()) / (1000 * 60 * 60 * 24) / range.totalDays) * 100
    : null

  return (
    <div className="min-w-[760px]">
      {/* Month headers */}
      <div className="flex items-center h-7 mb-2 relative ml-52">
        {months.map((m, i) => (
          <div key={i} className="absolute text-xs text-muted-foreground font-medium" style={{ left: `${m.leftPct}%` }}>
            {m.label}
          </div>
        ))}
      </div>

      <div className="space-y-1 relative">
        {todayPct !== null && (
          <div className="absolute top-0 bottom-0 pointer-events-none z-10" style={{ left: '13rem', right: 0 }}>
            <div className="absolute top-0 bottom-0 w-px bg-red-500/60" style={{ left: `${todayPct}%` }}>
              <div className="absolute -top-4 -left-3 text-[9px] text-red-500 font-medium whitespace-nowrap">Hoje</div>
            </div>
          </div>
        )}
        {stages.map((stage) => {
          const isCollapsed = collapsed.has(stage.id)
          const stageColor = STAGE_STATUS_HEX[stage.status] || '#94a3b8'
          const stagePos = stage.plannedStartDate && stage.plannedEndDate
            ? computeBarPosition(stage.plannedStartDate, stage.plannedEndDate, range)
            : null

          return (
            <div key={stage.id}>
              {/* Stage group row */}
              <div className="flex items-center gap-2 h-9">
                <button
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev)
                      next.has(stage.id) ? next.delete(stage.id) : next.add(stage.id)
                      return next
                    })
                  }
                  className="w-52 flex-shrink-0 flex items-center gap-1.5 pr-2 text-left"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className="text-xs font-semibold truncate block">{stage.name}</span>
                    {groupByProject && stage.project && (
                      <span className="text-[10px] text-muted-foreground truncate block">{stage.project.code}</span>
                    )}
                  </span>
                </button>
                <div className="flex-1 relative h-3">
                  {stagePos && (
                    <div
                      className="absolute top-0 bottom-0 rounded-sm opacity-40"
                      style={{ left: `${stagePos.leftPct}%`, width: `${stagePos.widthPct}%`, backgroundColor: stageColor }}
                    />
                  )}
                </div>
                {editable && onAddTask && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => onAddTask(stage.id)}
                    title="Nova atividade nesta etapa"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Task rows */}
              {!isCollapsed &&
                stage.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 h-8 pl-4">
                    <div className="w-48 flex-shrink-0 pr-2">
                      <p className="text-xs truncate">{task.title}</p>
                      {task.assignee && <p className="text-[10px] text-muted-foreground truncate">{task.assignee.name}</p>}
                    </div>
                    <TaskBar
                      task={task}
                      range={range}
                      editable={editable}
                      onReschedule={onTaskReschedule}
                      onClick={() => onTaskClick?.(task, stage)}
                    />
                  </div>
                ))}

              {!isCollapsed && stage.tasks.length === 0 && (
                <div className="flex items-center h-6 pl-4">
                  <span className="text-[11px] text-muted-foreground pl-2">Nenhuma atividade nesta etapa</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
