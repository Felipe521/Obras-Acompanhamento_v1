import {
  ProjectStatus,
  StageStatus,
  TaskStatus,
  TaskPriority,
  MeasurementStatus,
  DocumentCategory,
  ExpenseCategory,
  ExpenseStatus,
  OccurrenceCategory,
  OccurrenceStatus,
  OccurrencePriority,
  ServiceUnit,
  UserRole,
} from '@prisma/client'

// ============================================================
// STATUS LABELS E CORES
// ============================================================

export const PROJECT_STATUS_MAP: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  PLANEJAMENTO: { label: 'Planejamento', color: 'text-slate-600', bg: 'bg-slate-100' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'text-blue-700', bg: 'bg-blue-100' },
  PAUSADA: { label: 'Pausada', color: 'text-amber-700', bg: 'bg-amber-100' },
  CONCLUIDA: { label: 'Concluída', color: 'text-green-700', bg: 'bg-green-100' },
  CANCELADA: { label: 'Cancelada', color: 'text-red-700', bg: 'bg-red-100' },
}

export const STAGE_STATUS_MAP: Record<StageStatus, { label: string; color: string; bg: string }> = {
  NAO_INICIADA: { label: 'Não iniciada', color: 'text-slate-600', bg: 'bg-slate-100' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'text-blue-700', bg: 'bg-blue-100' },
  PAUSADA: { label: 'Pausada', color: 'text-amber-700', bg: 'bg-amber-100' },
  CONCLUIDA: { label: 'Concluída', color: 'text-green-700', bg: 'bg-green-100' },
  ATRASADA: { label: 'Atrasada', color: 'text-red-700', bg: 'bg-red-100' },
}

export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  A_FAZER: { label: 'A fazer', color: 'text-slate-600', bg: 'bg-slate-100' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'text-blue-700', bg: 'bg-blue-100' },
  CONCLUIDA: { label: 'Concluída', color: 'text-green-700', bg: 'bg-green-100' },
  CANCELADA: { label: 'Cancelada', color: 'text-red-700', bg: 'bg-red-100' },
}

export const TASK_PRIORITY_MAP: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  BAIXA: { label: 'Baixa', color: 'text-slate-600', bg: 'bg-slate-100' },
  MEDIA: { label: 'Média', color: 'text-blue-700', bg: 'bg-blue-100' },
  ALTA: { label: 'Alta', color: 'text-amber-700', bg: 'bg-amber-100' },
  URGENTE: { label: 'Urgente', color: 'text-red-700', bg: 'bg-red-100' },
}

export const MEASUREMENT_STATUS_MAP: Record<MeasurementStatus, { label: string; color: string; bg: string }> = {
  RASCUNHO: { label: 'Rascunho', color: 'text-slate-600', bg: 'bg-slate-100' },
  ENVIADA: { label: 'Enviada', color: 'text-blue-700', bg: 'bg-blue-100' },
  APROVADA: { label: 'Aprovada', color: 'text-green-700', bg: 'bg-green-100' },
  REJEITADA: { label: 'Rejeitada', color: 'text-red-700', bg: 'bg-red-100' },
}

export const EXPENSE_CATEGORY_MAP: Record<ExpenseCategory, { label: string; color: string }> = {
  MATERIAL: { label: 'Material', color: 'text-blue-700' },
  MAO_DE_OBRA: { label: 'Mão de obra', color: 'text-purple-700' },
  EQUIPAMENTO: { label: 'Equipamento', color: 'text-amber-700' },
  TRANSPORTE: { label: 'Transporte', color: 'text-cyan-700' },
  SERVICOS: { label: 'Serviços', color: 'text-green-700' },
  OUTROS: { label: 'Outros', color: 'text-slate-600' },
}

export const EXPENSE_STATUS_MAP: Record<ExpenseStatus, { label: string; color: string; bg: string }> = {
  PENDENTE: { label: 'Pendente', color: 'text-amber-700', bg: 'bg-amber-100' },
  PAGO: { label: 'Pago', color: 'text-green-700', bg: 'bg-green-100' },
  CANCELADO: { label: 'Cancelado', color: 'text-slate-600', bg: 'bg-slate-100' },
  ATRASADO: { label: 'Atrasado', color: 'text-red-700', bg: 'bg-red-100' },
}

