import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const codigosRaiz = {
  ATIVO: '1',
  PASSIVO: '2',
  PATRIMONIO_LIQUIDO: '3',
  RECEITA: '4',
  DESPESA: '5',
  CUSTO: '6',
  RESULTADO: '7',
}

const tiposDevedores = ['ATIVO', 'DESPESA', 'CUSTO']

const naturezasPermitidasPorTipo = {
  RECEITA: [
    'RECEITA_BRUTA',
    'RECEITA_FINANCEIRA',
    'RECEITA_OPERACIONAL_OUTRAS',
    'OUTRAS_RECEITAS',
  ],
  DESPESA: [
    'DEDUCAO',
    'DESPESA_VENDAS',
    'DESPESA_FINANCEIRA',
    'DESPESA_ADMINISTRATIVA',
    'DESPESA_OUTRAS',
    'OUTRAS_DESPESAS',
  ],
  CUSTO: [
    'CUSTO_OPERACIONAL',
  ],
}

function limparTexto(valor) {
  return String(valor || '').trim()
}

function calcularSaldoPorTipo(tipo, debitos, creditos) {
  if (tiposDevedores.includes(tipo)) {
    return debitos - creditos
  }

  return creditos - debitos
}

async function gerarCodigo(empresaId, contaPaiId, tipo) {
  if (!contaPaiId) {
    return codigosRaiz[tipo]
  }

  const pai = await prisma.conta.findFirst({
    where: {
      id: contaPaiId,
      empresaId,
    },
    include: {
      filhas: true,
    },
  })

  if (!pai) return null

  const nivel = pai.codigo.split('.').length + 1
  const totalFilhas = pai.filhas.length

  if (nivel === 2) {
    return `${pai.codigo}.${totalFilhas + 1}`
  }

  const numero = String(totalFilhas + 1).padStart(2, '0')
  return `${pai.codigo}.${numero}`
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

  const contas = await prisma.conta.findMany({
    where: {
      empresaId: id,
    },
    orderBy: {
      codigo: 'asc',
    },
    include: {
      filhas: true,
      lancamentos: {
        select: {
          valor: true,
          tipo: true,
        },
      },
    },
  })

  const contasComMovimentoDireto = contas.map(conta => {
    const debitosDiretos = conta.lancamentos
      .filter(lancamento => lancamento.tipo === 'DEBITO')
      .reduce((acc, lancamento) => acc + Number(lancamento.valor), 0)

    const creditosDiretos = conta.lancamentos
      .filter(lancamento => lancamento.tipo === 'CREDITO')
      .reduce((acc, lancamento) => acc + Number(lancamento.valor), 0)

    const saldoDireto = calcularSaldoPorTipo(conta.tipo, debitosDiretos, creditosDiretos)

    return {
      ...conta,
      debitosDiretos,
      creditosDiretos,
      saldoDireto,
    }
  })

  const contasComSaldo = contasComMovimentoDireto.map(conta => {
    const contasDoGrupo = contasComMovimentoDireto.filter(possivelFilha => {
      return (
        possivelFilha.codigo === conta.codigo ||
        possivelFilha.codigo.startsWith(`${conta.codigo}.`)
      )
    })

    const debitos = contasDoGrupo.reduce((acc, item) => acc + item.debitosDiretos, 0)
    const creditos = contasDoGrupo.reduce((acc, item) => acc + item.creditosDiretos, 0)
    const saldo = contasDoGrupo.reduce((acc, item) => acc + item.saldoDireto, 0)

    return {
      ...conta,
      debitos,
      creditos,
      saldo,
      lancamentos: undefined,
    }
  })

  return NextResponse.json(contasComSaldo)
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

  if (!vinculo || vinculo.papel !== 'ADMIN') {
    return NextResponse.json(
      { erro: 'Apenas administradores podem criar contas!' },
      { status: 403 }
    )
  }

  const nome = limparTexto(body.nome)
  const tipo = limparTexto(body.tipo).toUpperCase()
  const contaPaiId = body.contaPaiId || null
  const analitica = Boolean(body.analitica)
  const naturezaDRE = body.naturezaDRE || null

  if (!nome) {
    return NextResponse.json(
      { erro: 'Nome da conta é obrigatório.' },
      { status: 400 }
    )
  }

  if (nome.length < 3) {
    return NextResponse.json(
      { erro: 'O nome da conta deve ter pelo menos 3 caracteres.' },
      { status: 400 }
    )
  }

  if (nome.length > 120) {
    return NextResponse.json(
      { erro: 'O nome da conta deve ter no máximo 120 caracteres.' },
      { status: 400 }
    )
  }

  if (!codigosRaiz[tipo]) {
    return NextResponse.json(
      { erro: 'Tipo de conta inválido.' },
      { status: 400 }
    )
  }

  if (!contaPaiId) {
    return NextResponse.json(
      { erro: 'Selecione uma conta pai para cadastrar a nova conta.' },
      { status: 400 }
    )
  }

  const contaPai = await prisma.conta.findFirst({
    where: {
      id: contaPaiId,
      empresaId: id,
    },
  })

  if (!contaPai) {
    return NextResponse.json(
      { erro: 'Conta pai não encontrada!' },
      { status: 400 }
    )
  }

  if (contaPai.tipo !== tipo) {
    return NextResponse.json(
      { erro: 'A conta pai precisa ser do mesmo tipo da nova conta.' },
      { status: 400 }
    )
  }

  if (contaPai.analitica) {
    return NextResponse.json(
      { erro: 'Não é possível criar subconta dentro de uma conta analítica.' },
      { status: 400 }
    )
  }

  const naturezasPermitidas = naturezasPermitidasPorTipo[tipo] || []

  if (analitica && naturezasPermitidas.length > 0 && !naturezaDRE) {
    return NextResponse.json(
      { erro: 'Selecione a natureza DRE para essa conta analítica.' },
      { status: 400 }
    )
  }

  if (naturezaDRE && !naturezasPermitidas.includes(naturezaDRE)) {
    return NextResponse.json(
      { erro: 'A natureza DRE selecionada não combina com o tipo da conta.' },
      { status: 400 }
    )
  }

  const codigo = await gerarCodigo(id, contaPaiId, tipo)

  if (!codigo) {
    return NextResponse.json(
      { erro: 'Não foi possível gerar o código da conta.' },
      { status: 400 }
    )
  }

  const conta = await prisma.conta.create({
    data: {
      codigo,
      nome,
      tipo,
      analitica,
      naturezaDRE: analitica ? naturezaDRE : null,
      empresaId: id,
      contaPaiId,
    },
  })

  return NextResponse.json(conta, { status: 201 })
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
      { erro: 'Apenas administradores podem editar contas!' },
      { status: 403 }
    )
  }

  const contaId = limparTexto(body.id)
  const nome = limparTexto(body.nome)

  if (!contaId) {
    return NextResponse.json(
      { erro: 'Conta não informada.' },
      { status: 400 }
    )
  }

  if (!nome) {
    return NextResponse.json(
      { erro: 'Nome da conta é obrigatório.' },
      { status: 400 }
    )
  }

  if (nome.length > 120) {
    return NextResponse.json(
      { erro: 'O nome da conta deve ter no máximo 120 caracteres.' },
      { status: 400 }
    )
  }

  const contaExistente = await prisma.conta.findFirst({
    where: {
      id: contaId,
      empresaId: id,
    },
    select: {
      id: true,
    },
  })

  if (!contaExistente) {
    return NextResponse.json(
      { erro: 'Conta não encontrada.' },
      { status: 404 }
    )
  }

  const conta = await prisma.conta.update({
    where: {
      id: contaId,
    },
    data: {
      nome,
    },
  })

  return NextResponse.json(conta)
}

