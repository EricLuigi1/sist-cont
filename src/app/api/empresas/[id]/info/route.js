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

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      razaoSocial: true,
      cnpj: true,
      endereco: true,
      cidade: true,
      estado: true,
      codigoConvite: true,
      criadoEm: true,
    },
  })

  return NextResponse.json({ ...empresa, papel: vinculo.papel })
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
    return NextResponse.json({ erro: 'Apenas administradores podem editar a empresa!' }, { status: 403 })
  }

  if (!body.nome?.trim()) return NextResponse.json({ erro: 'Nome é obrigatório!' }, { status: 400 })
  if (!body.razaoSocial?.trim()) return NextResponse.json({ erro: 'Razão Social é obrigatória!' }, { status: 400 })
  if (!body.cnpj?.trim()) return NextResponse.json({ erro: 'CNPJ é obrigatório!' }, { status: 400 })

  const empresa = await prisma.empresa.update({
    where: { id },
    data: {
      nome: body.nome,
      razaoSocial: body.razaoSocial,
      cnpj: body.cnpj,
      endereco: body.endereco,
      cidade: body.cidade,
      estado: body.estado,
    },
  })

  return NextResponse.json({ mensagem: 'Empresa atualizada com sucesso!', empresa })
}