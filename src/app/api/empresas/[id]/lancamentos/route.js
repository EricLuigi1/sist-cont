import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

function limparTexto(valor) {
  return String(valor || '').trim()
}

function normalizarValor(valor) {
  if (typeof valor === 'number') return valor

  const texto = String(valor || '').trim()

  if (texto.includes(',')) {
    return Number(texto.replace(/\./g, '').replace(',', '.'))
  }

  return Number(texto)
}

function criarData(valor) {
  const texto = String(valor || '').trim()

  if (!texto) return null

  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(`${texto}T12:00:00`)
    : new Date(texto)

  if (Number.isNaN(data.getTime())) return null

  return data
}

function formatarValor(valor) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
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

 const lotes = await prisma.lote.findMany({
    where: { empresaId: id },
    orderBy: { criadoEm: 'desc' },
    include: {
      lancamentos: { include: { conta: true } },
      usuario: { select: { nome: true } },
    },
  })

  return NextResponse.json(lotes)
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

  const historico = limparTexto(body.historico)
  const dataLancamento = criarData(body.data)

  if (!historico) {
    return NextResponse.json(
      { erro: 'Histórico é obrigatório!' },
      { status: 400 }
    )
  }

  if (historico.length > 255) {
    return NextResponse.json(
      { erro: 'O histórico deve ter no máximo 255 caracteres.' },
      { status: 400 }
    )
  }

  if (!dataLancamento) {
    return NextResponse.json(
      { erro: 'Informe uma data válida.' },
      { status: 400 }
    )
  }

  if (!Array.isArray(body.lancamentos) || body.lancamentos.length < 2) {
    return NextResponse.json(
      { erro: 'Informe pelo menos dois lançamentos.' },
      { status: 400 }
    )
  }

  const tiposValidos = ['DEBITO', 'CREDITO']

  const lancamentosValidados = body.lancamentos.map((lancamento, index) => {
    const contaId = limparTexto(lancamento.contaId)
    const tipo = limparTexto(lancamento.tipo).toUpperCase()
    const valor = normalizarValor(lancamento.valor)

    return {
      index,
      contaId,
      tipo,
      valor,
    }
  })

  const lancamentoSemConta = lancamentosValidados.find(l => !l.contaId)

  if (lancamentoSemConta) {
    return NextResponse.json(
      { erro: `O lançamento ${lancamentoSemConta.index + 1} está sem conta.` },
      { status: 400 }
    )
  }

  const lancamentoTipoInvalido = lancamentosValidados.find(l => !tiposValidos.includes(l.tipo))

  if (lancamentoTipoInvalido) {
    return NextResponse.json(
      { erro: `O lançamento ${lancamentoTipoInvalido.index + 1} possui tipo inválido.` },
      { status: 400 }
    )
  }

  const lancamentoValorInvalido = lancamentosValidados.find(l => {
    return !Number.isFinite(l.valor) || l.valor <= 0
  })

  if (lancamentoValorInvalido) {
    return NextResponse.json(
      { erro: `O lançamento ${lancamentoValorInvalido.index + 1} precisa ter um valor maior que zero.` },
      { status: 400 }
    )
  }

  const debitos = lancamentosValidados.filter(l => l.tipo === 'DEBITO')
  const creditos = lancamentosValidados.filter(l => l.tipo === 'CREDITO')

  if (debitos.length === 0 || creditos.length === 0) {
    return NextResponse.json(
      { erro: 'É necessário pelo menos 1 débito e 1 crédito!' },
      { status: 400 }
    )
  }

  const totalDebitos = debitos.reduce((acc, l) => acc + l.valor, 0)
  const totalCreditos = creditos.reduce((acc, l) => acc + l.valor, 0)

  if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
    return NextResponse.json(
      {
        erro: `Total de débitos (R$ ${formatarValor(totalDebitos)}) deve ser igual ao total de créditos (R$ ${formatarValor(totalCreditos)})!`,
      },
      { status: 400 }
    )
  }

  const contasIds = [...new Set(lancamentosValidados.map(l => l.contaId))]

  const contas = await prisma.conta.findMany({
    where: {
      id: {
        in: contasIds,
      },
      empresaId: id,
    },
  })

  if (contas.length !== contasIds.length) {
    return NextResponse.json(
      { erro: 'Uma ou mais contas informadas não existem ou não pertencem a esta empresa.' },
      { status: 400 }
    )
  }

  const contaSintetica = contas.find(c => !c.analitica)

  if (contaSintetica) {
    return NextResponse.json(
      {
        erro: `A conta "${contaSintetica.codigo} - ${contaSintetica.nome}" é sintética e não aceita lançamentos!`,
      },
      { status: 400 }
    )
  }

  try {
    const lote = await prisma.lote.create({
      data: {
        historico,
        data: dataLancamento,
        empresaId: id,
        usuarioId: session.user.id,
        lancamentos: {
          create: lancamentosValidados.map(l => ({
            valor: l.valor,
            tipo: l.tipo,
            contaId: l.contaId,
            empresaId: id,
            usuarioId: session.user.id,
          })),
        },
      },
    })

    return NextResponse.json(lote, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar lançamento:', error)

    return NextResponse.json(
      { erro: 'Erro ao criar lançamento.' },
      { status: 500 }
    )
  }
}