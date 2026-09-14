'use client'

import { useEffect } from 'react'

// Último recurso: só é usado se o próprio layout raiz (app/layout.tsx) falhar.
// Precisa renderizar <html>/<body> porque substitui o layout inteiro.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Global error boundary]', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1rem',
          textAlign: 'center',
          background: '#0f172a',
          color: '#e2e8f0',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Algo deu errado</h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '24rem' }}>
          Não foi possível carregar a aplicação. Tente novamente em instantes.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: '#2563eb',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
