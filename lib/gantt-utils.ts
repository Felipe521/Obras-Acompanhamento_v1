const DAY_MS = 1000 * 60 * 60 * 24

export interface GanttDateRange {
  minDate: Date
  maxDate: Date
  totalDays: number
}

/**
 * Calcula a janela de datas (min/max) a partir de uma lista de itens com
 * datas de início/fim. Itens sem as duas datas são ignorados.
 */
export function computeDateRange(
  items: { start: string | Date | null; end: string | Date | null }[]
): GanttDateRange | null {
  const withDates = items.filter((i) => i.start && i.end)
  if (withDates.length === 0) return null

  const starts = withDates.map((i) => new Date(i.start as string | Date).getTime())
  const ends = withDates.map((i) => new Date(i.end as string | Date).getTime())

  const minDate = new Date(Math.min(...starts))
  const maxDate = new Date(Math.max(...ends))
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / DAY_MS))

  return { minDate, maxDate, totalDays }
}

/** Posição (left%) e largura (width%) de uma barra dentro da janela de datas. */
export function computeBarPosition(
  start: string | Date,
  end: string | Date,
  range: GanttDateRange
): { leftPct: number; widthPct: number } {
  const startDays = Math.ceil((new Date(start).getTime() - range.minDate.getTime()) / DAY_MS)
  const duration = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS))

  return {
    leftPct: (startDays / range.totalDays) * 100,
    widthPct: Math.max(2, (duration / range.totalDays) * 100),
  }
}

/** Converte um deslocamento em pixels para dias, dado o total de dias e a largura em pixels da faixa. */
export function pixelsToDays(deltaPx: number, trackWidthPx: number, totalDays: number): number {
  if (trackWidthPx === 0) return 0
  const pxPerDay = trackWidthPx / totalDays
  return Math.round(deltaPx / pxPerDay)
}

export function addDays(date: string | Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function computeMonthLabels(range: GanttDateRange): { label: string; leftPct: number }[] {
  const months: { label: string; leftPct: number }[] = []
  const current = new Date(range.minDate)
  current.setDate(1)

  while (current <= range.maxDate) {
    const startOfMonth = new Date(Math.max(current.getTime(), range.minDate.getTime()))
    const left = Math.ceil((startOfMonth.getTime() - range.minDate.getTime()) / DAY_MS)
    months.push({
      label: current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      leftPct: (left / range.totalDays) * 100,
    })
    current.setMonth(current.getMonth() + 1)
    current.setDate(1)
  }

  return months
}
