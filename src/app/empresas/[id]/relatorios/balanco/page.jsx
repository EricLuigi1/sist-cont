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

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    select: { nome: true, razaoSocial: true, cnpj: true },
  })

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { nome: true },
  })

  const dataGeracao = new Date().toLocaleDateString('pt-BR')

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

  // Agrupa todos os lançamentos por conta em uma única iteração
  const saldosPorConta = {}
  for (const l of lancamentos) {
    const { conta } = l
    if (!['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO'].includes(conta.tipo)) continue

    if (!saldosPorConta[conta.id]) {
      saldosPorConta[conta.id] = { conta, debitos: 0, creditos: 0 }
    }

    if (l.tipo === 'DEBITO') {
      saldosPorConta[conta.id].debitos += Number(l.valor)
    } else {
      saldosPorConta[conta.id].creditos += Number(l.valor)
    }
  }

  // Calcula saldo final conforme natureza contábil
  const contasComSaldo = Object.values(saldosPorConta).map(({ conta, debitos, creditos }) => {
    const naturezaDevedora = conta.tipo === 'ATIVO'
    const saldo = naturezaDevedora ? debitos - creditos : creditos - debitos
    return { conta, saldo }
  }).filter(c => c.saldo !== 0)

  // Separa por grupo
  const ativos = contasComSaldo.filter(c => c.conta.tipo === 'ATIVO').sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))
  const passivos = contasComSaldo.filter(c => c.conta.tipo === 'PASSIVO').sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))
  const pl = contasComSaldo.filter(c => c.conta.tipo === 'PATRIMONIO_LIQUIDO').sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))

  const totalAtivo = ativos.reduce((acc, c) => acc + c.saldo, 0)
  const totalPassivo = passivos.reduce((acc, c) => acc + c.saldo, 0)
  const totalPL = pl.reduce((acc, c) => acc + c.saldo, 0)
  const totalPassivoMaisPL = totalPassivo + totalPL
  const balanceado = Math.abs(totalAtivo - totalPassivoMaisPL) < 0.01

  const fmt = d => new Date(d.getTime() + d.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR')
  const periodoLabel = `${fmt(inicioData)} até ${fmt(fimData)}`

  function CabecalhoPDF() {
    return (
      <div className="cabecalho-pdf mb-6 border-b pb-4 p-4">
        <h2 className="text-xl font-bold">{empresa.razaoSocial}</h2>
        <p className="text-sm text-gray-600">CNPJ: {empresa.cnpj}</p>
        <p className="text-xs text-gray-400 mt-2">Gerado por: {usuarioLogado.nome} — {dataGeracao}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">Balanço Patrimonial</h1>
          <p className="text-gray-500 text-sm">Posição do período</p>
        </div>
        <BotaoImprimir />
      </div>
      <div className="no-print">
        <FiltroPeriodo />
        {contasComSaldo.some(c => c.saldo < 0) && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm px-4 py-3 rounded mb-4 no-print">
            ⚠️ Existem contas com saldo negativo. Isso pode indicar erro nos lançamentos.
          </div>
        )}
      </div>
      <div id="relatorio-print" className="border rounded-lg overflow-hidden">
        <CabecalhoPDF />
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
            {ativos.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-2">Nenhum ativo registrado</p>
            ) : (
              ativos.map(({ conta, saldo }) => (
                <div key={conta.id} className="flex justify-between text-sm px-3 py-2 border-b">
                  <span className="text-gray-600">{conta.codigo} - {conta.nome}</span>
                  <span className={saldo < 0 ? 'text-red-600' : ''}>R$ {formatarMoeda(saldo)}</span>
                </div>
              ))
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between font-semibold text-red-700 bg-red-50 px-3 py-2 rounded mb-2">
              <span>PASSIVO</span>
              <span>R$ {formatarMoeda(totalPassivo)}</span>
            </div>
            {passivos.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-2">Nenhum passivo registrado</p>
            ) : (
              passivos.map(({ conta, saldo }) => (
                <div key={conta.id} className="flex justify-between text-sm px-3 py-2 border-b">
                  <span className="text-gray-600">{conta.codigo} - {conta.nome}</span>
                  <span className={saldo < 0 ? 'text-red-600' : ''}>R$ {formatarMoeda(saldo)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between font-semibold text-purple-700 bg-purple-50 px-3 py-2 rounded mb-2 mt-4">
              <span>PATRIMÔNIO LÍQUIDO</span>
              <span>R$ {formatarMoeda(totalPL)}</span>
            </div>
            {pl.length === 0 ? (
              <p className="text-sm text-gray-400 px-3 py-2">Nenhum PL registrado</p>
            ) : (
              pl.map(({ conta, saldo }) => (
                <div key={conta.id} className="flex justify-between text-sm px-3 py-2 border-b">
                  <span className="text-gray-600">{conta.codigo} - {conta.nome}</span>
                  <span className={saldo < 0 ? 'text-red-600' : ''}>R$ {formatarMoeda(saldo)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x border-t">
          <div className={`flex justify-between font-bold px-7 py-3 ${balanceado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span>TOTAL ATIVO</span>
            <span>R$ {formatarMoeda(totalAtivo)}</span>
          </div>
          <div className={`flex justify-between font-bold px-7 py-3 ${balanceado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span>TOTAL P + PL</span>
            <span>R$ {formatarMoeda(totalPassivoMaisPL)}</span>
          </div>
        </div>
      </div>
      {!balanceado && (
        <p className="text-red-500 text-sm mt-2 no-print">⚠️ Balanço não está equilibrado! Verifique os lançamentos.</p>
      )}
    </div>
  )
}