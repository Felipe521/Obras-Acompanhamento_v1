'use client'

import { useEffect, useState } from 'react'
import { Truck, Plus, Search, Edit, Trash2, MoreVertical, Mail, Phone, MapPin, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Supplier {
  id: string; companyName: string; tradeName: string | null; cnpj: string | null
  phone: string | null; email: string | null; address: string | null; city: string | null
  state: string | null; contact: string | null; category: string | null; notes: string | null
  _count: { expenses: number; projects: number }
}

const emptyForm = {
  companyName: '', tradeName: '', cnpj: '', phone: '', email: '',
  address: '', city: '', state: '', contact: '', category: '', notes: '',
}

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Supplier | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  async function fetchSuppliers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/suppliers?${params}`)
      if (!res.ok) throw new Error()
      setSuppliers(await res.json())
    } catch { toast.error('Erro ao carregar fornecedores') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSuppliers() }, [search])

  function openEdit(s: Supplier) {
    setEditItem(s)
    setFormData({
      companyName: s.companyName, tradeName: s.tradeName || '', cnpj: s.cnpj || '',
      phone: s.phone || '', email: s.email || '', address: s.address || '',
      city: s.city || '', state: s.state || '', contact: s.contact || '',
      category: s.category || '', notes: s.notes || '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editItem ? `/api/suppliers/${editItem.id}` : '/api/suppliers'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro') }
      toast.success(editItem ? 'Fornecedor atualizado!' : 'Fornecedor criado!')
      setShowForm(false); setEditItem(null); setFormData(emptyForm); fetchSuppliers()
    } catch (err: any) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/suppliers/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Fornecedor excluído'); setDeleteId(null); fetchSuppliers()
    } catch { toast.error('Erro ao excluir') }
    finally { setDeleting(false) }
  }

  const isFormOpen = showForm || !!editItem

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground text-sm">{suppliers.length} fornecedor{suppliers.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={() => { setFormData(emptyForm); setShowForm(true) }} className="gap-2 self-start">
          <Plus className="w-4 h-4" /> Novo fornecedor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, CNPJ ou contato..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <EmptyState icon={Truck} title="Nenhum fornecedor" description="Cadastre seus fornecedores para associar às despesas." action={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-2" />Novo</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <Card key={s.id} className="card-hover group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{s.tradeName || s.companyName}</h3>
                    {s.tradeName && <p className="text-xs text-muted-foreground truncate">{s.companyName}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(s)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(s.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {s.cnpj && <p className="text-xs font-mono text-muted-foreground mb-2">{s.cnpj}</p>}
                {s.category && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">{s.category}</span>}
                <div className="mt-3 space-y-1.5">
                  {s.contact && <div className="flex items-center gap-2 text-xs text-muted-foreground"><User className="w-3.5 h-3.5" />{s.contact}</div>}
                  {s.phone && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5" />{s.phone}</div>}
                  {s.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="w-3.5 h-3.5" /><span className="truncate">{s.email}</span></div>}
                  {(s.city || s.state) && <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{[s.city, s.state].filter(Boolean).join(', ')}</div>}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex gap-4 text-xs text-muted-foreground">
                  <span>{s._count.projects} obra{s._count.projects !== 1 ? 's' : ''}</span>
                  <span>{s._count.expenses} despesa{s._count.expenses !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={o => { if (!o) { setShowForm(false); setEditItem(null) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Razão social *</Label><Input required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} /></div>
              <div><Label>Nome fantasia</Label><Input value={formData.tradeName} onChange={e => setFormData({...formData, tradeName: e.target.value})} /></div>
              <div><Label>CNPJ</Label><Input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} /></div>
              <div><Label>Contato</Label><Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} /></div>
              <div><Label>Telefone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><Label>Categoria</Label><Input placeholder="Ex: Materiais, Elétrica..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
              <div className="col-span-2"><Label>Endereço</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
              <div><Label>Cidade</Label><Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
              <div><Label>Estado</Label><Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
              <div className="col-span-2"><Label>Observações</Label><Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} /></div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditItem(null) }}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : editItem ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)} title="Excluir fornecedor?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={handleDelete} loading={deleting} />
    </div>
  )
}
