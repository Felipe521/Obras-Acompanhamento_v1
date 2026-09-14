/**
 * Rate limiter simples em memória (sem dependência externa). Suficiente para
 * uma única instância; em produção com múltiplas instâncias serverless cada
 * uma tem seu próprio contador — para robustez real entre instâncias seria
 * necessário um store compartilhado (ex. Redis/Upstash).
 */
const attempts = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_ATTEMPTS) return false

  entry.count++
  return true
}

export function resetRateLimit(key: string) {
  attempts.delete(key)
}