export async function DELETE(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { erro: 'Não autorizado!' },
      { status: 401 }
    )
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const contaId = searchParams.get('contaId')

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
      { erro: 'Apenas administradores podem excluir contas!' },
      { status: 403 }
    )
  }

  if (!contaId) {
    return NextResponse.json(
      { erro: 'Conta não informada.' },
      { status: 400 }
    )
  }

  const conta = await prisma.conta.findFirst({
    where: {
      id: contaId,
      empresaId: id,
    },
    include: {
      filhas: true,
      lancamentos: true,
    },
  })

  if (!conta) {
    return NextResponse.json(
      { erro: 'Conta não encontrada.' },
      { status: 404 }
    )
  }

  if (conta.contaBase) {
    return NextResponse.json(
      { erro: 'Contas base não podem ser excluídas!' },
      { status: 400 }
    )
  }

  if (conta.filhas.length > 0) {
    return NextResponse.json(
      { erro: 'Não é possível excluir uma conta que possui subcontas!' },
      { status: 400 }
    )
  }

  if (conta.lancamentos.length > 0) {
    return NextResponse.json(
      { erro: 'Não é possível excluir uma conta que possui lançamentos!' },
      { status: 400 }
    )
  }

  await prisma.conta.delete({
    where: {
      id: contaId,
    },
  })

  return NextResponse.json({
    mensagem: 'Conta excluída com sucesso!',
  })
}