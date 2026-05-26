import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import BotaoImprimir from '@/components/BotaoImprimir'
import FiltroPeriodo from '@/components/FiltroPeriodo'
import { formatarMoeda } from '@/lib/formatacao'

export default async function DREPage({ params, searchParams }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const { inicio, fim } = await searchParams

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo) redirect('/dashboard')

  const hoje = new Date()
  const inicioData = inicio ? new Date(inicio + 'T12:00:00') : new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12)
  const fimData = fim ? new Date(fim + 'T12:00:00') : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 12)

  const lancamentos = await prisma.lancamento.findMany({
    where: {
      empresaId: id,
      lote: { data: { gte: inicioData, lte: fimData } },
    },
    include: { conta: true, lote: true },
  })

  const receitas = lancamentos.filter(l => l.conta.tipo === 'RECEITA' && l.tipo === 'CREDITO')
  const despesas = lancamentos.filter(l => l.conta.tipo === 'DESPESA' && l.tipo === 'DEBITO')

  const totalReceitas = receitas.reduce((acc, l) => acc + Number(l.valor), 0)
  const totalDespesas = despesas.reduce((acc, l) => acc + Number(l.valor), 0)
  const resultado = totalReceitas - totalDespesas

  function agruparPorConta(lista) {
    const grupos = {}
    lista.forEach(l => {
      if (!grupos[l.contaId]) {
        grupos[l.contaId] = { conta: l.conta, total: 0 }
      }
      grupos[l.contaId].total += Number(l.valor)
    })
    return Object.values(grupos).sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))
  }

  const receitasPorConta = agruparPorConta(receitas)
  const despesasPorConta = agruparPorConta(despesas)

  const fmt = d => new Date(d.getTime() + d.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR')
  const periodoLabel = `${fmt(inicioData)} até ${fmt(fimData)}`

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">DRE</h1>
          <p className="text-gray-500 text-sm">Demonstração do Resultado do Exercício</p>
        </div>
        <BotaoImprimir />
      </div>
      <FiltroPeriodo />
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white p-4">
          <h2 className="font-bold text-center">DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</h2>
          <p className="text-center text-gray-400 text-sm">{periodoLabel}</p>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between font-semibold text-green-700 bg-green-50 px-3 py-2 rounded">
              <span>RECEITAS</span>
              <span>R$ {formatarMoeda(totalReceitas)}</span>
            </div>
            {receitasPorConta.map(({ conta, total }) => (
              <div key={conta.id} className="flex justify-between text-sm px-3 py-2 border-b">
                <span className="text-gray-600">{conta.codigo} - {conta.nome}</span>
                <span className="text-green-600">R$ {formatarMoeda(total)}</span>
              </div>
            ))}
            {receitasPorConta.length === 0 && (
              <p className="text-sm text-gray-400 px-3 py-2">Nenhuma receita no período</p>
            )}
          </div>
          <div className="mb-4">
            <div className="flex justify-between font-semibold text-red-700 bg-red-50 px-3 py-2 rounded">
              <span>DESPESAS</span>
              <span>R$ {formatarMoeda(totalDespesas)}</span>
            </div>
            {despesasPorConta.map(({ conta, total }) => (
              <div key={conta.id} className="flex justify-between text-sm px-3 py-2 border-b">
                <span className="text-gray-600">{conta.codigo} - {conta.nome}</span>
                <span className="text-red-600">R$ {formatarMoeda(total)}</span>
              </div>
            ))}
            {despesasPorConta.length === 0 && (
              <p className="text-sm text-gray-400 px-3 py-2">Nenhuma despesa no período</p>
            )}
          </div>
          <div className={`flex justify-between font-bold text-lg px-3 py-3 rounded ${resultado >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span>{resultado >= 0 ? 'LUCRO DO PERÍODO' : 'PREJUÍZO DO PERÍODO'}</span>
            <span>R$ {formatarMoeda(Math.abs(resultado))}</span>
          </div>
        </div>
      </div>
    </div>
  )
}