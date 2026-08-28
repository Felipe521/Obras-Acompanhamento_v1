'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Settings, User, Shield, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', GESTOR: 'Gestor', RESPONSAVEL: 'Responsável', VISUALIZADOR: 'Visualizador',
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie seu perfil e preferências</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Perfil</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{session?.user?.name || 'Usuário'}</h3>
              <p className="text-sm text-muted-foreground">{session?.user?.email || ''}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium mt-1 inline-block">
                {ROLE_LABELS[(session?.user as any)?.role] || 'Visualizador'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <Label className="text-muted-foreground">Nome</Label>
              <Input value={session?.user?.name || ''} disabled className="mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <Input value={session?.user?.email || ''} disabled className="mt-1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Para alterar seus dados, entre em contato com o administrador.</p>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Moon className="w-4 h-4" /> Aparência</CardTitle>
          <CardDescription>Personalize a aparência do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[
              { value: 'light', label: 'Claro', icon: Sun },
              { value: 'dark', label: 'Escuro', icon: Moon },
              { value: 'system', label: 'Sistema', icon: Monitor },
            ].map(opt => {
              const Icon = opt.icon
              const isActive = theme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all flex-1 ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4" /> Sistema</CardTitle>
          <CardDescription>Informações do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versão</span>
              <span className="font-medium">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ambiente</span>
              <span className="font-medium">{process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-medium">Next.js 14</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Banco de dados</span>
              <span className="font-medium">PostgreSQL (Supabase)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
