'use client'

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ReceiptText,
} from 'lucide-react'
import { formatarMoeda } from '@/lib/formatacao'
import { MetricCard } from '@/components/ui/metric-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR')
}

function calcularTotalLote(lote) {
  const totalCreditos = lote.lancamentos
    .filter(l => l.tipo === 'CREDITO')
    .reduce((acc, l) => acc + Number(l.valor), 0)

  if (totalCreditos > 0) return totalCreditos

  return lote.lancamentos
    .filter(l => l.tipo === 'DEBITO')
    .reduce((acc, l) => acc + Number(l.valor), 0)
}

export default function DashboardColaborador({
  lotesHoje = 0,
  lotesDoMes = 0,
  lotesDoUsuario = [],
}) {
  const totalMovimentado = lotesDoUsuario.reduce((acc, lote) => {
    return acc + calcularTotalLote(lote)
  }, 0)

  const ultimoLancamento = lotesDoUsuario[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Seus lançamentos hoje"
          value={lotesHoje}
          icon={CalendarDays}
        />

        <MetricCard
          label="Seus lançamentos no mês"
          value={lotesDoMes}
          icon={ReceiptText}
        />

        <MetricCard
          label="Total nos últimos lançamentos"
          value={`R$ ${formatarMoeda(totalMovimentado)}`}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden rounded-3xl border-zinc-200 bg-white shadow-sm">
          <CardHeader className="border-b border-zinc-200 bg-zinc-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold text-zinc-950">
                  Seus últimos lançamentos
                </CardTitle>
                <p className="mt-1 text-sm text-zinc-500">
                  Acompanhe os lotes criados recentemente por você.
                </p>
              </div>

              <div className="hidden size-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white sm:flex">
                <FileText className="size-5" aria-hidden />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {lotesDoUsuario.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Nenhum lançamento ainda"
                  description="Quando você criar lançamentos, eles aparecerão aqui."
                />
              </div>
            ) : (
              <div className="divide-y divide-zinc-200">
                {lotesDoUsuario.map(lote => {
                  const total = calcularTotalLote(lote)
                  const quantidadeLancamentos = lote.lancamentos.length

                  return (
                    <div
                      key={lote.id}
                      className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                            <ReceiptText className="size-4" aria-hidden />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-950">
                              {lote.historico}
                            </p>

                            <p className="mt-0.5 text-xs text-zinc-500">
                              {formatarData(lote.data)} · {quantidadeLancamentos}{' '}
                              {quantidadeLancamentos === 1 ? 'partida' : 'partidas'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                        <span className="text-xs text-zinc-500 sm:hidden">
                          Total
                        </span>

                        <span className="financial-amount shrink-0 font-semibold text-emerald-700">
                          R$ {formatarMoeda(total)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-zinc-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
              <Clock3 className="size-5" aria-hidden />
            </div>

            <h2 className="text-base font-semibold text-zinc-950">
              Resumo da atividade
            </h2>

            {ultimoLancamento ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                    Último lançamento
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-zinc-950">
                    {ultimoLancamento.historico}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatarData(ultimoLancamento.data)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-xs text-zinc-500">Hoje</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-950">
                      {lotesHoje}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-xs text-zinc-500">Mês</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-950">
                      {lotesDoMes}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Você ainda não criou lançamentos nesta empresa.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
