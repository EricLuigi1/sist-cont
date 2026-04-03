import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })
  }

  const body = await request.json()

  const empresa = await prisma.empresa.create({
    data: {
      nome: body.nome,
      razaoSocial: body.razaoSocial,
      cnpj: body.cnpj,
      endereco: body.endereco,
      cidade: body.cidade,
      estado: body.estado,
      usuarios: {
        create: {
          usuarioId: session.user.id,
          papel: 'ADMIN',
        },
      },
    },
  })

  return NextResponse.json(empresa, { status: 201 })
}