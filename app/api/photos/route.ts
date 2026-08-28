import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    const isPrivileged = ['ADMIN', 'GESTOR'].includes(session.user.role as string)
    const where: any = { deletedAt: null }

    if (!isPrivileged) {
      where.project = { members: { some: { userId: session.user.id } } }
    }
    if (projectId) where.projectId = projectId

    const photos = await prisma.photo.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        stage: { select: { id: true, name: true } },
        file: { select: { id: true, url: true, name: true, originalName: true, mimeType: true, size: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error('[GET /api/photos]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
