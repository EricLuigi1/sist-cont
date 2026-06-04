import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

function limparTexto(valor) {
  return String(valor || '').trim()
}

export async function GET(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { erro: 'Não autorizado!' },
      { status: 401 }
    )
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
    return NextResponse.json(
      { erro: 'Acesso negado!' },
      { status: 403 }
    )
  }

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

  if (!empresa) {
    return NextResponse.json(
      { erro: 'Empresa não encontrada.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ...empresa,
    papel: vinculo.papel,
  })
}

export async function PUT(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { erro: 'Não autorizado!' },
      { status: 401 }
    )
  }

  const { id } = await params

  let body

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { erro: 'Dados inválidos.' },
      { status: 400 }
    )
  }

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
      { erro: 'Apenas administradores podem editar a empresa!' },
      { status: 403 }
    )
  }

  const nome = limparTexto(body.nome)
  const razaoSocial = limparTexto(body.razaoSocial)
  const endereco = limparTexto(body.endereco)
  const cidade = limparTexto(body.cidade)
  const estado = limparTexto(body.estado).toUpperCase()

  if (!nome) {
    return NextResponse.json(
      { erro: 'Nome fantasia é obrigatório!' },
      { status: 400 }
    )
  }

  if (nome.length < 2) {
    return NextResponse.json(
      { erro: 'O nome fantasia deve ter pelo menos 2 caracteres.' },
      { status: 400 }
    )
  }

  if (nome.length > 80) {
    return NextResponse.json(
      { erro: 'O nome fantasia deve ter no máximo 80 caracteres.' },
      { status: 400 }
    )
  }

  if (!razaoSocial) {
    return NextResponse.json(
      { erro: 'Razão social é obrigatória!' },
      { status: 400 }
    )
  }

  if (razaoSocial.length > 120) {
    return NextResponse.json(
      { erro: 'A razão social deve ter no máximo 120 caracteres.' },
      { status: 400 }
    )
  }

  if (!endereco) {
    return NextResponse.json(
      { erro: 'Endereço é obrigatório!' },
      { status: 400 }
    )
  }

  if (endereco.length > 160) {
    return NextResponse.json(
      { erro: 'O endereço deve ter no máximo 160 caracteres.' },
      { status: 400 }
    )
  }

  if (!cidade) {
    return NextResponse.json(
      { erro: 'Cidade é obrigatória!' },
      { status: 400 }
    )
  }

  if (cidade.length > 80) {
    return NextResponse.json(
      { erro: 'A cidade deve ter no máximo 80 caracteres.' },
      { status: 400 }
    )
  }

  if (!estado) {
    return NextResponse.json(
      { erro: 'Estado é obrigatório!' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{2}$/.test(estado)) {
    return NextResponse.json(
      { erro: 'Informe o estado usando a sigla com 2 letras. Exemplo: SP.' },
      { status: 400 }
    )
  }

  try {
    const empresa = await prisma.empresa.update({
      where: { id },
      data: {
        nome,
        razaoSocial,
        endereco,
        cidade,
        estado,
      },
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

    return NextResponse.json({
      mensagem: 'Empresa atualizada com sucesso!',
      empresa,
    })
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)

    return NextResponse.json(
      { erro: 'Erro ao atualizar empresa.' },
      { status: 500 }
    )
  }
}