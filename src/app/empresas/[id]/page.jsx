import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardAdmin from './DashboardAdmin'
import DashboardColaborador from './DashboardColaborador'

export default async function EmpresaPage({ params }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: id,
      },
    },
    include: { empresa: true },
  })

  if (!vinculo) redirect('/dashboard')

  const isAdmin = vinculo.papel === 'ADMIN'

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  const lotes = await prisma.lote.findMany({
  where: { empresaId: id },
  orderBy: { criadoEm: 'desc' },
    include: {
      lancamentos: { include: { conta: true } },
    },
  })

  const lotesDoMes = lotes.filter(l => new Date(l.data) >= inicioMes && new Date(l.data) <= fimMes)
  const lancamentosDoMes = lotesDoMes.flatMap(l => l.lancamentos)

  const totalReceitas = lancamentosDoMes.filter(l => l.conta.tipo === 'RECEITA' && l.tipo === 'CREDITO').reduce((acc, l) => acc + Number(l.valor), 0)
  const totalDespesas = lancamentosDoMes.filter(l => l.conta.tipo === 'DESPESA' && l.tipo === 'DEBITO').reduce((acc, l) => acc + Number(l.valor), 0)
  const resultado = totalReceitas - totalDespesas

  const colaboradores = await prisma.empresaUsuario.count({ where: { empresaId: id } })

  const receitasPorConta = {}
  lancamentosDoMes.filter(l => l.conta.tipo === 'RECEITA' && l.tipo === 'CREDITO').forEach(l => {
    if (!receitasPorConta[l.conta.nome]) receitasPorConta[l.conta.nome] = 0
    receitasPorConta[l.conta.nome] += Number(l.valor)
  })

  const despesasPorConta = {}
  lancamentosDoMes.filter(l => l.conta.tipo === 'DESPESA' && l.tipo === 'DEBITO').forEach(l => {
    if (!despesasPorConta[l.conta.nome]) despesasPorConta[l.conta.nome] = 0
    despesasPorConta[l.conta.nome] += Number(l.valor)
  })

  const dadosReceitas = Object.entries(receitasPorConta).map(([name, value]) => ({ name, value }))
  const dadosDespesas = Object.entries(despesasPorConta).map(([name, value]) => ({ name, value }))

  function serializarLotes(lista) {
    return lista.map(lote => ({
      ...lote,
      data: lote.data.toISOString(),
      criadoEm: lote.criadoEm.toISOString(),
      lancamentos: lote.lancamentos.map(l => ({
        ...l,
        valor: Number(l.valor),
        criadoEm: l.criadoEm.toISOString(),
      })),
    }))
  }

  const ultimos3Lotes = serializarLotes(lotes.slice(0, 3))

  const todosLotesDoUsuario = lotes.filter(l => l.usuarioId === session.user.id)
  const lotesHoje = todosLotesDoUsuario.filter(l => new Date(l.data).toDateString() === hoje.toDateString())
  const lotesDoUsuarioDoMes = todosLotesDoUsuario.filter(l => new Date(l.data) >= inicioMes)
  const ultimos3LotesDoUsuario = serializarLotes(todosLotesDoUsuario.slice(0, 3))

  const props = {
    resultado,
    totalReceitas,
    totalDespesas,
    colaboradores,
    dadosReceitas,
    dadosDespesas,
    ultimos3Lotes,
    lotesHoje: lotesHoje.length,
    lotesDoMes: lotesDoUsuarioDoMes.length,
    lotesDoUsuario: ultimos3LotesDoUsuario,
  }

  return isAdmin ? <DashboardAdmin {...props} /> : <DashboardColaborador {...props} />
}