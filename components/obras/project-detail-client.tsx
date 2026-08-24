'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HardHat, Calendar, DollarSign, Users, AlertTriangle, FileText, Image,
  CheckSquare, Ruler, Layers, ChevronRight, Edit, ArrowLeft,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/common/status-badge'
import { ProgressBar } from '@/components/common/progress-bar'
import { MetricCard } from '@/components/common/metric-card'
import { StagesTab } from '@/components/obras/stages-tab'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjectForm } from '@/components/obras/project-form'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ProjectStatus } from '@prisma/client'

interface ProjectDetailClientProps {
  project: any
  financialSummary: { totalBudget: number; totalSpent: number; balance: number }
  avgProgress: number
  currentUser: { id: string; role: string }
}

export function ProjectDetailClient({
  project,
  financialSummary,
  avgProgress,
  currentUser,
}: ProjectDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('visao-geral')

  const canEdit = ['ADMIN', 'GESTOR'].includes(currentUser.role)
  const percentUsed = financialSummary.totalBudget > 0
    ? (financialSummary.totalSpent / financialSummary.totalBudget) * 100
    : 0

  const stagesByStatus = {
    concluida: project.stages.filter((s: any) => s.status === 'CONCLUIDA').length,
    emAndamento: project.stages.filter((s: any) => s.status === 'EM_ANDAMENTO').length,
    atrasada: project.stages.filter((s: any) => s.status === 'ATRASADA').length,
    naoIniciada: project.stages.filter((s: any) => s.status === 'NAO_INICIADA').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-0.5">
            <Link href="/obras">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {project.code}
              </span>
              <StatusBadge status={project.status} type="project" />
            </div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground text-sm">
              Cliente: {project.client}
              {project.city && ` · ${project.city}, ${project.state}`}
              {project.responsible && ` · Resp: ${project.responsible.name}`}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="self-start">
            <Edit className="w-4 h-4 mr-2" />
            Editar obra
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress */}
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progresso geral</span>
              <span className="text-2xl font-bold tabular-nums">{avgProgress}%</span>
            </div>
            <ProgressBar value={avgProgress} size="lg" />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>✅ {stagesByStatus.concluida} concluídas</span>
              <span>🔵 {stagesByStatus.emAndamento} andamento</span>
              <span>🔴 {stagesByStatus.atrasada} atrasadas</span>
              <span>⚫ {stagesByStatus.naoIniciada} não iniciadas</span>
            </div>
          </CardContent>
        </Card>

        <MetricCard
          title="Orçamento"
          value={formatCurrency(financialSummary.totalBudget)}
          icon={DollarSign}
          variant="primary"
          subtitle={`${percentUsed.toFixed(1)}% utilizado`}
        />
        <MetricCard
          title="Gasto"
          value={formatCurrency(financialSummary.totalSpent)}
          icon={DollarSign}
          variant={percentUsed > 90 ? 'danger' : 'default'}
        />
        <MetricCard
          title="Saldo"
          value={formatCurrency(financialSummary.balance)}
          icon={DollarSign}
          variant={financialSummary.balance < 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Dates */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {project.startDate && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Início: <span className="text-foreground font-medium">{formatDate(project.startDate)}</span>
          </span>
        )}
        {project.endDate && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Previsão: <span className="text-foreground font-medium">{formatDate(project.endDate)}</span>
          </span>
        )}
        {project.actualEndDate && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Conclusão real: <span className="text-foreground font-medium">{formatDate(project.actualEndDate)}</span>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span className="text-foreground font-medium">{project.members.length}</span> membros
        </span>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: Layers, label: 'Etapas', value: project._count.stages, href: '#etapas' },
          { icon: CheckSquare, label: 'Atividades', value: project._count.tasks, href: '#atividades' },
          { icon: DollarSign, label: 'Despesas', value: project._count.expenses, href: '#custos' },
          { icon: FileText, label: 'Documentos', value: project._count.documents, href: '#documentos' },
          { icon: Image, label: 'Fotos', value: project._count.photos, href: '#fotos' },
          { icon: AlertTriangle, label: 'Ocorrências', value: project._count.occurrences, href: '#ocorrencias' },
          { icon: Ruler, label: 'Medições', value: project._count.measurements, href: '#medicoes' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label.toLowerCase())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{item.value}</span>
              <span className="text-muted-foreground">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {[
            { value: 'visao-geral', label: 'Visão geral' },
            { value: 'etapas', label: 'Etapas' },
            { value: 'servicos', label: 'Serviços' },
            { value: 'cronograma', label: 'Cronograma' },
            { value: 'custos', label: 'Custos' },
            { value: 'medicoes', label: 'Medições' },
            { value: 'documentos', label: 'Documentos' },
            { value: 'fotos', label: 'Fotos' },
            { value: 'atividades', label: 'Atividades' },
            { value: 'ocorrencias', label: 'Ocorrências' },
            { value: 'equipe', label: 'Equipe' },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1.5">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4 mt-4">
          {project.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Resumo das etapas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.stages.slice(0, 5).map((stage: any) => (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{stage.name}</span>
                        <StatusBadge status={stage.status} type="stage" className="ml-2" />
                      </div>
                      <ProgressBar value={Number(stage.actualProgress)} size="sm" />
                    </div>
                    <span className="text-sm font-semibold tabular-nums w-12 text-right">
                      {Number(stage.actualProgress).toFixed(0)}%
                    </span>
                  </div>
                ))}
                {project.stages.length > 5 && (
                  <button
                    onClick={() => setActiveTab('etapas')}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver todas as {project.stages.length} etapas →
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etapas" className="mt-4">
          <StagesTab
            project={project}
            canEdit={canEdit}
          />
        </TabsContent>

        <TabsContent value="servicos" className="mt-4">
          <div className="text-center py-12 text-muted-foreground">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Selecione uma etapa para ver seus serviços</p>
          </div>
        </TabsContent>

        <TabsContent value="cronograma" className="mt-4">
          <GanttView stages={project.stages} />
        </TabsContent>

        {['custos', 'medicoes', 'documentos', 'fotos', 'atividades', 'ocorrencias', 'equipe'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Módulo em implementação</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar obra</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={project}
            onSuccess={() => {
              setEditOpen(false)
              window.location.reload()
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Simple Gantt-like view
function GanttView({ stages }: { stages: any[] }) {
  const stagesWithDates = stages.filter((s) => s.plannedStartDate && s.plannedEndDate)

  if (stagesWithDates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhuma etapa com datas cadastradas</p>
      </div>
    )
  }

  const minDate = new Date(Math.min(...stagesWithDates.map((s) => new Date(s.plannedStartDate).getTime())))
  const maxDate = new Date(Math.max(...stagesWithDates.map((s) => new Date(s.plannedEndDate).getTime())))
  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))

  const STATUS_COLORS: Record<string, string> = {
    CONCLUIDA: 'bg-green-500',
    EM_ANDAMENTO: 'bg-blue-500',
    ATRASADA: 'bg-red-500',
    PAUSADA: 'bg-amber-500',
    NAO_INICIADA: 'bg-slate-400',
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cronograma Gantt</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[600px] space-y-2">
          {stages.map((stage) => {
            if (!stage.plannedStartDate || !stage.plannedEndDate) {
              return (
                <div key={stage.id} className="flex items-center gap-3 h-8">
                  <div className="w-40 flex-shrink-0">
                    <p className="text-xs font-medium truncate">{stage.name}</p>
                  </div>
                  <div className="flex-1 relative h-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="text-xs text-muted-foreground">Sem datas definidas</span>
                    </div>
                  </div>
                </div>
              )
            }

            const startDays = Math.ceil(
              (new Date(stage.plannedStartDate).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            const duration = Math.max(
              1,
              Math.ceil(
                (new Date(stage.plannedEndDate).getTime() - new Date(stage.plannedStartDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )

            const left = `${(startDays / totalDays) * 100}%`
            const width = `${Math.max(2, (duration / totalDays) * 100)}%`
            const progressWidth = `${Number(stage.actualProgress)}%`
            const color = STATUS_COLORS[stage.status] || 'bg-slate-400'

            return (
              <div key={stage.id} className="flex items-center gap-3 h-8">
                <div className="w-40 flex-shrink-0">
                  <p className="text-xs font-medium truncate">{stage.name}</p>
                </div>
                <div className="flex-1 relative h-6 bg-muted rounded">
                  <div
                    className={`absolute top-0 bottom-0 rounded ${color} opacity-30`}
                    style={{ left, width }}
                  />
                  <div
                    className={`absolute top-0 bottom-0 rounded ${color}`}
                    style={{ left, width: `calc(${width} * ${Number(stage.actualProgress) / 100})` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 flex items-center"
                    style={{ left, width }}
                  >
                    <span className="text-xs text-white font-bold ml-1 drop-shadow">
                      {Number(stage.actualProgress).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <StatusBadge status={stage.status} type="stage" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
