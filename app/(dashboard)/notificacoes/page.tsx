'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'

const TYPE_ICONS: Record<string, string> = {
  ETAPA_ATRASADA: '⚠️', DOCUMENTO_VENCENDO: '📄', ORCAMENTO_EXCEDIDO: '💰',
  ATIVIDADE_PENDENTE: '📋', MEDICAO_PENDENTE: '📐', NOVA_ATIVIDADE: '✅',
  OCORRENCIA_CRITICA: '🚨', GERAL: '🔔',
}

interface Notification {
  id: string; title: string; message: string; type: string; read: boolean
  url: string | null; createdAt: string
  project: { id: string; name: string; code: string } | null
}

export default function NotificacoesPage() {
  const [data, setData] = useState<{ notifications: Notification[]; unreadCount: number }>({ notifications: [], unreadCount: 0 })
  const [loading, setLoading] = useState(true)

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { toast.error('Erro ao carregar notificações') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifications() }, [])

  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }))
    } catch { toast.error('Erro ao marcar como lida') }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }))
      toast.success('Todas as notificações foram marcadas como lidas')
    } catch { toast.error('Erro') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground text-sm">
            {data.unreadCount > 0 ? `${data.unreadCount} não lida${data.unreadCount !== 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>
        {data.unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 self-start">
            <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : data.notifications.length === 0 ? (
        <EmptyState icon={Inbox} title="Sem notificações" description="Você não tem notificações." />
      ) : (
        <div className="space-y-2">
          {data.notifications.map(n => (
            <Card key={n.id} className={`transition-colors ${!n.read ? 'border-l-4 border-l-blue-500 bg-blue-500/5' : ''}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{n.message}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {n.project && (
                      <Link href={`/obras/${n.project.id}`} className="hover:text-primary transition-colors">
                        {n.project.code}
                      </Link>
                    )}
                    <span>{formatRelativeTime(n.createdAt)}</span>
                  </div>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => markAsRead(n.id)} title="Marcar como lida">
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
