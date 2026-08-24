# ObraControl

Sistema profissional de gestão, acompanhamento e controle de obras.

## 🏗️ Sobre

O **ObraControl** é um sistema SaaS completo para construtoras e profissionais da construção civil gerenciarem obras, etapas, serviços, custos, documentos, equipes e muito mais — tudo em um único painel.

## ✨ Funcionalidades

- **Multi-obras**: Gerencie múltiplas obras simultaneamente
- **Dashboard analítico**: KPIs, gráficos e indicadores em tempo real
- **Etapas e serviços**: Controle granular do progresso físico
- **Cronograma Gantt**: Visualização temporal das etapas
- **Módulo financeiro**: Orçamento, despesas e medições
- **Documentos**: Upload com controle de versão
- **Fotos**: Galeria categorizada por etapa
- **Atividades**: Kanban e lista de tarefas
- **Ocorrências**: Registro e acompanhamento de problemas
- **Fornecedores**: Cadastro e relacionamento com obras
- **Auditoria**: Log completo de alterações
- **Notificações**: Alertas de prazo, orçamento e pendências
- **Exportação**: PDF, Excel e CSV
- **Dark mode**: Interface adaptável

## 🚀 Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Banco de dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: Auth.js v5 (NextAuth)
- **Gráficos**: Recharts

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (ou Docker)
- npm ou yarn

## 🐳 Instalação com Docker (Recomendado)

A forma mais simples de executar o sistema é com Docker:

```bash
# 1. Clone e entre no diretório
cd Obra-Acompanhamento

# 2. Copie o arquivo de ambiente
cp .env.example .env

# 3. Inicie o banco de dados
docker compose up -d postgres

# 4. Aguarde o banco iniciar (10-15 segundos) e execute:
npm install
npx prisma migrate dev --name init
npm run db:seed

# 5. Inicie a aplicação
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 💻 Instalação Manual

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/obracontrol"
AUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./public/uploads"
```

### 3. Configurar o banco de dados

```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar migrations
npx prisma migrate dev --name init

# Popular banco com dados de demonstração
npm run db:seed
```

### 4. Executar

```bash
npm run dev
```

## 🔑 Credenciais de Demonstração

Após executar o seed, use as seguintes credenciais:

| Perfil | Email | Senha |
|--------|-------|-------|
| Administrador | admin@obracontrol.com.br | Admin@123 |
| Gestor | gestor@obracontrol.com.br | Gestor@123 |
| Responsável | responsavel@obracontrol.com.br | Resp@123 |
| Cliente | cliente@obracontrol.com.br | Cliente@123 |

## 🏢 Dados de Demonstração

O seed cria automaticamente:

- **3 obras**: Residencial Alpha (em andamento), Comercial Beta (planejamento), Galpão Industrial Gama (concluído)
- **8 etapas** com progresso variado
- **Serviços** por etapa
- **9 despesas** de diferentes categorias
- **3 fornecedores**
- **5 atividades**
- **3 ocorrências**
- **3 medições**

## 📁 Estrutura do Projeto

```
├── app/
│   ├── (auth)/          # Páginas de autenticação
│   ├── (dashboard)/     # Páginas do sistema
│   └── api/             # API Routes
├── components/
│   ├── ui/              # Componentes base (shadcn-style)
│   ├── common/          # Componentes reutilizáveis
│   ├── layout/          # Sidebar, Header
│   ├── obras/           # Componentes de obras
│   └── dashboard/       # Componentes do dashboard
├── lib/
│   ├── auth.ts          # Configuração Auth.js
│   ├── prisma.ts        # Cliente Prisma
│   ├── utils.ts         # Utilitários
│   └── constants.ts     # Constantes e mapas de status
├── prisma/
│   ├── schema.prisma    # Schema do banco
│   └── seed.ts          # Dados de demonstração
├── types/               # Tipos TypeScript
└── public/
    └── uploads/         # Arquivos enviados
```

## 🗄️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Banco de dados
npm run db:generate     # Gerar cliente Prisma
npm run db:migrate      # Executar migrations
npm run db:seed         # Popular banco
npm run db:studio       # Interface visual do banco
npm run db:reset        # Reset completo + seed

# Build para produção
npm run build
npm run start
```

## 🔐 Perfis de Acesso

| Perfil | Permissões |
|--------|-----------|
| **Admin** | Acesso total, gerencia usuários e obras |
| **Gestor** | Cria e gerencia obras, etapas e financeiro |
| **Responsável** | Atualiza etapas, registra atividades |
| **Visualizador** | Apenas visualiza informações |

## 🐋 Docker Compose Completo

```bash
# Iniciar tudo (app + banco)
docker compose up

# Apenas o banco (para desenvolvimento local)
docker compose up -d postgres

# Parar
docker compose down

# Reset completo (apaga dados!)
docker compose down -v
```

## 🚀 Deploy

Para deploy em produção:

1. Configure as variáveis de ambiente em produção
2. Execute `npm run build`
3. Execute `npx prisma migrate deploy`
4. Execute `npm run start`

## 🆘 Suporte

Para problemas ou dúvidas, abra uma issue no repositório.

---

Desenvolvido com ❤️ usando Next.js, Prisma e PostgreSQL.
