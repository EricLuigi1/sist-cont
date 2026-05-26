import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo || vinculo.papel !== 'ADMIN') {
    return NextResponse.json({ erro: 'Apenas administradores podem apurar o resultado!' }, { status: 403 })
  }

  const inicioData = new Date(body.inicio + 'T12:00:00')
  const fimData = new Date(body.fim + 'T12:00:00')
  const dataApuracao = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 12)

  const contas = await prisma.conta.findMany({
    where: { empresaId: id },
  })

  const contaApuracao = contas.find(c => c.codigo === '7.1')
  const contaLucros = contas.find(c => c.codigo === '3.2')
  const contaPrejuizos = contas.find(c => c.codigo === '3.3')

  if (!contaApuracao || !contaLucros || !contaPrejuizos) {
    return NextResponse.json({ erro: 'Contas base não encontradas!' }, { status: 400 })
  }

  const lancamentos = await prisma.lancamento.findMany({
    where: {
      empresaId: id,
      lote: { data: { gte: inicioData, lte: fimData } },
    },
    include: { conta: true },
  })

  const receitas = lancamentos.filter(l => l.conta.tipo === 'RECEITA' && l.tipo === 'CREDITO')
  const despesas = lancamentos.filter(l => l.conta.tipo === 'DESPESA' && l.tipo === 'DEBITO')

  if (receitas.length === 0 && despesas.length === 0) {
    return NextResponse.json({ erro: 'Nenhuma receita ou despesa no período selecionado!' }, { status: 400 })
  }

  const totalReceitas = receitas.reduce((acc, l) => acc + Number(l.valor), 0)
  const totalDespesas = despesas.reduce((acc, l) => acc + Number(l.valor), 0)
  const resultado = totalReceitas - totalDespesas

  const receitasPorConta = {}
  receitas.forEach(l => {
    if (!receitasPorConta[l.contaId]) receitasPorConta[l.contaId] = 0
    receitasPorConta[l.contaId] += Number(l.valor)
  })

  const despesasPorConta = {}
  despesas.forEach(l => {
    if (!despesasPorConta[l.contaId]) despesasPorConta[l.contaId] = 0
    despesasPorConta[l.contaId] += Number(l.valor)
  })

  // receitas -> apuração
  if (totalReceitas > 0) {
    await prisma.lote.create({
      data: {
        historico: 'Transferência de saldo para Apuração do Resultado do Exercício',
        data: dataApuracao,
        empresaId: id,
        usuarioId: session.user.id,
        lancamentos: {
          create: [
            ...Object.entries(receitasPorConta).map(([contaId, valor]) => ({
              valor,
              tipo: 'DEBITO',
              contaId,
              empresaId: id,
              usuarioId: session.user.id,
            })),
            {
              valor: totalReceitas,
              tipo: 'CREDITO',
              contaId: contaApuracao.id,
              empresaId: id,
              usuarioId: session.user.id,
            },
          ],
        },
      },
    })
  }

  // despesa -> apuração
  if (totalDespesas > 0) {
    await prisma.lote.create({
      data: {
        historico: 'Transferência de saldo para Apuração do Resultado do Exercício',
        data: dataApuracao,
        empresaId: id,
        usuarioId: session.user.id,
        lancamentos: {
          create: [
            {
              valor: totalDespesas,
              tipo: 'DEBITO',
              contaId: contaApuracao.id,
              empresaId: id,
              usuarioId: session.user.id,
            },
            ...Object.entries(despesasPorConta).map(([contaId, valor]) => ({
              valor,
              tipo: 'CREDITO',
              contaId,
              empresaId: id,
              usuarioId: session.user.id,
            })),
          ],
        },
      },
    })
  }

  // result -> lucro/preju
  const contaDestino = resultado >= 0 ? contaLucros : contaPrejuizos
  const valorAbsoluto = Math.abs(resultado)

  await prisma.lote.create({
    data: {
      historico: resultado >= 0
        ? 'Transferência do resultado para Lucros Acumulados'
        : 'Transferência do resultado para Prejuízos Acumulados',
      data: dataApuracao,
      empresaId: id,
      usuarioId: session.user.id,
      lancamentos: {
        create: resultado >= 0
          ? [
              { valor: valorAbsoluto, tipo: 'DEBITO', contaId: contaApuracao.id, empresaId: id, usuarioId: session.user.id },
              { valor: valorAbsoluto, tipo: 'CREDITO', contaId: contaDestino.id, empresaId: id, usuarioId: session.user.id },
            ]
          : [
              { valor: valorAbsoluto, tipo: 'DEBITO', contaId: contaDestino.id, empresaId: id, usuarioId: session.user.id },
              { valor: valorAbsoluto, tipo: 'CREDITO', contaId: contaApuracao.id, empresaId: id, usuarioId: session.user.id },
            ],
      },
    },
  })

  return NextResponse.json({
    mensagem: resultado >= 0
      ? `Resultado apurado! Lucro de R$ ${resultado.toFixed(2)} transferido para Lucros Acumulados.`
      : `Resultado apurado! Prejuízo de R$ ${Math.abs(resultado).toFixed(2)} transferido para Prejuízos Acumulados.`,
    resultado,
  })
}