import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `${num.toFixed(1)}%`
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const d = typeof date === 'string' ? new Date(date) : date
  return isPast(d)
}

export function getDaysOverdue(date: Date | string | null | undefined): number {
  if (!date) return 0
  const d = typeof date === 'string' ? new Date(date) : date
  if (!isPast(d)) return 0
  return differenceInDays(new Date(), d)
}

export function getDaysRemaining(date: Date | string | null | undefined): number {
  if (!date) return 0
  const d = typeof date === 'string' ? new Date(date) : date
  if (isPast(d)) return 0
  return differenceInDays(d, new Date())
}

export function generateProjectCode(lastCode: string | null): string {
  if (!lastCode) return 'OBR-0001'
  const num = parseInt(lastCode.replace('OBR-', '')) + 1
  return `OBR-${num.toString().padStart(4, '0')}`
}

export function generateMeasurementNumber(lastNumber: number | null): number {
  return (lastNumber ?? 0) + 1
}

export function calculateProgress(executed: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((executed / total) * 100 * 10) / 10)
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
