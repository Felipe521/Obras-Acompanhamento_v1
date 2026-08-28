'use client'

import { useState } from 'react'
import { BarChart3, Download, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const REPORT_TYPES = [
  { id: 'resumo-geral', label: 'Resumo Geral', description: 'Visão geral de todas as obras com status, progresso e financeiro.', icon: '📊' },
  { id: 'financeiro', label: 'Relatório Financeiro', description: 'Detalhamento de despesas por obra, categoria e fornecedor.', icon: '💰' },
  { id: 'cronograma', label: 'Relatório de Cronograma', description: 'Etapas com datas planejadas vs reais e atrasos.', icon: '📅' },
  { id: 'atividades', label: 'Relatório de Atividades', description: 'Tarefas pendentes, em andamento e concluídas.', icon: '✅' },
  { id: 'ocorrencias', label: 'Relatório de Ocorrências', description: 'Registro de ocorrências por categoria e prioridade.', icon: '⚠️' },
  { id: 'medicoes', label: 'Relatório de Medições', description: 'Histórico de medições e progressos por obra.', icon: '📐' },
]

export default function RelatoriosPage() {
  const [generating, setGenerating] = useState<string | null>(null)

  async function generateReport(type: string) {
    setGenerating(type)
    try {
      // Fetch data based on report type
      let data: any = {}
      
      if (type === 'resumo-geral' || type === 'financeiro') {
        const [projectsRes, expensesRes] = await Promise.all([
          fetch('/api/projects?limit=100'),
          fetch('/api/expenses'),
        ])
        data.projects = await projectsRes.json()
        data.expenses = await expensesRes.json()
      } else if (type === 'cronograma') {
        const res = await fetch('/api/stages')
        data.stages = await res.json()
      } else if (type === 'atividades') {
        const res = await fetch('/api/tasks')
        data.tasks = await res.json()
      } else if (type === 'ocorrencias') {
        const res = await fetch('/api/occurrences')
        data.occurrences = await res.json()
      } else if (type === 'medicoes') {
        const res = await fetch('/api/measurements')
        data.measurements = await res.json()
      }

      // Generate CSV report
      let csv = ''
      const now = new Date().toLocaleDateString('pt-BR')
      
      if (type === 'resumo-geral' && data.projects?.data) {
        csv = 'Código,Nome,Cliente,Status,Progresso (%),Orçamento\n'
        data.projects.data.forEach((p: any) => {
          csv += `${p.code},"${p.name}","${p.client}",${p.status},${p.avgProgress},${p.totalBudget || 0}\n`
        })
      } else if (type === 'financeiro' && data.expenses?.expenses) {
        csv = 'Data,Descrição,Obra,Categoria,Valor,Status\n'
        data.expenses.expenses.forEach((e: any) => {
          csv += `${new Date(e.date).toLocaleDateString('pt-BR')},"${e.description}","${e.project.code}",${e.category},${e.realizedValue},${e.status}\n`
        })
      } else if (type === 'cronograma' && data.stages) {
        csv = 'Etapa,Obra,Status,Progresso (%),Início Prev.,Fim Prev.\n'
        data.stages.forEach((s: any) => {
          csv += `"${s.name}","${s.project.code}",${s.status},${Number(s.actualProgress).toFixed(0)},${s.plannedStartDate ? new Date(s.plannedStartDate).toLocaleDateString('pt-BR') : '-'},${s.plannedEndDate ? new Date(s.plannedEndDate).toLocaleDateString('pt-BR') : '-'}\n`
        })
      } else if (type === 'atividades' && data.tasks) {
        csv = 'Título,Obra,Status,Prioridade,Responsável,Prazo\n'
        data.tasks.forEach((t: any) => {
          csv += `"${t.title}","${t.project.code}",${t.status},${t.priority},"${t.assignee?.name || '-'}",${t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR') : '-'}\n`
        })
      } else if (type === 'ocorrencias' && data.occurrences) {
        csv = 'Título,Obra,Categoria,Prioridade,Status,Data\n'
        data.occurrences.forEach((o: any) => {
          csv += `"${o.title}","${o.project.code}",${o.category},${o.priority},${o.status},${new Date(o.date).toLocaleDateString('pt-BR')}\n`
        })
      } else if (type === 'medicoes' && data.measurements) {
        csv = 'Nº,Obra,Data,Valor,Progresso (%),Status\n'
        data.measurements.forEach((m: any) => {
          csv += `${m.number},"${m.project.code}",${new Date(m.date).toLocaleDateString('pt-BR')},${m.value},${Number(m.progress).toFixed(1)},${m.status}\n`
        })
      }

      if (csv) {
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-${type}-${now.replace(/\//g, '-')}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Relatório gerado com sucesso!')
      } else {
        toast.info('Sem dados para gerar o relatório.')
      }
    } catch {
      toast.error('Erro ao gerar relatório')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground text-sm">Gere relatórios das obras em formato CSV</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_TYPES.map(report => (
          <Card key={report.id} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{report.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{report.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => generateReport(report.id)}
                disabled={generating === report.id}
              >
                {generating === report.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</>
                ) : (
                  <><Download className="w-4 h-4" />Gerar relatório</>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
