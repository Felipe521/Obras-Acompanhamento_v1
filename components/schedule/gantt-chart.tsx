'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Calendar, Layers, CheckSquare } from 'lucide-react'
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

export interface GanttService {
  id: string
  name: string
  status: string
  plannedStartDate: string | null
  plannedEndDate: string | null
  progress: number | string
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
  services?: GanttService[]
}

interface GanttChartProps {
  stages: GanttStage[]
  editable?: boolean
  groupByProject?: boolean
  onTaskClick?: (task: GanttTask, stage: GanttStage) => void
  onAddTask?: (stageId: string) => void
  onTaskReschedule?: (taskId: string, startDate: Date, dueDate: Date) => void | Promise<void>
  onServiceClick?: (service: GanttService, stage: GanttStage) => void
  onAddService?: (stageId: string) => void
  onServiceReschedule?: (serviceId: string, startDate: Date, endDate: Date) => void | Promise<void>
}

/** Barra arrastável genérica — usada tanto para atividades (Task) quanto subetapas (Service). */
function DateBar({
  start,
  end,
  status,
  label,
  progress,
  range,
  editable,
  onReschedule,
  onClick,
}: {
  start: string | null
  end: string | null
  status: string
  label: string
  progress: number | string
  range: GanttDateRange
  editable: boolean
  onReschedule?: (start: Date, end: Date) => void | Promise<void>
  onClick?: () => void
}) {
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  if (!start || !end) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="flex-1 flex items-center text-left disabled:cursor-default"
      >
        <span className="text-xs text-muted-foreground italic hover:text-foreground transition-colors">
          Sem datas definidas{onClick ? ' — clique para editar' : ''}
        </span>
      </button>
    )
  }

  const effectiveStart = dragging ? addDays(start, dragOffset) : start
  const effectiveEnd = dragging ? addDays(end, dragOffset) : end
  const { leftPct, widthPct } = computeBarPosition(effectiveStart, effectiveEnd, range)
  const color = STAGE_STATUS_HEX[status] || '#94a3b8'

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
      if (moved && deltaDays !== 0 && start && end) {
        onReschedule?.(addDays(start, deltaDays), addDays(end, deltaDays))
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
        title={`${label} (${Number(progress).toFixed(0)}%)`}
      >
        <span className="text-[10px] text-white font-medium truncate drop-shadow">{label}</span>
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
  onServiceClick,
  onAddService,
  onServiceReschedule,
}: GanttChartProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const range = useMemo(() => {
    const items = stages.flatMap((s) => [
      { start: s.plannedStartDate, end: s.plannedEndDate },
      ...s.tasks.map((t) => ({ start: t.startDate, end: t.dueDate })),
      ...(s.services || []).map((sv) => ({ start: sv.plannedStartDate, end: sv.plannedEndDate })),
    ])
    return computeDateRange(items)
  }, [stages])

  if (!range || stages.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sem dados no cronograma"
        description="Adicione datas nas etapas, subetapas ou atividades para visualizar o Gantt."
      />
    )
  }

  const months = computeMonthLabels(range)
  const now = Date.now()
  const todayPct = now >= range.minDate.getTime() && now <= range.maxDate.getTime()
    ? ((now - range.minDate.getTime()) / (1000 * 60 * 60 * 24) / range.totalDays) * 100
    : null

  // Cada mês precisa de espaço mínimo em pixels para o rótulo não sobrepor o
  // vizinho — com muitos meses no intervalo, a área rolável cresce em vez de
  // espremer tudo num container de largura fixa (era a causa da sobreposição).
  const timelineWidthPx = Math.max(760, 208 + months.length * 100)

  return (
    <div style={{ minWidth: `${timelineWidthPx}px` }}>
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
          const services = stage.services || []

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
                {editable && onAddService && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => onAddService(stage.id)}
                    title="Nova subetapa nesta etapa"
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </Button>
                )}
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

              {/* Subetapa (Service) rows */}
              {!isCollapsed &&
                services.map((svc) => (
                  <div key={`svc-${svc.id}`} className="flex items-center gap-2 h-8 pl-4">
                    <div className="w-48 flex-shrink-0 pr-2 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs truncate">{svc.name}</p>
                    </div>
                    <DateBar
                      start={svc.plannedStartDate}
                      end={svc.plannedEndDate}
                      status={svc.status}
                      label={svc.name}
                      progress={svc.progress}
                      range={range}
                      editable={editable}
                      onReschedule={(start, end) => onServiceReschedule?.(svc.id, start, end)}
                      onClick={() => onServiceClick?.(svc, stage)}
                    />
                  </div>
                ))}

              {/* Task rows */}
              {!isCollapsed &&
                stage.tasks.map((task) => (
                  <div key={`task-${task.id}`} className="flex items-center gap-2 h-8 pl-4">
                    <div className="w-48 flex-shrink-0 pr-2 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs truncate">{task.title}</p>
                        {task.assignee && <p className="text-[10px] text-muted-foreground truncate">{task.assignee.name}</p>}
                      </div>
                    </div>
                    <DateBar
                      start={task.startDate}
                      end={task.dueDate}
                      status={task.status}
                      label={task.title}
                      progress={task.progress}
                      range={range}
                      editable={editable}
                      onReschedule={(start, end) => onTaskReschedule?.(task.id, start, end)}
                      onClick={() => onTaskClick?.(task, stage)}
                    />
                  </div>
                ))}

              {!isCollapsed && services.length === 0 && stage.tasks.length === 0 && (
                <div className="flex items-center h-6 pl-4">
                  <span className="text-[11px] text-muted-foreground pl-2">Nenhuma subetapa ou atividade nesta etapa</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
