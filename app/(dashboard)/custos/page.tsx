'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { DollarSign, Search, TrendingUp, TrendingDown, Wallet, Plus, Edit, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ExpenseForm } from '@/components/custos/expense-form'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EXPENSE_CATEGORY_MAP } from '@/lib/constants'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDENTE: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  PAGO: { label: 'Pago', color: 'text-green-400', bg: 'bg-green-500/10' },
  CANCELADO: { label: 'Cancelado', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ATRASADO: { label: 'Atrasado', color: 'text-red-400', bg: 'bg-red-500/10' },
}

interface Expense {
  id: string; description: string; category: string; status: string
  realizedValue: string; date: string; paymentMethod: string | null; invoiceNumber: string | null
  quantity: string | null; unit: string | null; unitValue: string | null
  project: { id: string; name: string; code: string }
  stage: { id: string; name: string } | null
  service: { id: string; name: string } | null
  supplier: { id: string; companyName: string; tradeName: string | null } | null
  createdBy: { id: string; name: string }
}

export default function CustosPage() {
  const { data: session } = useSession()
  const canEdit = ['ADMIN', 'GESTOR'].includes((session?.user as any)?.role || '')

  const [data, setData] = useState<{ expenses: Expense[]; summary: { total: number; count: number } }>({ expenses: [], summary: { total: 0, count: 0 } })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchExpenses() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/expenses?${params}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { toast.error('Erro ao carregar custos') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchExpenses() }, [categoryFilter, statusFilter])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Despesa excluída com sucesso')
      setDeleteId(null)
      await fetchExpenses()
    } catch {
      toast.error('Erro ao excluir despesa')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = data.expenses.filter(e =>
    !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.project.name.toLowerCase().includes(search.toLowerCase())
  )

  const paidTotal = filtered.filter(e => e.status === 'PAGO').reduce((s, e) => s + Number(e.realizedValue), 0)
  const pendingTotal = filtered.filter(e => e.status === 'PENDENTE' || e.status === 'ATRASADO').reduce((s, e) => s + Number(e.realizedValue), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Custos</h1>
          <p className="text-muted-foreground text-sm">Controle financeiro de todas as obras</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova despesa
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Wallet className="w-5 h-5 text-blue-400" /></div>
          <div><p className="text-xs text-muted-foreground">Total geral</p><p className="text-lg font-bold">{formatCurrency(data.summary.total)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-400" /></div>
          <div><p className="text-xs text-muted-foreground">Total pago</p><p className="text-lg font-bold text-green-400">{formatCurrency(paidTotal)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-amber-400" /></div>
          <div><p className="text-xs text-muted-foreground">Pendente</p><p className="text-lg font-bold text-amber-400">{formatCurrency(pendingTotal)}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar despesa ou obra..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(EXPENSE_CATEGORY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhuma despesa"
          description="Não há despesas para exibir."
          action={canEdit ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova despesa
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Descrição</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Obra</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Categoria</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                      {canEdit && <th className="text-center p-3 font-medium text-muted-foreground">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(exp => {
                      const st = STATUS_LABELS[exp.status] || STATUS_LABELS.PENDENTE
                      return (
                        <tr key={exp.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(exp.date)}</td>
                          <td className="p-3">
                            <p className="font-medium truncate max-w-[250px]">{exp.description}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {exp.supplier && <span>{exp.supplier.tradeName || exp.supplier.companyName}</span>}
                              {exp.stage && <span>· {exp.stage.name}</span>}
                              {exp.service && <span>· {exp.service.name}</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <Link href={`/obras/${exp.project.id}`} className="text-primary hover:underline text-xs">{exp.project.code}</Link>
                          </td>
                          <td className="p-3 text-xs">{EXPENSE_CATEGORY_MAP[exp.category as keyof typeof EXPENSE_CATEGORY_MAP]?.label || exp.category}</td>
                          <td className="p-3 text-right font-semibold tabular-nums">{formatCurrency(exp.realizedValue)}</td>
                          <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${st.color} ${st.bg} font-medium`}>{st.label}</span></td>
                          {canEdit && (
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditExpense(exp)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(exp.id)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map(exp => {
              const st = STATUS_LABELS[exp.status] || STATUS_LABELS.PENDENTE
              return (
                <Card key={exp.id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{exp.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(exp.date)} · {exp.project.code}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${st.color} ${st.bg} font-medium`}>{st.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{EXPENSE_CATEGORY_MAP[exp.category as keyof typeof EXPENSE_CATEGORY_MAP]?.label || exp.category}</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(exp.realizedValue)}</span>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-2 pt-1 border-t border-border">
                        <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs" onClick={() => setEditExpense(exp)}>
                          <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 flex-1 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteId(exp.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Dialog open={showForm || !!editExpense} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditExpense(null) } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editExpense ? 'Editar despesa' : 'Nova despesa'}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editExpense}
            onSuccess={() => { setShowForm(false); setEditExpense(null); fetchExpenses() }}
            onCancel={() => { setShowForm(false); setEditExpense(null) }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir despesa?"
        description="Esta ação removerá a despesa do controle financeiro. Não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
