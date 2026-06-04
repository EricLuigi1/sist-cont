'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import BotaoApuracao from '@/components/BotaoApuracao'
import { formatarMoeda } from '@/lib/formatacao'
import { MetricCard } from '@/components/ui/metric-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

const CORES_RECEITAS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe']
const CORES_DESPESAS = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca']

export default function DashboardAdmin({
  resultado,
  totalReceitas,
  totalDespesas,
  colaboradores,
  dadosReceitas,
  dadosDespesas,
  ultimos3Lotes,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <BotaoApuracao />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label={resultado >= 0 ? 'Lucro do mês' : 'Prejuízo do mês'}
          value={`${resultado >= 0 ? '+' : '-'}R$ ${formatarMoeda(Math.abs(resultado))}`}
          variant={resultado >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          label="Colaboradores"
          value={colaboradores}
          hint="Membros com acesso à empresa"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-emerald-700 dark:text-emerald-400">
              Receitas por conta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {dadosReceitas.length === 0 ? (
              <EmptyState title="Nenhuma receita no mês" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={dadosReceitas} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {dadosReceitas.map((_, index) => (
                        <Cell key={index} fill={CORES_RECEITAS[index % CORES_RECEITAS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={val => `R$ ${formatarMoeda(val)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <p className="mt-3 text-center text-sm font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                  Total: R$ {formatarMoeda(totalReceitas)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-red-700 dark:text-red-400">
              Despesas por conta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {dadosDespesas.length === 0 ? (
              <EmptyState title="Nenhuma despesa no mês" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={dadosDespesas} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {dadosDespesas.map((_, index) => (
                        <Cell key={index} fill={CORES_DESPESAS[index % CORES_DESPESAS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={val => `R$ ${formatarMoeda(val)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <p className="mt-3 text-center text-sm font-medium text-red-700 dark:text-red-400 tabular-nums">
                  Total: R$ {formatarMoeda(totalDespesas)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>Últimos lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {ultimos3Lotes.length === 0 ? (
            <EmptyState title="Nenhum lançamento ainda" />
          ) : (
            <div className="divide-y">
              {ultimos3Lotes.map(lote => {
                const total = lote.lancamentos
                  .filter(l => l.tipo === 'CREDITO')
                  .reduce((acc, l) => acc + Number(l.valor), 0)
                return (
                  <div
                    key={lote.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{lote.historico}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lote.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="financial-amount shrink-0 text-emerald-700 dark:text-emerald-400">
                      R$ {formatarMoeda(total)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
