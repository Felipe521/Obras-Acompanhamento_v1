'use client'

import { useEffect } from 'react'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Root error boundary]', error)
  }, [error])

  return (
    <div
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
    </div>
  )
}
