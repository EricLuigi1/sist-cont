import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import BotaoImprimir from '@/components/BotaoImprimir'
import FiltroPeriodo from '@/components/FiltroPeriodo'
import { formatarMoeda } from '@/lib/formatacao'

export default async function BalancoPage({ params, searchParams }) {
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
    include: { conta: true },
  })

  function calcularSaldo(tipo, tipoLancamento) {
    return lancamentos
      .filter(l => l.conta.tipo === tipo && l.tipo === tipoLancamento)
      .reduce((acc, l) => acc + Number(l.valor), 0)
  }

  function agruparPorConta(tipo, tipoLancamento) {
    const grupos = {}
    lancamentos
      .filter(l => l.conta.tipo === tipo && l.tipo === tipoLancamento)
      .forEach(l => {
        if (!grupos[l.contaId]) {
          grupos[l.contaId] = { conta: l.conta, total: 0 }
        }
        grupos[l.contaId].total += Number(l.valor)
      })
    return Object.values(grupos).sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))
  }

  const totalAtivo = calcularSaldo('ATIVO', 'DEBITO')
  const totalPassivo = calcularSaldo('PASSIVO', 'CREDITO')
  const totalPL = calcularSaldo('PATRIMONIO_LIQUIDO', 'CREDITO')
  const totalPassivoMaisPL = totalPassivo + totalPL

  const ativosPorConta = agruparPorConta('ATIVO', 'DEBITO')
  const passivosPorConta = agruparPorConta('PASSIVO', 'CREDITO')
  const plPorConta = agruparPorConta('PATRIMONIO_LIQUIDO', 'CREDITO')

  const fmt = d => new Date(d.getTime() + d.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR')
  const periodoLabel = `${fmt(inicioData)} até ${fmt(fimData)}`

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Balanço Patrimonial</h1>
          <p className="text-gray-500 text-sm">Posição do período</p>
        </div>
        <BotaoImprimir />
      </div>
      <FiltroPeriodo />
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white p-4">
          <h2 className="font-bold text-center">BALANÇO PATRIMONIAL</h2>
          <p className="text-center text-gray-400 text-sm">{periodoLabel}</p>
        </div>
        <div className="grid grid-cols-2 divide-x">
          <div className="p-4">
            <div className="flex justify-between font-semibold text-blue-700 bg-blue-50 px-3 py-2 rounded mb-2">
              <span>ATIVO</span>
              <span>R$ {formatarMoeda(totalAtivo)}</span>
            </div>
            {ativosPorConta.map(({ conta, total }) => (
              <div key={conta.id} className="flex justify-between text-sm px-3 py-2 border-b">
                <span className="text-gray-600">{conta.codigo} - {conta.nome}</span>
                <span>R$ {formatarMoeda(total)}</span>
              </div>
            ))}
            {ativosPorConta.length === 0 && (
              <p className="text-sm text-gray-400 px-3 py-2">Nenhum ativo registrado</p>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between font-semibold text-red-700 bg-red-50 px-3 py-2 rounded mb-2">
              <span>PASSIVO</span>
              <span>R$ {formatarMoeda(totalPassivo)}</span>
            </div>
            {passivosPorConta.map(({ conta, total }) => (
              <div key={conta.id} className="flex justify-between text-sm px-3 py-2 border-b">
                <span className="text-gray-600">{conta.codigo} - {conta.nome}</span>
                <span>R$ {formatarMoeda(total)}</span>
              </div>
            ))}
            {passivosPorConta.length === 0 && (
              <p className="text-sm text-gray-400 px-3 py-2">Nenhum passivo registrado</p>
            )}
            <div className="flex justify-between font-semibold text-purple-700 bg-purple-50 px-3 py-2 rounded mb-2 mt-4">
              <span>PATRIMÔNIO LÍQUIDO</span>
              <span>R$ {formatarMoeda(totalPL)}</span>
            </div>
            {plPorConta.map(({ conta, total }) => (
              <div key={conta.id} className="flex justify-between text-sm px-3 py-2 border-b">
                <span className="text-gray-600">{conta.codigo} - {conta.nome}</span>
                <span>R$ {formatarMoeda(total)}</span>
              </div>
            ))}
            {plPorConta.length === 0 && (
              <p className="text-sm text-gray-400 px-3 py-2">Nenhum PL registrado</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x border-t">
          <div className={`flex justify-between font-bold px-7 py-3 ${totalAtivo === totalPassivoMaisPL ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span>TOTAL ATIVO</span>
            <span>R$ {formatarMoeda(totalAtivo)}</span>
          </div>
          <div className={`flex justify-between font-bold px-7 py-3 ${totalAtivo === totalPassivoMaisPL ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span>TOTAL P + PL</span>
            <span>R$ {formatarMoeda(totalPassivoMaisPL)}</span>
          </div>
        </div>
      </div>
      {totalAtivo !== totalPassivoMaisPL && (
        <p className="text-red-500 text-sm mt-2">⚠️ Balanço não está equilibrado! Verifique os lançamentos.</p>
      )}
    </div>
  )
}