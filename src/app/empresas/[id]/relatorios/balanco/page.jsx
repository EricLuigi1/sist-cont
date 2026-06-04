import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import BotaoImprimir from '@/components/BotaoImprimir'
import FiltroPeriodo from '@/components/FiltroPeriodo'
import { formatarMoeda } from '@/lib/formatacao'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/alert'
import {
  ReportDocument,
  ReportDocumentHeader,
  ReportPdfHeader,
} from '@/components/financial/ReportDocument'
import { cn } from '@/lib/utils'

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
  const inicioData = inicio
    ? new Date(`${inicio}T00:00:00`)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0)

  const fimData = fim
    ? new Date(`${fim}T23:59:59.999`)
    : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999)


  const lancamentosPatrimoniais = await prisma.lancamento.findMany({
    where: {
      empresaId: id,
      lote: {
        data: {
          lte: fimData,
        },
      },
      conta: {
        tipo: {
          in: ['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO'],
        },
      },
    },
    include: { conta: true },
  })

  /*
    Estes lançamentos não entram diretamente no Balanço.
    Eles servem apenas para avisar o usuário caso o balanço não esteja equilibrado
    e ainda exista resultado do período que talvez precise ser apurado para o PL.
  */
  const lancamentosResultadoPeriodo = await prisma.lancamento.findMany({
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
    include: { conta: true },
  })

  function calcularResultadoPeriodo() {
    return lancamentosResultadoPeriodo.reduce((acc, lancamento) => {
      const valor = Number(lancamento.valor)

      if (lancamento.conta.tipo === 'RECEITA') {
        return acc + (lancamento.tipo === 'CREDITO' ? valor : -valor)
      }

      if (['DESPESA', 'CUSTO'].includes(lancamento.conta.tipo)) {
        return acc - (lancamento.tipo === 'DEBITO' ? valor : -valor)
      }

      return acc
    }, 0)
  }

  const resultadoPeriodo = calcularResultadoPeriodo()

  const saldosPorConta = {}

  for (const lancamento of lancamentosPatrimoniais) {
    const { conta } = lancamento

    if (!saldosPorConta[conta.id]) {
      saldosPorConta[conta.id] = { conta, debitos: 0, creditos: 0 }
    }

    if (lancamento.tipo === 'DEBITO') {
      saldosPorConta[conta.id].debitos += Number(lancamento.valor)
    } else {
      saldosPorConta[conta.id].creditos += Number(lancamento.valor)
    }
  }

  const contasComSaldo = Object.values(saldosPorConta)
    .map(({ conta, debitos, creditos }) => {
      const naturezaDevedora = conta.tipo === 'ATIVO'
      const saldo = naturezaDevedora ? debitos - creditos : creditos - debitos

      return { conta, saldo }
    })
    .filter(conta => Math.abs(conta.saldo) >= 0.01)

  const ativos = contasComSaldo
    .filter(c => c.conta.tipo === 'ATIVO')
    .sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))

  const passivos = contasComSaldo
    .filter(c => c.conta.tipo === 'PASSIVO')
    .sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))

  const pl = contasComSaldo
    .filter(c => c.conta.tipo === 'PATRIMONIO_LIQUIDO')
    .sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))

  const totalAtivo = ativos.reduce((acc, c) => acc + c.saldo, 0)
  const totalPassivo = passivos.reduce((acc, c) => acc + c.saldo, 0)
  const totalPL = pl.reduce((acc, c) => acc + c.saldo, 0)
  const totalPassivoMaisPL = totalPassivo + totalPL
  const diferencaBalanco = totalAtivo - totalPassivoMaisPL
  const balanceado = Math.abs(diferencaBalanco) < 0.01

  const fmt = d => new Date(d.getTime() + d.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR')
  const periodoSelecionado = `${fmt(inicioData)} até ${fmt(fimData)}`
  const periodoLabel = `Posição em ${fmt(fimData)}`
  const fmtValor = v => `R$ ${formatarMoeda(v)}`

  function ColunaContas({ titulo, contas, total, headerClass }) {
    return (
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'flex items-center justify-between gap-4 px-4 py-3 text-sm font-semibold print:bg-transparent print:text-black',
            headerClass
          )}
        >
          <span>{titulo}</span>
          <span className="financial-amount">{fmtValor(total)}</span>
        </div>

        <div className="flex-1 px-4 py-2">
          {contas.length === 0 ? (
            <p className="py-4 text-sm text-zinc-500 print:text-black">
              Nenhuma conta com saldo
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-200 print:divide-black/20">
              {contas.map(({ conta, saldo }) => (
                <div key={conta.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <span className="min-w-0 flex-1 break-words text-zinc-700 print:text-black">
                    {conta.codigo} - {conta.nome}
                  </span>

                  <span className={cn('shrink-0 font-medium', saldo < 0 && 'text-red-700 print:text-black')}>
                    {fmtValor(saldo)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <PageHeader
          title="Balanço Patrimonial"
          description="Posição patrimonial acumulada até a data final selecionada"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <FiltroPeriodo />
          <BotaoImprimir />
        </div>
      </div>

      {contasComSaldo.some(c => c.saldo < 0) && (
        <Alert variant="destructive" className="mt-4 print:hidden">
          Existem contas patrimoniais com saldo negativo. Isso pode indicar erro nos lançamentos
          ou conta com natureza inversa.
        </Alert>
      )}

      {!balanceado && Math.abs(resultadoPeriodo) >= 0.01 && (
        <Alert variant="destructive" className="mt-4 print:hidden">
          O balanço não está equilibrado e existe resultado no período selecionado
          ({periodoSelecionado}) no valor de {fmtValor(resultadoPeriodo)}.
          Se esse resultado ainda não foi apurado para o Patrimônio Líquido, o balanço pode não fechar.
        </Alert>
      )}

      <ReportDocument>
        <ReportPdfHeader
          razaoSocial={empresa?.razaoSocial ?? empresa?.nome ?? ''}
          cnpj={empresa?.cnpj ?? ''}
          geradoPor={usuarioLogado?.nome ?? ''}
          dataGeracao={dataGeracao}
        />

        <ReportDocumentHeader title="Balanço Patrimonial" period={periodoLabel} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white print:rounded-none print:border-0">
          <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0 print:divide-black/20">
            <ColunaContas
              titulo="ATIVO"
              contas={ativos}
              total={totalAtivo}
              headerClass="bg-blue-50 text-blue-900 print:bg-transparent print:text-black"
            />

            <div className="flex h-full flex-col">
              <ColunaContas
                titulo="PASSIVO"
                contas={passivos}
                total={totalPassivo}
                headerClass="bg-amber-50 text-amber-900 print:bg-transparent print:text-black"
              />

              <div className="border-t border-zinc-200 px-4 py-0 print:border-black/20">
                <div
                  className={cn(
                    'mt-4 flex items-center justify-between gap-4 px-4 py-3 text-sm font-semibold print:bg-transparent print:text-black',
                    'bg-violet-50 text-violet-900'
                  )}
                >
                  <span>PATRIMÔNIO LÍQUIDO</span>
                  <span className="financial-amount">{fmtValor(totalPL)}</span>
                </div>

                {pl.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-zinc-500 print:text-black">
                    Nenhum PL com saldo
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col divide-y divide-zinc-200 print:divide-black/20">
                    {pl.map(({ conta, saldo }) => (
                      <div key={conta.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                        <span className="min-w-0 flex-1 break-words text-zinc-700 print:text-black">
                          {conta.codigo} - {conta.nome}
                        </span>

                        <span className={cn('shrink-0 font-medium', saldo < 0 && 'text-red-700 print:text-black')}>
                          {fmtValor(saldo)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid divide-y border-t md:grid-cols-2 md:divide-x md:divide-y-0 print:divide-black/20">
            <div
              className={cn(
                'flex items-center justify-between gap-4 px-6 py-4 text-sm font-bold print:bg-transparent print:text-black',
                balanceado ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
              )}
            >
              <span>TOTAL ATIVO</span>
              <span className="financial-amount">{fmtValor(totalAtivo)}</span>
            </div>

            <div
              className={cn(
                'flex items-center justify-between gap-4 px-6 py-4 text-sm font-bold print:bg-transparent print:text-black',
                balanceado ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
              )}
            >
              <span>TOTAL P + PL</span>
              <span className="financial-amount">{fmtValor(totalPassivoMaisPL)}</span>
            </div>
          </div>

          {!balanceado && (
            <div className="border-t border-red-200 bg-red-50 px-6 py-3 text-sm font-medium text-red-900 print:hidden">
              Diferença do balanço: {fmtValor(diferencaBalanco)}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500 print:border-black print:text-black">
          Documento gerado automaticamente por PPEM Contabilidade.
        </div>

        {!balanceado && (
          <Alert variant="destructive" className="mt-4 print:hidden">
            Balanço não está equilibrado. Verifique os lançamentos e a apuração do resultado.
          </Alert>
        )}
      </ReportDocument>
    </>
  )
}
