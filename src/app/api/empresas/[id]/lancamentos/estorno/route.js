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

  if (!vinculo) return NextResponse.json({ erro: 'Acesso negado!' }, { status: 403 })

  const loteOriginal = await prisma.lote.findUnique({
    where: { id: body.loteId },
    include: { lancamentos: true },
  })

  if (!loteOriginal) return NextResponse.json({ erro: 'Lançamento não encontrado!' }, { status: 404 })

  if (vinculo.papel !== 'ADMIN' && loteOriginal.usuarioId !== session.user.id) {
    return NextResponse.json({ erro: 'Você só pode estornar seus próprios lançamentos!' }, { status: 403 })
  }

  const estornoExistente = await prisma.lote.findFirst({
    where: {
      empresaId: id,
      historico: {
        contains: loteOriginal.historico,
        startsWith: 'Estorno',
      },
    },
  })

  if (estornoExistente) {
    return NextResponse.json({ erro: 'Este lançamento já foi estornado!' }, { status: 400 })
  }

  const motivosLabel = {
    ERRO: 'Erro',
    OMISSAO: 'Omissão',
    DUPLICIDADE: 'Duplicidade',
    CANCELAMENTO: 'Cancelamento',
  }

  const motivoLabel = motivosLabel[body.motivo] || body.motivo
  const historico = `Estorno por ${motivoLabel}: ${loteOriginal.historico}${body.observacao ? ` — ${body.observacao}` : ''}`
  const dataEstorno = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 12)

  await prisma.lote.create({
    data: {
      historico,
      data: dataEstorno,
      empresaId: id,
      usuarioId: session.user.id,
      lancamentos: {
        create: loteOriginal.lancamentos.map(l => ({
          valor: l.valor,
          tipo: l.tipo === 'DEBITO' ? 'CREDITO' : 'DEBITO',
          contaId: l.contaId,
          empresaId: id,
          usuarioId: session.user.id,
        })),
      },
    },
  })

  return NextResponse.json({ mensagem: 'Estorno realizado com sucesso!' })
}