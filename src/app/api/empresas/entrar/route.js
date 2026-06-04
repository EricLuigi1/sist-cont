import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { erro: 'Não autorizado!' },
      { status: 401 }
    )
  }

  let body

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { erro: 'Dados inválidos.' },
      { status: 400 }
    )
  }

  const codigo = String(body.codigo || '').trim()

  if (!codigo) {
    return NextResponse.json(
      { erro: 'Informe o código de convite.' },
      { status: 400 }
    )
  }

  const empresa = await prisma.empresa.findUnique({
    where: { codigoConvite: codigo },
    select: {
      id: true,
      nome: true,
    },
  })

  if (!empresa) {
    return NextResponse.json(
      { erro: 'Código de convite inválido!' },
      { status: 404 }
    )
  }

  const vinculoExistente = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: empresa.id,
      },
    },
  })

  if (vinculoExistente) {
    return NextResponse.json(
      { erro: 'Você já faz parte dessa empresa!' },
      { status: 400 }
    )
  }

  const pedidoExistente = await prisma.pedidoEmpresa.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: empresa.id,
      },
    },
  })

  if (pedidoExistente) {
    if (pedidoExistente.status === 'PENDENTE') {
      return NextResponse.json(
        { erro: 'Você já possui um pedido pendente para essa empresa.' },
        { status: 400 }
      )
    }

    if (pedidoExistente.status === 'RECUSADO') {
      await prisma.pedidoEmpresa.update({
        where: { id: pedidoExistente.id },
        data: { status: 'PENDENTE' },
      })

      return NextResponse.json(
        {
          mensagem: 'Pedido reenviado com sucesso. Aguarde a aprovação do administrador.',
          empresaNome: empresa.nome,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { erro: 'Já existe um pedido para essa empresa.' },
      { status: 400 }
    )
  }

  await prisma.pedidoEmpresa.create({
    data: {
      usuarioId: session.user.id,
      empresaId: empresa.id,
      status: 'PENDENTE',
    },
  })

  return NextResponse.json(
    {
      mensagem: 'Pedido enviado com sucesso. Aguarde a aprovação do administrador.',
      empresaNome: empresa.nome,
    },
    { status: 201 }
  )
}