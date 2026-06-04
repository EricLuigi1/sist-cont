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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export default async function FluxoCaixaPage({ params, searchParams }) {
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
    ? new Date(`${inicio}T12:00:00`)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12)

  const fimData = fim
    ? new Date(`${fim}T12:00:00`)
    : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 12)

  /*
    O fluxo abaixo mantém a mesma regra que seu sistema já usava:
    contas do ATIVO debitadas são entradas e contas do ATIVO creditadas são saídas.

    Importante: para um fluxo de caixa 100% contábil, o ideal no futuro é marcar quais
    contas do ativo representam Caixa/Bancos/Equivalentes de Caixa. Sem esse campo,
    o relatório trabalha com as contas de ATIVO como base.
  */

  const lancamentosAntesDoPeriodo = await prisma.lancamento.findMany({
    where: {
      empresaId: id,
      lote: {
        data: {
          lt: inicioData,
        },
      },
      conta: {
        tipo: 'ATIVO',
      },
    },
    include: {
      conta: true,
    },
  })

  const saldoInicial = lancamentosAntesDoPeriodo.reduce((acc, lancamento) => {
    const valor = Number(lancamento.valor)

    if (lancamento.tipo === 'DEBITO') return acc + valor
    if (lancamento.tipo === 'CREDITO') return acc - valor

    return acc
  }, 0)

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

  const fmt = d => new Date(d.getTime() + d.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR')
  const periodoLabel = `${fmt(inicioData)} até ${fmt(fimData)}`
  const fmtValor = v => `R$ ${formatarMoeda(v)}`

  let saldoAcumulado = saldoInicial

  const rows = lotes
    .map(lote => {
      const entradas = lote.lancamentos
        .filter(l => l.conta.tipo === 'ATIVO' && l.tipo === 'DEBITO')
        .reduce((acc, l) => acc + Number(l.valor), 0)

      const saidas = lote.lancamentos
        .filter(l => l.conta.tipo === 'ATIVO' && l.tipo === 'CREDITO')
        .reduce((acc, l) => acc + Number(l.valor), 0)

      const movimentacao = entradas - saidas

      saldoAcumulado += movimentacao

      return {
        lote,
        entradas,
        saidas,
        movimentacao,
        saldo: saldoAcumulado,
      }
    })
    .filter(row => Math.abs(row.entradas) >= 0.01 || Math.abs(row.saidas) >= 0.01)

  const totalEntradas = rows.reduce((acc, row) => acc + row.entradas, 0)
  const totalSaidas = rows.reduce((acc, row) => acc + row.saidas, 0)
  const saldoFinal = saldoInicial + totalEntradas - totalSaidas

  return (
    <>
      <div className="space-y-4">
        <PageHeader
          title="Fluxo de Caixa"
          description="Entradas, saídas e saldo acumulado do período"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <FiltroPeriodo />
          <BotaoImprimir />
        </div>

        <Alert className="print:hidden">
          Este relatório considera movimentações em contas do Ativo como base do fluxo.
          Para maior precisão, o ideal é separar contas de Caixa/Bancos no plano de contas.
        </Alert>
      </div>

      <ReportDocument>
        <ReportPdfHeader
          razaoSocial={empresa?.razaoSocial ?? empresa?.nome ?? ''}
          cnpj={empresa?.cnpj ?? ''}
          geradoPor={usuarioLogado?.nome ?? ''}
          dataGeracao={dataGeracao}
        />

        <ReportDocumentHeader title="Fluxo de Caixa" period={periodoLabel} />

        <div className="grid gap-3 border-b border-zinc-200 p-4 sm:grid-cols-4 print:border-black/20">
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 print:rounded-none print:border-black/20">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 print:text-black">
              Saldo inicial
            </p>
            <p className={cn('mt-1 financial-amount text-sm font-bold', saldoInicial < 0 && 'text-red-700 print:text-black')}>
              {fmtValor(saldoInicial)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 print:rounded-none print:border-black/20">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 print:text-black">
              Entradas
            </p>
            <p className="mt-1 financial-amount text-sm font-bold text-emerald-700 print:text-black">
              {fmtValor(totalEntradas)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 print:rounded-none print:border-black/20">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 print:text-black">
              Saídas
            </p>
            <p className="mt-1 financial-amount text-sm font-bold text-red-700 print:text-black">
              {fmtValor(totalSaidas)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 print:rounded-none print:border-black/20">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 print:text-black">
              Saldo final
            </p>
            <p className={cn('mt-1 financial-amount text-sm font-bold', saldoFinal < 0 && 'text-red-700 print:text-black')}>
              {fmtValor(saldoFinal)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white print:rounded-none print:border-0">
          <Table className="w-full border-collapse text-[12px] print:text-[11px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent print:hover:bg-transparent">
                <TableHead className="py-3 font-semibold text-zinc-700 print:border-b print:border-black print:text-black">
                  Data
                </TableHead>
                <TableHead className="py-3 font-semibold text-zinc-700 print:border-b print:border-black print:text-black">
                  Histórico
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-zinc-700 print:border-b print:border-black print:text-black">
                  Entradas
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-zinc-700 print:border-b print:border-black print:text-black">
                  Saídas
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-zinc-700 print:border-b print:border-black print:text-black">
                  Movimentação
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-zinc-700 print:border-b print:border-black print:text-black">
                  Saldo
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent print:hover:bg-transparent">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-500 print:text-black">
                    Nenhuma movimentação no período.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ lote, entradas, saidas, movimentacao, saldo }) => (
                  <TableRow
                    key={lote.id}
                    className="hover:bg-transparent print:break-inside-avoid print:hover:bg-transparent"
                  >
                    <TableCell className="py-3 text-zinc-600 print:text-black">
                      {fmt(new Date(lote.data))}
                    </TableCell>

                    <TableCell className="max-w-[280px] whitespace-normal break-words py-3 font-medium text-zinc-900 print:text-black">
                      {lote.historico}
                    </TableCell>

                    <TableCell className="py-3 text-right text-emerald-700 print:text-black">
                      {entradas > 0 ? fmtValor(entradas) : '-'}
                    </TableCell>

                    <TableCell className="py-3 text-right text-red-700 print:text-black">
                      {saidas > 0 ? fmtValor(saidas) : '-'}
                    </TableCell>

                    <TableCell
                      className={cn(
                        'py-3 text-right font-medium',
                        movimentacao >= 0 ? 'text-emerald-700' : 'text-red-700',
                        'print:text-black'
                      )}
                    >
                      {fmtValor(movimentacao)}
                    </TableCell>

                    <TableCell
                      className={cn(
                        'py-3 text-right font-semibold',
                        saldo >= 0 ? 'text-emerald-700' : 'text-red-700',
                        'print:text-black'
                      )}
                    >
                      {fmtValor(saldo)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow
                className={cn(
                  'border-t font-bold hover:bg-transparent print:bg-transparent print:text-black',
                  saldoFinal >= 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
                )}
              >
                <TableCell colSpan={2} className="py-3">
                  Totais do período
                </TableCell>
                <TableCell className="py-3 text-right">
                  {fmtValor(totalEntradas)}
                </TableCell>
                <TableCell className="py-3 text-right">
                  {fmtValor(totalSaidas)}
                </TableCell>
                <TableCell className="py-3 text-right">
                  {fmtValor(totalEntradas - totalSaidas)}
                </TableCell>
                <TableCell className="py-3 text-right">
                  {fmtValor(saldoFinal)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500 print:border-black print:text-black">
          Documento gerado automaticamente por PPEM Contabilidade.
        </div>
      </ReportDocument>
    </>
  )
}
