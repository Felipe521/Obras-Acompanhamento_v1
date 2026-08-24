import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed do ObraControl...')

  // ============================================================
  // USUÁRIOS
  // ============================================================
  const adminPassword = await bcryptjs.hash('Admin@123', 12)
  const gestorPassword = await bcryptjs.hash('Gestor@123', 12)
  const respPassword = await bcryptjs.hash('Resp@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@obracontrol.com.br' },
    update: {},
    create: {
      name: 'Administrador Sistema',
      email: 'admin@obracontrol.com.br',
      passwordHash: adminPassword,
      role: 'ADMIN',
      phone: '(11) 99999-0001',
      position: 'Administrador',
      active: true,
    },
  })

  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@obracontrol.com.br' },
    update: {},
    create: {
      name: 'Carlos Menezes',
      email: 'gestor@obracontrol.com.br',
      passwordHash: gestorPassword,
      role: 'GESTOR',
      phone: '(11) 99999-0002',
      position: 'Engenheiro Civil',
      company: 'Constru Alpha',
      active: true,
    },
  })

  const responsavel = await prisma.user.upsert({
    where: { email: 'responsavel@obracontrol.com.br' },
    update: {},
    create: {
      name: 'Pedro Rodrigues',
      email: 'responsavel@obracontrol.com.br',
      passwordHash: respPassword,
      role: 'RESPONSAVEL',
      phone: '(11) 99999-0003',
      position: 'Mestre de Obras',
      active: true,
    },
  })

  const visualizador = await prisma.user.upsert({
    where: { email: 'cliente@obracontrol.com.br' },
    update: {},
    create: {
      name: 'João da Silva',
      email: 'cliente@obracontrol.com.br',
      passwordHash: await bcryptjs.hash('Cliente@123', 12),
      role: 'VISUALIZADOR',
      phone: '(11) 99999-0004',
      active: true,
    },
  })

  console.log('✅ Usuários criados')

  // ============================================================
  // FORNECEDORES
  // ============================================================
  const sup1 = await prisma.supplier.upsert({
    where: { cnpj: '12.345.678/0001-01' },
    update: {},
    create: {
      companyName: 'Materiais Construção Alpha Ltda',
      tradeName: 'Alpha Materiais',
      cnpj: '12.345.678/0001-01',
      phone: '(11) 3333-1111',
      email: 'vendas@alphamateriais.com.br',
      address: 'Av. Industrial, 500',
      city: 'São Paulo',
      state: 'SP',
      contact: 'Marcelo Antunes',
      category: 'Materiais de construção',
    },
  })

  const sup2 = await prisma.supplier.upsert({
    where: { cnpj: '23.456.789/0001-02' },
    update: {},
    create: {
      companyName: 'Elétrica Omega Serviços Ltda',
      tradeName: 'Omega Elétrica',
      cnpj: '23.456.789/0001-02',
      phone: '(11) 3333-2222',
      email: 'contato@omegaeletrica.com.br',
      address: 'Rua dos Eletricistas, 200',
      city: 'São Paulo',
      state: 'SP',
      contact: 'Roberto Lima',
      category: 'Instalações elétricas',
    },
  })

  const sup3 = await prisma.supplier.upsert({
    where: { cnpj: '34.567.890/0001-03' },
    update: {},
    create: {
      companyName: 'Hidráulica Prime Soluções',
      tradeName: 'Prime Hidráulica',
      cnpj: '34.567.890/0001-03',
      phone: '(11) 3333-3333',
      email: 'prime@hidraulica.com.br',
      address: 'Rua das Bombas, 77',
      city: 'Guarulhos',
      state: 'SP',
      contact: 'Ana Beatriz',
      category: 'Instalações hidráulicas',
    },
  })

  console.log('✅ Fornecedores criados')

  // ============================================================
  // PROJETO 1: RESIDENCIAL ALPHA (obra de demonstração principal)
  // ============================================================
  const proj1 = await prisma.project.upsert({
    where: { code: 'OBR-0001' },
    update: {},
    create: {
      code: 'OBR-0001',
      name: 'Residencial Alpha',
      client: 'João da Silva',
      clientEmail: 'joao.silva@email.com.br',
      clientPhone: '(11) 98765-4321',
      address: 'Rua das Flores, 100',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      description: 'Construção de residência unifamiliar de alto padrão com 4 suítes, piscina e área de lazer completa.',
      status: 'EM_ANDAMENTO',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
      totalBudget: 850000,
      responsibleId: gestor.id,
      notes: 'Cliente preferencial. Entrega prevista para o final do ano.',
    },
  })

  // Members
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: proj1.id, userId: gestor.id } },
    update: {},
    create: { projectId: proj1.id, userId: gestor.id, role: 'RESPONSAVEL', responsibility: 'Engenheiro responsável' },
  })
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: proj1.id, userId: responsavel.id } },
    update: {},
    create: { projectId: proj1.id, userId: responsavel.id, role: 'COLABORADOR', responsibility: 'Mestre de obras' },
  })
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: proj1.id, userId: visualizador.id } },
    update: {},
    create: { projectId: proj1.id, userId: visualizador.id, role: 'VISUALIZADOR', responsibility: 'Cliente' },
  })

  // Stages for proj1
  const stageData = [
    {
      name: 'Fundação',
      code: 'FUND',
      order: 1,
      plannedStart: new Date('2024-01-15'),
      plannedEnd: new Date('2024-02-28'),
      actualStart: new Date('2024-01-20'),
      actualEnd: new Date('2024-03-05'),
      actualProgress: 100,
      status: 'CONCLUIDA' as const,
      priority: 'ALTA' as const,
    },
    {
      name: 'Estrutura',
      code: 'ESTR',
      order: 2,
      plannedStart: new Date('2024-03-01'),
      plannedEnd: new Date('2024-05-31'),
      actualStart: new Date('2024-03-06'),
      actualEnd: null,
      actualProgress: 100,
      status: 'CONCLUIDA' as const,
      priority: 'ALTA' as const,
    },
    {
      name: 'Alvenaria',
      code: 'ALVE',
      order: 3,
      plannedStart: new Date('2024-06-01'),
      plannedEnd: new Date('2024-07-31'),
      actualStart: new Date('2024-06-05'),
      actualEnd: null,
      actualProgress: 85,
      status: 'EM_ANDAMENTO' as const,
      priority: 'ALTA' as const,
    },
    {
      name: 'Instalações Elétricas',
      code: 'ELET',
      order: 4,
      plannedStart: new Date('2024-07-01'),
      plannedEnd: new Date('2024-08-31'),
      actualStart: new Date('2024-07-10'),
      actualEnd: null,
      actualProgress: 60,
      status: 'EM_ANDAMENTO' as const,
      priority: 'MEDIA' as const,
    },
    {
      name: 'Instalações Hidráulicas',
      code: 'HIDR',
      order: 5,
      plannedStart: new Date('2024-07-15'),
      plannedEnd: new Date('2024-09-15'),
      actualStart: new Date('2024-07-20'),
      actualEnd: null,
      actualProgress: 40,
      status: 'EM_ANDAMENTO' as const,
      priority: 'MEDIA' as const,
    },
    {
      name: 'Revestimento',
      code: 'REVE',
      order: 6,
      plannedStart: new Date('2024-08-01'),
      plannedEnd: new Date('2024-10-31'),
      actualStart: null,
      actualEnd: null,
      actualProgress: 0,
      status: 'NAO_INICIADA' as const,
      priority: 'MEDIA' as const,
    },
    {
      name: 'Pintura',
      code: 'PINT',
      order: 7,
      plannedStart: new Date('2024-10-01'),
      plannedEnd: new Date('2024-11-30'),
      actualStart: null,
      actualEnd: null,
      actualProgress: 0,
      status: 'NAO_INICIADA' as const,
      priority: 'MEDIA' as const,
    },
    {
      name: 'Acabamento',
      code: 'ACAB',
      order: 8,
      plannedStart: new Date('2024-11-01'),
      plannedEnd: new Date('2024-12-31'),
      actualStart: null,
      actualEnd: null,
      actualProgress: 0,
      status: 'NAO_INICIADA' as const,
      priority: 'ALTA' as const,
    },
  ]

  const stages: any[] = []
  for (const sd of stageData) {
    // Check if already exists
    const existing = await prisma.stage.findFirst({
      where: { projectId: proj1.id, code: sd.code },
    })
    const stage = existing || await prisma.stage.create({
      data: {
        projectId: proj1.id,
        name: sd.name,
        code: sd.code,
        order: sd.order,
        responsibleId: gestor.id,
        plannedStartDate: sd.plannedStart,
        plannedEndDate: sd.plannedEnd,
        actualStartDate: sd.actualStart,
        actualEndDate: sd.actualEnd,
        actualProgress: sd.actualProgress,
        plannedProgress: sd.actualProgress > 0 ? sd.actualProgress - 5 : 0,
        status: sd.status,
        priority: sd.priority,
      },
    })
    stages.push(stage)
  }

  console.log('✅ Etapas do Residencial Alpha criadas')

  // Services for stage 1 (Fundação - completed)
  const servicesStage1 = [
    { name: 'Escavação', unit: 'METRO_CUBICO' as const, plannedQty: 150, executedQty: 150, unitPrice: 80 },
    { name: 'Armação de ferro', unit: 'KG' as const, plannedQty: 5000, executedQty: 5000, unitPrice: 12 },
    { name: 'Concretagem', unit: 'METRO_CUBICO' as const, plannedQty: 80, executedQty: 80, unitPrice: 350 },
    { name: 'Impermeabilização', unit: 'METRO_QUADRADO' as const, plannedQty: 120, executedQty: 120, unitPrice: 45 },
  ]

  for (const svc of servicesStage1) {
    const existing = await prisma.service.findFirst({
      where: { stageId: stages[0].id, name: svc.name },
    })
    if (!existing) {
      await prisma.service.create({
        data: {
          stageId: stages[0].id,
          name: svc.name,
          unit: svc.unit,
          plannedQty: svc.plannedQty,
          executedQty: svc.executedQty,
          unitPrice: svc.unitPrice,
          status: 'CONCLUIDO',
          actualEndDate: new Date('2024-03-05'),
        },
      })
    }
  }

  // Services for stage 3 (Alvenaria - in progress)
  const servicesStage3 = [
    { name: 'Bloco cerâmico estrutural', unit: 'UNIDADE' as const, plannedQty: 8000, executedQty: 7000, unitPrice: 3.5 },
    { name: 'Argamassa de assentamento', unit: 'METRO_CUBICO' as const, plannedQty: 15, executedQty: 13, unitPrice: 280 },
    { name: 'Vergas e contra-vergas', unit: 'METRO' as const, plannedQty: 200, executedQty: 160, unitPrice: 35 },
    { name: 'Chapisco', unit: 'METRO_QUADRADO' as const, plannedQty: 800, executedQty: 600, unitPrice: 12 },
  ]

  for (const svc of servicesStage3) {
    const existing = await prisma.service.findFirst({
      where: { stageId: stages[2].id, name: svc.name },
    })
    if (!existing) {
      await prisma.service.create({
        data: {
          stageId: stages[2].id,
          name: svc.name,
          unit: svc.unit,
          plannedQty: svc.plannedQty,
          executedQty: svc.executedQty,
          unitPrice: svc.unitPrice,
          status: 'EM_ANDAMENTO',
        },
      })
    }
  }

  // Services for stage 4 (Elétrica - in progress)
  const servicesStage4 = [
    { name: 'Passagem de eletrodutos', unit: 'METRO' as const, plannedQty: 500, executedQty: 300, unitPrice: 18 },
    { name: 'Instalação de tomadas', unit: 'UNIDADE' as const, plannedQty: 80, executedQty: 48, unitPrice: 45 },
    { name: 'Instalação de interruptores', unit: 'UNIDADE' as const, plannedQty: 40, executedQty: 24, unitPrice: 35 },
    { name: 'Quadro elétrico geral', unit: 'UNIDADE' as const, plannedQty: 1, executedQty: 0, unitPrice: 3500 },
  ]

  for (const svc of servicesStage4) {
    const existing = await prisma.service.findFirst({
      where: { stageId: stages[3].id, name: svc.name },
    })
    if (!existing) {
      await prisma.service.create({
        data: {
          stageId: stages[3].id,
          name: svc.name,
          unit: svc.unit,
          plannedQty: svc.plannedQty,
          executedQty: svc.executedQty,
          unitPrice: svc.unitPrice,
          status: 'EM_ANDAMENTO',
        },
      })
    }
  }

  console.log('✅ Serviços criados')

  // Budget items
  const budgetItems = [
    { category: 'MATERIAL' as const, description: 'Materiais de construção - previsão total', plannedValue: 380000 },
    { category: 'MAO_DE_OBRA' as const, description: 'Mão de obra - todas as etapas', plannedValue: 250000 },
    { category: 'EQUIPAMENTO' as const, description: 'Equipamentos e ferramentas', plannedValue: 45000 },
    { category: 'SERVICOS' as const, description: 'Serviços especializados', plannedValue: 120000 },
    { category: 'OUTROS' as const, description: 'Imprevistos e contingência', plannedValue: 55000 },
  ]

  for (const bi of budgetItems) {
    const existing = await prisma.budgetItem.findFirst({
      where: { projectId: proj1.id, description: bi.description },
    })
    if (!existing) {
      await prisma.budgetItem.create({
        data: { projectId: proj1.id, ...bi },
      })
    }
  }

  // Expenses
  const expensesData = [
    {
      date: new Date('2024-01-25'),
      description: 'Compra de cimento Portland',
      category: 'MATERIAL' as const,
      realizedValue: 28000,
      paymentMethod: 'Boleto',
      status: 'PAGO' as const,
      supplierId: sup1.id,
      stageId: stages[0].id,
    },
    {
      date: new Date('2024-02-10'),
      description: 'Compra de ferro CA-50',
      category: 'MATERIAL' as const,
      realizedValue: 45000,
      paymentMethod: 'Transferência bancária',
      status: 'PAGO' as const,
      supplierId: sup1.id,
      stageId: stages[0].id,
    },
    {
      date: new Date('2024-02-28'),
      description: 'Mão de obra - fundação',
      category: 'MAO_DE_OBRA' as const,
      realizedValue: 32000,
      paymentMethod: 'PIX',
      status: 'PAGO' as const,
      stageId: stages[0].id,
    },
    {
      date: new Date('2024-04-15'),
      description: 'Concreto usinado BCK 30',
      category: 'MATERIAL' as const,
      realizedValue: 68000,
      paymentMethod: 'Boleto',
      status: 'PAGO' as const,
      supplierId: sup1.id,
      stageId: stages[1].id,
    },
    {
      date: new Date('2024-05-20'),
      description: 'Aluguel de andaime',
      category: 'EQUIPAMENTO' as const,
      realizedValue: 8500,
      paymentMethod: 'Boleto',
      status: 'PAGO' as const,
      stageId: stages[1].id,
    },
    {
      date: new Date('2024-06-10'),
      description: 'Blocos cerâmicos 14x19x39',
      category: 'MATERIAL' as const,
      realizedValue: 32000,
      paymentMethod: 'Boleto',
      status: 'PAGO' as const,
      supplierId: sup1.id,
      stageId: stages[2].id,
    },
    {
      date: new Date('2024-07-05'),
      description: 'Material elétrico - fase 1',
      category: 'MATERIAL' as const,
      realizedValue: 18500,
      paymentMethod: 'Cartão de crédito',
      status: 'PAGO' as const,
      supplierId: sup2.id,
      stageId: stages[3].id,
    },
    {
      date: new Date('2024-07-20'),
      description: 'Serviço elétrico - eletrodutos',
      category: 'MAO_DE_OBRA' as const,
      realizedValue: 22000,
      paymentMethod: 'PIX',
      status: 'PENDENTE' as const,
      supplierId: sup2.id,
      stageId: stages[3].id,
    },
    {
      date: new Date('2024-08-01'),
      description: 'Material hidráulico - canos e conexões',
      category: 'MATERIAL' as const,
      realizedValue: 15000,
      paymentMethod: 'Boleto',
      status: 'PENDENTE' as const,
      supplierId: sup3.id,
      stageId: stages[4].id,
    },
  ]

  for (const exp of expensesData) {
    const existing = await prisma.expense.findFirst({
      where: {
        projectId: proj1.id,
        description: exp.description,
        date: exp.date,
      },
    })
    if (!existing) {
      await prisma.expense.create({
        data: {
          projectId: proj1.id,
          createdById: gestor.id,
          ...exp,
        },
      })
    }
  }

  console.log('✅ Despesas criadas')

  // Tasks
  const tasksData = [
    {
      title: 'Aprovar projeto elétrico',
      description: 'Revisar e aprovar o projeto elétrico com o engenheiro responsável.',
      priority: 'ALTA' as const,
      status: 'EM_ANDAMENTO' as const,
      assigneeId: gestor.id,
      dueDate: new Date('2024-08-15'),
      stageId: stages[3].id,
    },
    {
      title: 'Solicitar aprovação na prefeitura',
      description: 'Protocolar pedido de aprovação do projeto na prefeitura municipal.',
      priority: 'URGENTE' as const,
      status: 'A_FAZER' as const,
      assigneeId: gestor.id,
      dueDate: new Date('2024-08-10'),
      stageId: null,
    },
    {
      title: 'Contratar empresa de pintura',
      description: 'Solicitar orçamentos e contratar empresa para a etapa de pintura.',
      priority: 'MEDIA' as const,
      status: 'A_FAZER' as const,
      assigneeId: gestor.id,
      dueDate: new Date('2024-09-01'),
      stageId: stages[6].id,
    },
    {
      title: 'Reunião de acompanhamento com cliente',
      description: 'Apresentar relatório de progresso ao cliente João da Silva.',
      priority: 'ALTA' as const,
      status: 'CONCLUIDA' as const,
      assigneeId: gestor.id,
      dueDate: new Date('2024-07-30'),
      stageId: null,
    },
    {
      title: 'Vistoria da estrutura',
      description: 'Realizar vistoria técnica da estrutura de concreto.',
      priority: 'ALTA' as const,
      status: 'CONCLUIDA' as const,
      assigneeId: responsavel.id,
      dueDate: new Date('2024-05-15'),
      stageId: stages[1].id,
    },
  ]

  for (const task of tasksData) {
    const existing = await prisma.task.findFirst({
      where: { projectId: proj1.id, title: task.title },
    })
    if (!existing) {
      await prisma.task.create({
        data: {
          projectId: proj1.id,
          creatorId: gestor.id,
          ...task,
        },
      })
    }
  }

  // Occurrences
  const occurrencesData = [
    {
      title: 'Atraso na entrega de material',
      description: 'O fornecedor Alpha não entregou os blocos cerâmicos na data prevista, causando atraso de 3 dias na alvenaria.',
      category: 'MATERIAL' as const,
      priority: 'ALTA' as const,
      status: 'RESOLVIDA' as const,
      date: new Date('2024-06-05'),
      stageId: stages[2].id,
    },
    {
      title: 'Chuva forte impede trabalho',
      description: 'Chuvas fortes nos últimos 2 dias impediram a continuidade das obras de alvenaria externa.',
      category: 'PRAZO' as const,
      priority: 'MEDIA' as const,
      status: 'RESOLVIDA' as const,
      date: new Date('2024-06-20'),
      stageId: stages[2].id,
    },
    {
      title: 'Alteração no projeto elétrico',
      description: 'Cliente solicitou adição de 10 pontos elétricos extras nas suítes, gerando custo adicional.',
      category: 'PROJETO' as const,
      priority: 'ALTA' as const,
      status: 'EM_ANDAMENTO' as const,
      date: new Date('2024-07-15'),
      stageId: stages[3].id,
    },
  ]

  for (const occ of occurrencesData) {
    const existing = await prisma.occurrence.findFirst({
      where: { projectId: proj1.id, title: occ.title },
    })
    if (!existing) {
      await prisma.occurrence.create({
        data: {
          projectId: proj1.id,
          responsibleId: gestor.id,
          ...occ,
        },
      })
    }
  }

  // Measurements
  const measData = [
    { number: 1, date: new Date('2024-03-31'), value: 85000, progress: 15, status: 'APROVADA' as const },
    { number: 2, date: new Date('2024-05-31'), value: 145000, progress: 35, status: 'APROVADA' as const },
    { number: 3, date: new Date('2024-07-31'), value: 98000, progress: 57, status: 'ENVIADA' as const },
  ]

  for (const m of measData) {
    const existing = await prisma.measurement.findFirst({
      where: { projectId: proj1.id, number: m.number },
    })
    if (!existing) {
      await prisma.measurement.create({
        data: {
          projectId: proj1.id,
          responsibleId: gestor.id,
          ...m,
        },
      })
    }
  }

  console.log('✅ Atividades, ocorrências e medições criadas')

  // ============================================================
  // PROJETO 2: COMERCIAL BETA
  // ============================================================
  const proj2 = await prisma.project.upsert({
    where: { code: 'OBR-0002' },
    update: {},
    create: {
      code: 'OBR-0002',
      name: 'Comercial Beta',
      client: 'Empresa XYZ S.A.',
      clientEmail: 'engenharia@xyz.com.br',
      clientPhone: '(11) 3333-5555',
      address: 'Av. Paulista, 1500',
      city: 'São Paulo',
      state: 'SP',
      description: 'Reforma e ampliação de escritório comercial com 3 pavimentos.',
      status: 'PLANEJAMENTO',
      startDate: new Date('2024-10-01'),
      endDate: new Date('2025-06-30'),
      totalBudget: 420000,
      responsibleId: gestor.id,
    },
  })

  // Members
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: proj2.id, userId: gestor.id } },
    update: {},
    create: { projectId: proj2.id, userId: gestor.id, role: 'RESPONSAVEL' },
  })

  // Stages for proj2
  const proj2Stages = [
    { name: 'Demolição', code: 'DEMO', order: 1, status: 'NAO_INICIADA' as const, actualProgress: 0 },
    { name: 'Estrutura metálica', code: 'META', order: 2, status: 'NAO_INICIADA' as const, actualProgress: 0 },
    { name: 'Alvenaria e divisórias', code: 'DIV', order: 3, status: 'NAO_INICIADA' as const, actualProgress: 0 },
    { name: 'Instalações prediais', code: 'INST', order: 4, status: 'NAO_INICIADA' as const, actualProgress: 0 },
    { name: 'Acabamentos', code: 'ACAB2', order: 5, status: 'NAO_INICIADA' as const, actualProgress: 0 },
  ]

  for (const sd of proj2Stages) {
    const existing = await prisma.stage.findFirst({
      where: { projectId: proj2.id, code: sd.code },
    })
    if (!existing) {
      await prisma.stage.create({
        data: {
          projectId: proj2.id,
          name: sd.name,
          code: sd.code,
          order: sd.order,
          status: sd.status,
          actualProgress: sd.actualProgress,
          plannedProgress: 0,
        },
      })
    }
  }

  // ============================================================
  // PROJETO 3: INDUSTRIAL GAMA
  // ============================================================
  const proj3 = await prisma.project.upsert({
    where: { code: 'OBR-0003' },
    update: {},
    create: {
      code: 'OBR-0003',
      name: 'Galpão Industrial Gama',
      client: 'Indústria Gama Ltda',
      clientPhone: '(19) 3333-7777',
      address: 'Rod. Anhanguera, KM 120',
      city: 'Campinas',
      state: 'SP',
      description: 'Construção de galpão industrial com 5.000m² para armazenagem.',
      status: 'CONCLUIDA',
      startDate: new Date('2023-03-01'),
      endDate: new Date('2024-02-28'),
      actualEndDate: new Date('2024-03-15'),
      totalBudget: 1200000,
      responsibleId: gestor.id,
    },
  })

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: proj3.id, userId: gestor.id } },
    update: {},
    create: { projectId: proj3.id, userId: gestor.id, role: 'RESPONSAVEL' },
  })

  const proj3Stages = [
    { name: 'Terraplenagem', code: 'TERR3', order: 1, status: 'CONCLUIDA' as const, actualProgress: 100 },
    { name: 'Fundações', code: 'FUND3', order: 2, status: 'CONCLUIDA' as const, actualProgress: 100 },
    { name: 'Estrutura metálica', code: 'META3', order: 3, status: 'CONCLUIDA' as const, actualProgress: 100 },
    { name: 'Cobertura', code: 'COB3', order: 4, status: 'CONCLUIDA' as const, actualProgress: 100 },
    { name: 'Acabamentos e entrega', code: 'ACAB3', order: 5, status: 'CONCLUIDA' as const, actualProgress: 100 },
  ]

  for (const sd of proj3Stages) {
    const existing = await prisma.stage.findFirst({
      where: { projectId: proj3.id, code: sd.code },
    })
    if (!existing) {
      await prisma.stage.create({
        data: {
          projectId: proj3.id,
          name: sd.name,
          code: sd.code,
          order: sd.order,
          status: sd.status,
          actualProgress: sd.actualProgress,
          plannedProgress: 100,
          actualEndDate: new Date('2024-03-10'),
        },
      })
    }
  }

  // Notifications
  const notifs = [
    {
      userId: gestor.id,
      projectId: proj1.id,
      title: 'Etapa atrasada',
      message: 'A etapa "Instalações Elétricas" está próxima do prazo previsto com 60% de execução.',
      type: 'ETAPA_ATRASADA' as const,
      entityType: 'Stage',
      url: `/obras/${proj1.id}/etapas`,
    },
    {
      userId: gestor.id,
      projectId: proj1.id,
      title: 'Nova atividade atribuída',
      message: 'Você tem uma nova atividade: "Aprovar projeto elétrico".',
      type: 'NOVA_ATIVIDADE' as const,
      entityType: 'Task',
      url: `/obras/${proj1.id}/atividades`,
    },
    {
      userId: admin.id,
      projectId: proj1.id,
      title: 'Medição enviada para aprovação',
      message: 'A medição #3 do Residencial Alpha foi enviada para aprovação.',
      type: 'MEDICAO_PENDENTE' as const,
      entityType: 'Measurement',
      url: `/obras/${proj1.id}/medicoes`,
    },
  ]

  for (const n of notifs) {
    const existing = await prisma.notification.findFirst({
      where: { userId: n.userId, title: n.title },
    })
    if (!existing) {
      await prisma.notification.create({ data: n })
    }
  }

  console.log('✅ Notificações criadas')
  console.log('')
  console.log('🎉 Seed concluído com sucesso!')
  console.log('')
  console.log('📋 Credenciais de acesso:')
  console.log('  Admin:        admin@obracontrol.com.br / Admin@123')
  console.log('  Gestor:       gestor@obracontrol.com.br / Gestor@123')
  console.log('  Responsável:  responsavel@obracontrol.com.br / Resp@123')
  console.log('  Cliente:      cliente@obracontrol.com.br / Cliente@123')
  console.log('')
  console.log('🏗️  Obras de demonstração:')
  console.log('  OBR-0001 - Residencial Alpha (Em andamento)')
  console.log('  OBR-0002 - Comercial Beta (Planejamento)')
  console.log('  OBR-0003 - Galpão Industrial Gama (Concluída)')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
