import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'

async function resolveFileProjectId(fileId: string): Promise<string | null> {
  const [photo, taskFile, expenseFile, measurementFile, docVersion, occPhoto] = await Promise.all([
    prisma.photo.findFirst({ where: { fileId }, select: { projectId: true } }),
    prisma.taskFile.findFirst({ where: { fileId }, select: { task: { select: { projectId: true } } } }),
    prisma.expenseFile.findFirst({ where: { fileId }, select: { expense: { select: { projectId: true } } } }),
    prisma.measurementFile.findFirst({ where: { fileId }, select: { measurement: { select: { projectId: true } } } }),
    prisma.documentVersion.findFirst({ where: { fileId }, select: { document: { select: { projectId: true } } } }),
    prisma.occurrencePhoto.findFirst({ where: { fileId }, select: { occurrence: { select: { projectId: true } } } }),
  ])

  return (
    photo?.projectId ??
    taskFile?.task.projectId ??
    expenseFile?.expense.projectId ??
    measurementFile?.measurement.projectId ??
    docVersion?.document.projectId ??
    occPhoto?.occurrence.projectId ??
    null
  )
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const file = await prisma.file.findUnique({
      where: { id: params.id },
    })

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    const isPrivileged = ['ADMIN', 'GESTOR'].includes(session.user.role as string)
    if (!isPrivileged) {
      const projectId = await resolveFileProjectId(file.id)
      const isMember = projectId
        ? await prisma.projectMember.findFirst({
            where: { projectId, userId: session.user.id as string },
          })
        : null

      if (!projectId || !isMember) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
      }
    }

    const buffer = await readFile(file.path)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': file.size.toString(),
      },
    })
  } catch (error) {
    console.error('[GET /api/files/:id/download]', error)
    return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 500 })
  }
}
