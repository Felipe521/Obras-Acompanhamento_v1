import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createOccurrenceSchema = z.object({
  projectId: z.string(),
  stageId: z.string().optional().nullable(),
  title: z.string().min(2),
  description: z.string().min(5),
  category: z.enum(['SEGURANCA', 'MATERIAL', 'MAO_DE_OBRA', 'PROJETO', 'FINANCEIRO', 'PRAZO', 'QUALIDADE', 'OUTROS']),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']).default('MEDIA'),
  date: z.string(),
  responsibleId: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')

    const isPrivileged = ['ADMIN', 'GESTOR'].includes(session.user.role as string)
    const where: any = { deletedAt: null }

    if (!isPrivileged) {
      where.project = { members: { some: { userId: session.user.id } } }
    }
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (priority) where.priority = priority
    if (category) where.category = category

    const occurrences = await prisma.occurrence.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        stage: { select: { id: true, name: true } },
        responsible: { select: { id: true, name: true } },
        _count: { select: { photos: true, comments: true } },
      },
      orderBy: [{ priority: 'desc' }, { date: 'desc' }],
      take: 100,
    })

    return NextResponse.json(occurrences)
  } catch (error) {
    console.error('[GET /api/occurrences]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = createOccurrenceSchema.parse(body)

    const occurrence = await prisma.occurrence.create({
      data: {
        ...data,
        date: new Date(data.date),
        responsibleId: data.responsibleId || (session.user.id as string),
      },
    })

    return NextResponse.json(occurrence, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[POST /api/occurrences]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
