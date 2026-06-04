import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const HISTORICO_APURACAO = 'Transferência de saldo para Apuração do Resultado do Exercício'
const HISTORICO_LUCRO = 'Transferência do saldo referente ao Lucro apurado no Exercício'
const HISTORICO_PREJUIZO = 'Transferência do saldo referente ao Prejuízo apurado no Exercício'

function calcularSaldoResultado(debitos, creditos, tipoConta) {
  if (tipoConta === 'RECEITA') {
    return creditos - debitos
  }

  if (['DESPESA', 'CUSTO'].includes(tipoConta)) {
    return debitos - creditos
  }

  return 0
}

function adicionarLancamento(lista, { valor, tipo, contaId, empresaId, usuarioId }) {
  if (Math.abs(Number(valor)) < 0.01) return

  lista.push({
    valor: Number(valor),
    tipo,
    contaId,
    empresaId,
    usuarioId,
  })
}

function somarLancamentos(lancamentos, tipo) {
  return lancamentos
    .filter(l => l.tipo === tipo)
    .reduce((acc, l) => acc + Number(l.valor), 0)
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
      { erro: 'Apenas administradores podem apurar o resultado!' },
      { status: 403 }
    )
  }

  if (!body.inicio || !body.fim) {
    return NextResponse.json(
      { erro: 'Informe o período da apuração.' },
      { status: 400 }
    )
  }

  const inicioData = new Date(`${body.inicio}T00:00:00`)
  const fimData = new Date(`${body.fim}T23:59:59.999`)
  const dataApuracao = fimData

  if (Number.isNaN(inicioData.getTime()) || Number.isNaN(fimData.getTime())) {
    return NextResponse.json(
      { erro: 'Período inválido.' },
      { status: 400 }
    )
  }

  const contas = await prisma.conta.findMany({
    where: { empresaId: id },
  })

  const contaApuracao = contas.find(c => c.codigo === '7.1')
  const contaLucros = contas.find(c => c.codigo === '3.2')
  const contaPrejuizos = contas.find(c => c.codigo === '3.3')

  if (!contaApuracao || !contaLucros || !contaPrejuizos) {
    return NextResponse.json(
      { erro: 'Contas base de apuração, lucros ou prejuízos não encontradas!' },
      { status: 400 }
    )
  }

  const lancamentosPeriodo = await prisma.lancamento.findMany({
    where: {
      empresaId: id,
      lote: {
        data: {
          gte: inicioData,
          lte: fimData,
        },
      },
      conta: {
        tipo: {
          in: ['RECEITA', 'DESPESA', 'CUSTO'],
        },
      },
    },
    include: {
      conta: true,
    },
  })

  const saldosPorConta = {}

  for (const lancamento of lancamentosPeriodo) {
    const conta = lancamento.conta

    if (!saldosPorConta[conta.id]) {
      saldosPorConta[conta.id] = {
        conta,
        debitos: 0,
        creditos: 0,
      }
    }

    if (lancamento.tipo === 'DEBITO') {
      saldosPorConta[conta.id].debitos += Number(lancamento.valor)
    }

    if (lancamento.tipo === 'CREDITO') {
      saldosPorConta[conta.id].creditos += Number(lancamento.valor)
    }
  }

  const contasComSaldo = Object.values(saldosPorConta)
    .map(({ conta, debitos, creditos }) => {
      const saldo = calcularSaldoResultado(debitos, creditos, conta.tipo)

      return {
        conta,
        saldo,
      }
    })
    .filter(item => Math.abs(item.saldo) >= 0.01)

  const receitasComSaldo = contasComSaldo.filter(item => item.conta.tipo === 'RECEITA')
  const despesasCustosComSaldo = contasComSaldo.filter(item => {
    return ['DESPESA', 'CUSTO'].includes(item.conta.tipo)
  })

  if (receitasComSaldo.length === 0 && despesasCustosComSaldo.length === 0) {
    return NextResponse.json(
      { erro: 'Não há saldo de receitas, despesas ou custos para apurar. As contas já podem estar zeradas.' },
      { status: 400 }
    )
  }

  const lancamentosReceitas = []
  const lancamentosDespesasCustos = []

  let creditosNaApuracao = 0
  let debitosNaApuracao = 0

  for (const { conta, saldo } of receitasComSaldo) {
    const valor = Math.abs(saldo)

    if (saldo > 0) {
      adicionarLancamento(lancamentosReceitas, {
        valor,
        tipo: 'DEBITO',
        contaId: conta.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      adicionarLancamento(lancamentosReceitas, {
        valor,
        tipo: 'CREDITO',
        contaId: contaApuracao.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      creditosNaApuracao += valor
    } else {
      adicionarLancamento(lancamentosReceitas, {
        valor,
        tipo: 'CREDITO',
        contaId: conta.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      adicionarLancamento(lancamentosReceitas, {
        valor,
        tipo: 'DEBITO',
        contaId: contaApuracao.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      debitosNaApuracao += valor
    }
  }

  for (const { conta, saldo } of despesasCustosComSaldo) {
    const valor = Math.abs(saldo)

    if (saldo > 0) {
      adicionarLancamento(lancamentosDespesasCustos, {
        valor,
        tipo: 'DEBITO',
        contaId: contaApuracao.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      adicionarLancamento(lancamentosDespesasCustos, {
        valor,
        tipo: 'CREDITO',
        contaId: conta.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      debitosNaApuracao += valor
    } else {
      adicionarLancamento(lancamentosDespesasCustos, {
        valor,
        tipo: 'CREDITO',
        contaId: contaApuracao.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      adicionarLancamento(lancamentosDespesasCustos, {
        valor,
        tipo: 'DEBITO',
        contaId: conta.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      creditosNaApuracao += valor
    }
  }

  const saldoFinalApuracao = creditosNaApuracao - debitosNaApuracao
  const valorResultado = Math.abs(saldoFinalApuracao)

  const lancamentosResultado = []

  if (valorResultado >= 0.01) {
    if (saldoFinalApuracao > 0) {
      adicionarLancamento(lancamentosResultado, {
        valor: valorResultado,
        tipo: 'DEBITO',
        contaId: contaApuracao.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      adicionarLancamento(lancamentosResultado, {
        valor: valorResultado,
        tipo: 'CREDITO',
        contaId: contaLucros.id,
        empresaId: id,
        usuarioId: session.user.id,
      })
    } else {
      adicionarLancamento(lancamentosResultado, {
        valor: valorResultado,
        tipo: 'DEBITO',
        contaId: contaPrejuizos.id,
        empresaId: id,
        usuarioId: session.user.id,
      })

      adicionarLancamento(lancamentosResultado, {
        valor: valorResultado,
        tipo: 'CREDITO',
        contaId: contaApuracao.id,
        empresaId: id,
        usuarioId: session.user.id,
      })
    }
  }

  const totalDebitos =
    somarLancamentos(lancamentosReceitas, 'DEBITO') +
    somarLancamentos(lancamentosDespesasCustos, 'DEBITO') +
    somarLancamentos(lancamentosResultado, 'DEBITO')

  const totalCreditos =
    somarLancamentos(lancamentosReceitas, 'CREDITO') +
    somarLancamentos(lancamentosDespesasCustos, 'CREDITO') +
    somarLancamentos(lancamentosResultado, 'CREDITO')

  if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
    return NextResponse.json(
      {
        erro: `Apuração inconsistente. Débitos R$ ${totalDebitos.toFixed(2)} e créditos R$ ${totalCreditos.toFixed(2)} não conferem.`,
      },
      { status: 400 }
    )
  }

  try {
    await prisma.$transaction(async tx => {
      if (lancamentosReceitas.length > 0) {
        await tx.lote.create({
          data: {
            historico: HISTORICO_APURACAO,
            data: dataApuracao,
            empresaId: id,
            usuarioId: session.user.id,
            lancamentos: {
              create: lancamentosReceitas,
            },
          },
        })
      }

      if (lancamentosDespesasCustos.length > 0) {
        await tx.lote.create({
          data: {
            historico: HISTORICO_APURACAO,
            data: dataApuracao,
            empresaId: id,
            usuarioId: session.user.id,
            lancamentos: {
              create: lancamentosDespesasCustos,
            },
          },
        })
      }

      if (lancamentosResultado.length > 0) {
        await tx.lote.create({
          data: {
            historico: saldoFinalApuracao >= 0 ? HISTORICO_LUCRO : HISTORICO_PREJUIZO,
            data: dataApuracao,
            empresaId: id,
            usuarioId: session.user.id,
            lancamentos: {
              create: lancamentosResultado,
            },
          },
        })
      }
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    return NextResponse.json({
      mensagem: saldoFinalApuracao > 0
        ? `Resultado apurado! Lucro de R$ ${valorResultado.toFixed(2)} transferido para Lucros Acumulados.`
        : saldoFinalApuracao < 0
          ? `Resultado apurado! Prejuízo de R$ ${valorResultado.toFixed(2)} transferido para Prejuízos Acumulados.`
          : 'Resultado apurado! Não houve lucro nem prejuízo no período.',
      resultado: saldoFinalApuracao,
    })
  } catch (error) {
    console.error('Erro ao apurar resultado:', error)

    return NextResponse.json(
      { erro: 'Erro ao apurar resultado.' },
      { status: 500 }
    )
  }
}