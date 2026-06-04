import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const { id, pedidoId } = await params

  const vinculoAdmin = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: id,
      },
    },
  })

  if (!vinculoAdmin || vinculoAdmin.papel !== 'ADMIN') {
    return NextResponse.json(
      { erro: 'Apenas administradores podem recusar pedidos.' },
      { status: 403 }
    )
  }

  const pedido = await prisma.pedidoEmpresa.findUnique({
    where: { id: pedidoId },
  })

  if (!pedido || pedido.empresaId !== id || pedido.status !== 'PENDENTE') {
    return NextResponse.json(
      { erro: 'Pedido não encontrado.' },
      { status: 404 }
    )
  }

  await prisma.pedidoEmpresa.update({
    where: { id: pedidoId },
    data: { status: 'RECUSADO' },
  })

  return NextResponse.json({ sucesso: true })
}