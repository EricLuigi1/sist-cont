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

  const lotes = await prisma.lote.findMany({
    where: { empresaId: id },
    orderBy: { data: 'desc' },
    include: {
      lancamentos: {
        include: { conta: true },
      },
      usuario: { select: { nome: true } },
    },
  })

  return NextResponse.json(lotes)
}

export async function POST(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo) return NextResponse.json({ erro: 'Acesso negado!' }, { status: 403 })

  // Valida se tem histórico
  if (!body.historico || body.historico.trim() === '') {
    return NextResponse.json({ erro: 'Histórico é obrigatório!' }, { status: 400 })
  }

  // Valida se tem pelo menos 1 débito e 1 crédito
  const debitos = body.lancamentos.filter(l => l.tipo === 'DEBITO')
  const creditos = body.lancamentos.filter(l => l.tipo === 'CREDITO')

  if (debitos.length === 0 || creditos.length === 0) {
    return NextResponse.json({ erro: 'É necessário pelo menos 1 débito e 1 crédito!' }, { status: 400 })
  }

  // Valida se todos têm valor
  const semValor = body.lancamentos.some(l => !l.valor || Number(l.valor) <= 0)
  if (semValor) {
    return NextResponse.json({ erro: 'Todos os lançamentos precisam ter um valor!' }, { status: 400 })
  }

  // Valida se débitos = créditos
  const totalDebitos = debitos.reduce((acc, l) => acc + Number(l.valor), 0)
  const totalCreditos = creditos.reduce((acc, l) => acc + Number(l.valor), 0)

  if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
    return NextResponse.json({ erro: `Total de débitos (R$ ${totalDebitos.toFixed(2)}) deve ser igual ao total de créditos (R$ ${totalCreditos.toFixed(2)})!` }, { status: 400 })
  }

  // Cria o lote com os lançamentos
  const lote = await prisma.lote.create({
    data: {
      historico: body.historico,
      data: new Date(body.data),
      empresaId: id,
      usuarioId: session.user.id,
      lancamentos: {
        create: body.lancamentos.map(l => ({
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
}

export async function DELETE(request, { params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const loteId = searchParams.get('loteId')

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo) return NextResponse.json({ erro: 'Acesso negado!' }, { status: 403 })

  const lote = await prisma.lote.findUnique({
    where: { id: loteId },
  })

  if (vinculo.papel !== 'ADMIN' && lote.usuarioId !== session.user.id) {
    return NextResponse.json({ erro: 'Você só pode excluir seus próprios lançamentos!' }, { status: 403 })
  }

  // Deleta os lançamentos do lote primeiro, depois o lote
  await prisma.lancamento.deleteMany({ where: { loteId } })
  await prisma.lote.delete({ where: { id: loteId } })

  return NextResponse.json({ mensagem: 'Lançamento excluído com sucesso!' })
}