import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = await params

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: id,
      },
    },
  })

  if (!vinculo || vinculo.papel !== 'ADMIN') {
    return NextResponse.json(
      { erro: 'Apenas administradores podem ver os pedidos.' },
      { status: 403 }
    )
  }

  const pedidos = await prisma.pedidoEmpresa.findMany({
    where: {
      empresaId: id,
      status: 'PENDENTE',
    },
    orderBy: {
      criadoEm: 'desc',
    },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
    },
  })

  return NextResponse.json(pedidos)
}