export const OCCURRENCE_CATEGORY_MAP: Record<OccurrenceCategory, { label: string }> = {
  SEGURANCA: { label: 'Segurança' },
  MATERIAL: { label: 'Material' },
  MAO_DE_OBRA: { label: 'Mão de obra' },
  PROJETO: { label: 'Projeto' },
  FINANCEIRO: { label: 'Financeiro' },
  PRAZO: { label: 'Prazo' },
  QUALIDADE: { label: 'Qualidade' },
  OUTROS: { label: 'Outros' },
}

export const OCCURRENCE_STATUS_MAP: Record<OccurrenceStatus, { label: string; color: string; bg: string }> = {
  ABERTA: { label: 'Aberta', color: 'text-red-700', bg: 'bg-red-100' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'text-blue-700', bg: 'bg-blue-100' },
  RESOLVIDA: { label: 'Resolvida', color: 'text-green-700', bg: 'bg-green-100' },
  CANCELADA: { label: 'Cancelada', color: 'text-slate-600', bg: 'bg-slate-100' },
}

export const OCCURRENCE_PRIORITY_MAP: Record<OccurrencePriority, { label: string; color: string; bg: string }> = {
  BAIXA: { label: 'Baixa', color: 'text-slate-600', bg: 'bg-slate-100' },
  MEDIA: { label: 'Média', color: 'text-amber-700', bg: 'bg-amber-100' },
  ALTA: { label: 'Alta', color: 'text-orange-700', bg: 'bg-orange-100' },
  CRITICA: { label: 'Crítica', color: 'text-red-700', bg: 'bg-red-100' },
}

export const DOCUMENT_CATEGORY_MAP: Record<DocumentCategory, { label: string }> = {
  PROJETO: { label: 'Projeto' },
  PLANTA: { label: 'Planta' },
  CONTRATO: { label: 'Contrato' },
  NOTA_FISCAL: { label: 'Nota fiscal' },
  ORCAMENTO: { label: 'Orçamento' },
  ART: { label: 'ART' },
  RRT: { label: 'RRT' },
  LAUDO: { label: 'Laudo' },
  RELATORIO: { label: 'Relatório' },
  OUTROS: { label: 'Outros' },
}

export const SERVICE_UNIT_MAP: Record<ServiceUnit, { label: string }> = {
  UNIDADE: { label: 'Unidade' },
  METRO: { label: 'm' },
  METRO_QUADRADO: { label: 'm²' },
  METRO_CUBICO: { label: 'm³' },
  KG: { label: 'kg' },
  HORA: { label: 'hora' },
  DIARIA: { label: 'diária' },
  PACOTE: { label: 'pacote' },
  OUTRO: { label: 'outro' },
}

export const USER_ROLE_MAP: Record<UserRole, { label: string; description: string }> = {
  ADMIN: { label: 'Administrador', description: 'Acesso total ao sistema' },
  GESTOR: { label: 'Gestor', description: 'Gerencia obras, etapas e equipes' },
  RESPONSAVEL: { label: 'Responsável', description: 'Atualiza etapas e registra atividades' },
  VISUALIZADOR: { label: 'Visualizador', description: 'Apenas visualiza informações' },
}

// ============================================================
// CONSTANTES
// ============================================================

export const ACCEPTED_FILE_TYPES = {
  documents: ['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.zip', '.txt'],
  images: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  cad: ['.dwg', '.dxf'],
  all: ['.pdf', '.docx', '.xlsx', '.xls', '.doc', '.zip', '.txt', '.jpg', '.jpeg', '.png', '.webp', '.dwg'],
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const ITEMS_PER_PAGE = 20

export const PAYMENT_METHODS = [
  'Dinheiro',
  'Cartão de crédito',
  'Cartão de débito',
  'Transferência bancária',
  'PIX',
  'Boleto',
  'Cheque',
  'Outros',
]
