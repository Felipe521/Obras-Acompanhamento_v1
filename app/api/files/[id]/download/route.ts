import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'

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
