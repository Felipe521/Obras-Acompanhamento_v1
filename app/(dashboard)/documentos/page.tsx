'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Search, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/common/empty-state'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

const CATEGORY_MAP: Record<string, string> = {
  PROJETO: 'Projeto', PLANTA: 'Planta', CONTRATO: 'Contrato', NOTA_FISCAL: 'Nota fiscal',
  ORCAMENTO: 'Orçamento', ART: 'ART', RRT: 'RRT', LAUDO: 'Laudo', RELATORIO: 'Relatório', OUTROS: 'Outros',
}
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ATIVO: { label: 'Ativo', color: 'text-green-400', bg: 'bg-green-500/10' },
  ARQUIVADO: { label: 'Arquivado', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  SUBSTITUIDO: { label: 'Substituído', color: 'text-amber-400', bg: 'bg-amber-500/10' },
}

interface Doc {
  id: string; name: string; category: string; description: string | null; status: string
  expiresAt: string | null; tags: string[]; createdAt: string; updatedAt: string
  project: { id: string; name: string; code: string }
  responsible: { id: string; name: string } | null
  _count: { versions: number }
}

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  async function fetchDocs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      const res = await fetch(`/api/documents?${params}`)
      if (!res.ok) throw new Error()
      setDocs(await res.json())
    } catch { toast.error('Erro ao carregar documentos') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDocs() }, [categoryFilter])

  const filtered = docs.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.project.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documentos</h1>
        <p className="text-muted-foreground text-sm">{docs.length} documento{docs.length !== 1 ? 's' : ''} cadastrado{docs.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar documento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(CATEGORY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum documento" description="Os documentos das obras aparecerão aqui." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const st = STATUS_MAP[doc.status] || STATUS_MAP.ATIVO
            const isExpiring = doc.expiresAt && new Date(doc.expiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            return (
              <Card key={doc.id} className="card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{doc.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{CATEGORY_MAP[doc.category]}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${st.color} ${st.bg}`}>{st.label}</span>
                      </div>
                    </div>
                  </div>
                  {doc.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{doc.description}</p>}
                  <Link href={`/obras/${doc.project.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors block mb-2">
                    {doc.project.code} — {doc.project.name}
                  </Link>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{doc._count.versions} versão{doc._count.versions !== 1 ? 'ões' : ''}</span>
                    {doc.expiresAt && (
                      <span className={isExpiring ? 'text-red-400' : ''}>Venc: {formatDate(doc.expiresAt)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
