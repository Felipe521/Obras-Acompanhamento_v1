'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Dashboard error boundary]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-base font-semibold mb-1">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        Não foi possível carregar esta página. Tente novamente — se o problema continuar, entre em contato com o suporte.
      </p>
      <Button size="sm" onClick={() => reset()}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Tentar novamente
      </Button>
    </div>
  )
}
