'use client'

import { useEffect, useState } from 'react'
import { Image as ImageIcon, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface Photo {
  id: string; title: string | null; description: string | null; category: string | null; createdAt: string
  project: { id: string; name: string; code: string }
  stage: { id: string; name: string } | null
  file: { id: string; url: string; name: string; originalName: string; mimeType: string; size: number }
  uploadedBy: { id: string; name: string }
}

export default function FotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch('/api/photos')
        if (!res.ok) throw new Error()
        setPhotos(await res.json())
      } catch { toast.error('Erro ao carregar fotos') }
      finally { setLoading(false) }
    }
    fetch_()
  }, [])

  const filtered = photos.filter(p =>
    !search ||
    (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
    p.project.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fotos</h1>
        <p className="text-muted-foreground text-sm">Galeria de fotos de todas as obras</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por título ou obra..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Nenhuma foto" description="As fotos das obras aparecerão aqui quando enviadas." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(photo => (
            <Card key={photo.id} className="overflow-hidden card-hover group">
              <div className="aspect-square bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 opacity-20" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-xs text-white font-medium truncate">{photo.title || photo.file.originalName}</p>
                  <p className="text-xs text-white/70">{photo.project.code}</p>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{photo.category || 'Geral'}</span>
                  <span>{formatDate(photo.createdAt)}</span>
                </div>
                {photo.stage && <p className="text-xs text-muted-foreground mt-1">Etapa: {photo.stage.name}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
