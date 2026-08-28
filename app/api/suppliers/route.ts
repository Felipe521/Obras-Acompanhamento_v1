import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSupplierSchema = z.object({
  companyName: z.string().min(2),
  tradeName: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  contact: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    const where: any = { deletedAt: null, active: true }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
        { contact: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) where.category = category

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { expenses: true, projects: true } },
      },
      orderBy: { companyName: 'asc' },
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('[GET /api/suppliers]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['ADMIN', 'GESTOR'].includes(session.user.role as string)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const data = createSupplierSchema.parse(body)

    if (data.cnpj) {
      const existing = await prisma.supplier.findUnique({ where: { cnpj: data.cnpj } })
      if (existing) {
        return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 400 })
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        companyName: data.companyName,
        tradeName: data.tradeName || null,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        contact: data.contact || null,
        category: data.category || null,
        notes: data.notes || null,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    console.error('[POST /api/suppliers]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
