import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/msword': '.doc',
  'application/vnd.ms-excel': '.xls',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/zip': '.zip',
  'text/plain': '.txt',
  'application/octet-stream': '.dwg',
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 50MB)' }, { status: 400 })
    }

    // Validate type
    if (!ALLOWED_TYPES[file.type] && !file.name.endsWith('.dwg')) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const ext = path.extname(file.name).toLowerCase() || ALLOWED_TYPES[file.type] || ''
    const uniqueName = `${uuidv4()}${ext}`

    // Ensure uploads directory exists
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads'
    const absoluteUploadDir = path.isAbsolute(uploadDir) ? uploadDir : path.join(process.cwd(), uploadDir)
    await mkdir(absoluteUploadDir, { recursive: true })

    // Save file
    const filePath = path.join(absoluteUploadDir, uniqueName)
    await writeFile(filePath, buffer)

    // Store in database
    const uploadUrl = `/uploads/${uniqueName}`

    const savedFile = await prisma.file.create({
      data: {
        name: file.name.replace(ext, '').substring(0, 100),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        url: uploadUrl,
        uploadedById: session.user.id as string,
      },
    })

    return NextResponse.json({
      id: savedFile.id,
      name: savedFile.name,
      originalName: savedFile.originalName,
      url: savedFile.url,
      size: savedFile.size,
      mimeType: savedFile.mimeType,
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/files/upload]', error)
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 })
  }
}
