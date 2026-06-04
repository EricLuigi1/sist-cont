import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })
  }

  const { id } = await params

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: id,
      },
    },
    include: { empresa: true },
  })

  if (!vinculo) {
    return NextResponse.json({ erro: 'Acesso negado!' }, { status: 403 })
  }

  return NextResponse.json({
    id: vinculo.empresa.id,
    nome: vinculo.empresa.nome,
    razaoSocial: vinculo.empresa.razaoSocial,
    cnpj: vinculo.empresa.cnpj,
    logo: vinculo.empresa.logo,
    codigoConvite: vinculo.papel === 'ADMIN' ? vinculo.empresa.codigoConvite : null,
    papel: vinculo.papel,
  })
}

export async function DELETE(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })
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

  if (!vinculo) {
    return NextResponse.json({ erro: 'Empresa não encontrada ou acesso negado!' }, { status: 403 })
  }

  if (vinculo.papel !== 'ADMIN') {
    return NextResponse.json(
      { erro: 'Apenas administradores podem excluir a empresa.' },
      { status: 403 }
    )
  }

  try {
    await prisma.$transaction(async tx => {
      await tx.lancamento.deleteMany({
        where: { empresaId: id },
      })

      await tx.lote.deleteMany({
        where: { empresaId: id },
      })

      const contas = await tx.conta.findMany({
        where: { empresaId: id },
        select: { id: true, codigo: true },
        orderBy: { codigo: 'desc' },
      })

      for (const conta of contas) {
        await tx.conta.delete({
          where: { id: conta.id },
        })
      }

      await tx.empresaUsuario.deleteMany({
        where: { empresaId: id },
      })

      await tx.empresa.delete({
        where: { id },
      })
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    return NextResponse.json({ sucesso: true }, { status: 200 })
  } catch (error) {
    console.error('Erro ao excluir empresa:', error)

    return NextResponse.json(
      { erro: 'Erro ao excluir empresa.' },
      { status: 500 }
    )
  }
}