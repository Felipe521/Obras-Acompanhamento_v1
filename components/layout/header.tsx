'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  Search,
  ChevronRight,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { logoutAction } from '@/app/actions/auth'

// Breadcrumb generation from pathname
function generateBreadcrumbs(pathname: string) {
  const paths: { href: string; label: string }[] = [
    { href: '/dashboard', label: 'Dashboard' },
  ]

  const segments = pathname.split('/').filter(Boolean)
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    obras: 'Obras',
    nova: 'Nova',
    cronograma: 'Cronograma',
    etapas: 'Etapas',
    atividades: 'Atividades',
    custos: 'Custos',
    medicoes: 'Medições',
    documentos: 'Documentos',
    fotos: 'Fotos',
    fornecedores: 'Fornecedores',
    equipe: 'Equipe',
    ocorrencias: 'Ocorrências',
    relatorios: 'Relatórios',
    notificacoes: 'Notificações',
    configuracoes: 'Configurações',
    usuarios: 'Usuários',
    perfil: 'Perfil',
    servicos: 'Serviços',
  }

  if (segments[0] === 'dashboard') return [{ href: '/dashboard', label: 'Dashboard' }]

  let currentPath = ''
  return segments.map((segment) => {
    currentPath += `/${segment}`
    return {
      href: currentPath,
      label: labelMap[segment] || segment,
    }
  })
}

interface HeaderProps {
  sidebarCollapsed: boolean
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  async function handleSignOut() {
    // Agora isso aciona a Server Action que tem permissão absoluta
    // para destruir o cookie de sessão do servidor e forçar o redirecionamento.
    toast.success('Desconectando...')
    await logoutAction()
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center gap-4 px-6 bg-background/80 backdrop-blur-sm border-b border-border"
      style={{ left: sidebarCollapsed ? 64 : 256 }}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-foreground font-medium truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/busca">
            <Search className="w-4 h-4" />
          </Link>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notificacoes">
            <Bell className="w-4 h-4" />
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-24 truncate">
                {session?.user?.name?.split(' ')[0] || 'Usuário'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/configuracoes/perfil" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/configuracoes" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                handleSignOut()
              }}
              className="text-red-500 focus:text-red-500 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

