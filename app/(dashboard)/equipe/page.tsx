'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Search, MoreVertical, Shield, Mail, Phone, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/common/empty-state'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const ROLE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Administrador', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  GESTOR: { label: 'Gestor', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  RESPONSAVEL: { label: 'Responsável', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  VISUALIZADOR: { label: 'Visualizador', color: 'text-slate-400', bg: 'bg-slate-500/10' },
}

interface User {
  id: string
  name: string
  email: string
  role: string
  image: string | null
  phone: string | null
  position: string | null
  company: string | null
  active: boolean
  createdAt: string
  _count: { projectMembers: number }
}

export default function EquipePage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'VISUALIZADOR',
    phone: '', position: '', company: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter !== 'all') params.set('role', roleFilter)
      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch {
      toast.error('Erro ao carregar equipe')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [search, roleFilter])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro')
      }
      toast.success('Usuário criado com sucesso!')
      setShowForm(false)
      setFormData({ name: '', email: '', password: '', role: 'VISUALIZADOR', phone: '', position: '', company: '' })
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Equipe</h1>
          <p className="text-muted-foreground text-sm">{users.length} membro{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 self-start">
          <Plus className="w-4 h-4" /> Novo usuário
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="GESTOR">Gestor</SelectItem>
            <SelectItem value="RESPONSAVEL">Responsável</SelectItem>
            <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum membro encontrado" description="Ajuste os filtros ou adicione um novo membro." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(user => {
            const role = ROLE_MAP[user.role] || ROLE_MAP.VISUALIZADOR
            return (
              <Card key={user.id} className="card-hover group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{user.position || 'Sem cargo'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.color} ${role.bg}`}>
                      {role.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" /> <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" /> {user.phone}
                      </div>
                    )}
                    {user.company && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" /> {user.company}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>{user._count.projectMembers} obra{user._count.projectMembers !== 1 ? 's' : ''}</span>
                    <span>Desde {formatDate(user.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome completo *</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Email *</Label>
                <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="col-span-2">
                <Label>Senha *</Label>
                <Input required type="password" minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <Label>Perfil</Label>
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="GESTOR">Gestor</SelectItem>
                    <SelectItem value="RESPONSAVEL">Responsável</SelectItem>
                    <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Criando...' : 'Criar usuário'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
