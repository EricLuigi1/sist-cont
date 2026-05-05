import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const codigosRaiz = {
  ATIVO: '1',
  PASSIVO: '2',
  PATRIMONIO_LIQUIDO: '3',
  RECEITA: '4',
  DESPESA: '5',
}

async function gerarCodigo(empresaId, contaPaiId, tipo) {
  if (!contaPaiId) {
    return codigosRaiz[tipo]
  }

  const pai = await prisma.conta.findUnique({
    where: { id: contaPaiId },
    include: { filhas: true },
  })

  if (!pai) return null

  const nivel = pai.codigo.split('.').length + 1
  const totalFilhas = pai.filhas.length

  if (nivel === 2) {
    return `${pai.codigo}.${totalFilhas + 1}`
  } else {
    const numero = String(totalFilhas + 1).padStart(2, '0')
    return `${pai.codigo}.${numero}`
  }
}

export async function GET(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo) return NextResponse.json({ erro: 'Acesso negado!' }, { status: 403 })

  const contas = await prisma.conta.findMany({
    where: { empresaId: id },
    orderBy: { codigo: 'asc' },
    include: { filhas: true },
  })

  return NextResponse.json(contas)
}

export async function POST(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo || vinculo.papel !== 'ADMIN') {
    return NextResponse.json({ erro: 'Apenas administradores podem criar contas!' }, { status: 403 })
  }

  const codigo = await gerarCodigo(id, body.contaPaiId || null, body.tipo)

  if (!codigo) {
    return NextResponse.json({ erro: 'Conta pai não encontrada!' }, { status: 400 })
  }

  const conta = await prisma.conta.create({
    data: {
      codigo,
      nome: body.nome,
      tipo: body.tipo,
      empresaId: id,
      contaPaiId: body.contaPaiId || null,
    },
  })

  return NextResponse.json(conta, { status: 201 })
}

export async function PUT(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo || vinculo.papel !== 'ADMIN') {
    return NextResponse.json({ erro: 'Apenas administradores podem editar contas!' }, { status: 403 })
  }

  const conta = await prisma.conta.update({
    where: { id: body.id },
    data: { nome: body.nome },
  })

  return NextResponse.json(conta)
}

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const contaId = searchParams.get('contaId')

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo || vinculo.papel !== 'ADMIN') {
    return NextResponse.json({ erro: 'Apenas administradores podem excluir contas!' }, { status: 403 })
  }

  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    include: { filhas: true, lancamentos: true },
  })

  if (conta.filhas.length > 0) {
    return NextResponse.json({ erro: 'Não é possível excluir uma conta que possui subcontas!' }, { status: 400 })
  }

  if (conta.lancamentos.length > 0) {
    return NextResponse.json({ erro: 'Não é possível excluir uma conta que possui lançamentos!' }, { status: 400 })
  }

  await prisma.conta.delete({ where: { id: contaId } })

  return NextResponse.json({ mensagem: 'Conta excluída com sucesso!' })
}