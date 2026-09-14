import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number().int() })).min(1),
})

export async function PATCH(req: NextRequest, { params }: { params: { stageId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR', 'RESPONSAVEL'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { items } = reorderSchema.parse(body)

    const services = await prisma.service.findMany({
      where: { id: { in: items.map((i) => i.id) }, stageId: params.stageId, deletedAt: null },
      select: { id: true },
    })
    if (services.length !== items.length) {
      return NextResponse.json({ error: 'Algum subtópico não pertence a esta etapa' }, { status: 400 })
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.service.update({ where: { id: item.id }, data: { order: item.order } })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[PATCH /api/stages/:stageId/services/reorder]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
