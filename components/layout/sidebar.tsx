'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  LayoutDashboard,
  HardHat,
  Calendar,
  Layers,
  CheckSquare,
  DollarSign,
  Ruler,
  FileText,
  Image,
  Truck,
  Users,
  AlertTriangle,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/obras', label: 'Obras', icon: HardHat },
  { href: '/cronograma', label: 'Cronograma', icon: Calendar },
  { href: '/etapas', label: 'Etapas', icon: Layers },
  { href: '/atividades', label: 'Atividades', icon: CheckSquare },
  { href: '/custos', label: 'Custos', icon: DollarSign },
  { href: '/medicoes', label: 'Medições', icon: Ruler },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  { href: '/fotos', label: 'Fotos', icon: Image },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { href: '/equipe', label: 'Equipe', icon: Users },
  { href: '/ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full flex flex-col bg-slate-900 border-r border-slate-800 sidebar-transition',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white truncate">
              Obra<span className="text-blue-400">Control</span>
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            'ml-auto text-slate-400 hover:text-white transition-colors p-1 rounded',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-blue-400')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-600 text-center">
            ObraControl v1.0
          </div>
        </div>
      )}
    </aside>
  )
}
