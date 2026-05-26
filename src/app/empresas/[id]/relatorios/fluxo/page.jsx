import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import BotaoImprimir from '@/components/BotaoImprimir'
import FiltroPeriodo from '@/components/FiltroPeriodo'
import { formatarMoeda } from '@/lib/formatacao'

export default async function FluxoCaixaPage({ params, searchParams }) {
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

  const lotes = await prisma.lote.findMany({
    where: {
      empresaId: id,
      data: { gte: inicioData, lte: fimData },
    },
    orderBy: { data: 'asc' },
    include: {
      lancamentos: { include: { conta: true } },
      usuario: { select: { nome: true } },
    },
  })

  let saldoAcumulado = 0
  const fmt = d => new Date(d.getTime() + d.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR')
  const periodoLabel = `${fmt(inicioData)} até ${fmt(fimData)}`

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
          <p className="text-gray-500 text-sm">Movimentações do período</p>
        </div>
        <BotaoImprimir />
      </div>
      <FiltroPeriodo />
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white p-4">
          <h2 className="font-bold text-center">FLUXO DE CAIXA</h2>
          <p className="text-center text-gray-400 text-sm">{periodoLabel}</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 text-sm">
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Histórico</th>
              <th className="p-3 text-right">Entradas</th>
              <th className="p-3 text-right">Saídas</th>
              <th className="p-3 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {lotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  Nenhuma movimentação no período.
                </td>
              </tr>
            ) : (
              lotes.map(lote => {
                const entradas = lote.lancamentos
                  .filter(l => l.conta.tipo === 'ATIVO' && l.tipo === 'DEBITO')
                  .reduce((acc, l) => acc + Number(l.valor), 0)

                const saidas = lote.lancamentos
                  .filter(l => l.conta.tipo === 'ATIVO' && l.tipo === 'CREDITO')
                  .reduce((acc, l) => acc + Number(l.valor), 0)

                saldoAcumulado += entradas - saidas

                return (
                  <tr key={lote.id} className="border-t text-sm hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{new Date(lote.data).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">{lote.historico}</td>
                    <td className="p-3 text-right text-green-600">{entradas > 0 ? `R$ ${formatarMoeda(entradas)}` : '-'}</td>
                    <td className="p-3 text-right text-red-600">{saidas > 0 ? `R$ ${formatarMoeda(saidas)}` : '-'}</td>
                    <td className={`p-3 text-right font-medium ${saldoAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {formatarMoeda(saldoAcumulado)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {lotes.length > 0 && (
            <tfoot>
              <tr className={`font-bold text-sm border-t ${saldoAcumulado >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <td colSpan={4} className="p-3">SALDO FINAL DO PERÍODO</td>
                <td className="p-3 text-right">R$ {formatarMoeda(saldoAcumulado)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}