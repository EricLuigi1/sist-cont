import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo) return NextResponse.json({ erro: 'Acesso negado!' }, { status: 403 })

  const colaboradores = await prisma.empresaUsuario.findMany({
    where: { empresaId: id },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          criadoEm: true,
        },
      },
    },
    orderBy: { criadoEm: 'asc' },
  })

  return NextResponse.json(colaboradores)
}

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuarioId')

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo || vinculo.papel !== 'ADMIN') {
    return NextResponse.json({ erro: 'Apenas administradores podem remover colaboradores!' }, { status: 403 })
  }

  if (usuarioId === session.user.id) {
    return NextResponse.json({ erro: 'Você não pode remover a si mesmo!' }, { status: 400 })
  }

  await prisma.empresaUsuario.delete({
    where: { usuarioId_empresaId: { usuarioId, empresaId: id } },
  })

  return NextResponse.json({ mensagem: 'Colaborador removido com sucesso!' })
}