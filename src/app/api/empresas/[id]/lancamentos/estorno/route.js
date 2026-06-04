import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const motivosLabel = {
  ERRO: 'Erro',
  OMISSAO: 'Omissão',
  DUPLICIDADE: 'Duplicidade',
  CANCELAMENTO: 'Cancelamento',
}

function limparTexto(valor) {
  return String(valor || '').trim()
}

function criarData(valor) {
  const texto = limparTexto(valor)

  if (!texto) {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 12)
  }

  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(`${texto}T12:00:00`)
    : new Date(texto)

  if (Number.isNaN(data.getTime())) return null

  return data
}

export async function POST(request, { params }) {
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

  const loteId = limparTexto(body.loteId)
  const motivo = limparTexto(body.motivo).toUpperCase()
  const observacao = limparTexto(body.observacao)
  const dataEstorno = criarData(body.data)

  if (!loteId) {
    return NextResponse.json(
      { erro: 'Lançamento não informado.' },
      { status: 400 }
    )
  }

  if (!motivosLabel[motivo]) {
    return NextResponse.json(
      { erro: 'Motivo de estorno inválido.' },
      { status: 400 }
    )
  }

  if (observacao.length > 180) {
    return NextResponse.json(
      { erro: 'A observação deve ter no máximo 180 caracteres.' },
      { status: 400 }
    )
  }

  if (!dataEstorno) {
    return NextResponse.json(
      { erro: 'Informe uma data de estorno válida.' },
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

  if (!vinculo) {
    return NextResponse.json(
      { erro: 'Acesso negado!' },
      { status: 403 }
    )
  }

  const loteOriginal = await prisma.lote.findFirst({
    where: {
      id: loteId,
      empresaId: id,
    },
    include: {
      lancamentos: {
        select: {
          valor: true,
          tipo: true,
          contaId: true,
        },
      },
    },
  })

  if (!loteOriginal) {
    return NextResponse.json(
      { erro: 'Lançamento não encontrado!' },
      { status: 404 }
    )
  }

  if (loteOriginal.historico.startsWith('Estorno')) {
    return NextResponse.json(
      { erro: 'Não é possível estornar um lançamento de estorno.' },
      { status: 400 }
    )
  }

  if (loteOriginal.lancamentos.length === 0) {
    return NextResponse.json(
      { erro: 'Este lote não possui lançamentos para estornar.' },
      { status: 400 }
    )
  }

  if (vinculo.papel !== 'ADMIN' && loteOriginal.usuarioId !== session.user.id) {
    return NextResponse.json(
      { erro: 'Você só pode estornar seus próprios lançamentos!' },
      { status: 403 }
    )
  }

  const estornoExistente = await prisma.lote.findFirst({
    where: {
      empresaId: id,
      OR: [
        {
          historico: {
            startsWith: 'Estorno',
            contains: loteOriginal.id,
          },
        },
        {
          historico: {
            startsWith: 'Estorno',
            contains: loteOriginal.historico,
          },
        },
      ],
    },
  })

  if (estornoExistente) {
    return NextResponse.json(
      { erro: 'Este lançamento já foi estornado!' },
      { status: 400 }
    )
  }

  const motivoLabel = motivosLabel[motivo]
 const historico = `Estorno por ${motivoLabel}: ${loteOriginal.historico}${observacao ? ` - ${observacao}` : ''}`

  try {
    const loteEstorno = await prisma.$transaction(async tx => {
      return tx.lote.create({
        data: {
          historico,
          data: dataEstorno,
          empresaId: id,
          usuarioId: session.user.id,
          lancamentos: {
            create: loteOriginal.lancamentos.map(lancamento => ({
              valor: lancamento.valor,
              tipo: lancamento.tipo === 'DEBITO' ? 'CREDITO' : 'DEBITO',
              contaId: lancamento.contaId,
              empresaId: id,
              usuarioId: session.user.id,
            })),
          },
        },
      })
    })

    return NextResponse.json({
      mensagem: 'Estorno realizado com sucesso!',
      loteId: loteEstorno.id,
    })
  } catch (error) {
    console.error('Erro ao realizar estorno:', error)

    return NextResponse.json(
      { erro: 'Erro ao realizar estorno.' },
      { status: 500 }
    )
  }
}