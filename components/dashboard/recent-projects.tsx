import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/common/progress-bar'
import { StatusBadge } from '@/components/common/status-badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, HardHat } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { ProjectStatus } from '@prisma/client'

interface Project {
  id: string
  name: string
  code: string
  client: string
  status: ProjectStatus
  endDate: Date | null
  avgProgress: number
  responsible: { name: string } | null
}

export function RecentProjects({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Obras recentes</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/obras" className="text-xs gap-1">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <HardHat className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma obra cadastrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/obras/${project.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center flex-shrink-0">
                  <HardHat className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </span>
                    <StatusBadge status={project.status} type="project" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {project.client} · {project.code}
                    {project.endDate && ` · Prazo: ${formatDate(project.endDate)}`}
                  </p>
                  <ProgressBar value={project.avgProgress} size="sm" className="mt-2" />
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-semibold tabular-nums">{project.avgProgress}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
