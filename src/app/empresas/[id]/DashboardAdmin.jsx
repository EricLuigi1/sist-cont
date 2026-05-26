'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import BotaoApuracao from '@/components/BotaoApuracao'
import { formatarMoeda } from '@/lib/formatacao'

const CORES_RECEITAS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0']
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
      <div className="grid grid-cols-2 gap-4">
        <div className={`border rounded-lg p-6 ${resultado >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm text-gray-500 mb-1">{resultado >= 0 ? 'Lucro do mês' : 'Prejuízo do mês'}</p>
          <p className={`text-3xl font-bold ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {resultado >= 0 ? '+' : '-'}R$ {formatarMoeda(Math.abs(resultado))}
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Colaboradores</p>
          <p className="text-3xl font-bold">{colaboradores}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-green-700 mb-2">Receitas por Conta</h2>
          {dadosReceitas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma receita no mês</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
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
              <p className="text-center text-sm font-medium text-green-600 mt-2">
                Total: R$ {formatarMoeda(totalReceitas)}
              </p>
            </>
          )}
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-red-700 mb-2">Despesas por Conta</h2>
          {dadosDespesas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma despesa no mês</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
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
              <p className="text-center text-sm font-medium text-red-600 mt-2">
                Total: R$ {formatarMoeda(totalDespesas)}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Últimos lançamentos</h2>
        {ultimos3Lotes.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum lançamento ainda</p>
        ) : (
          <div className="flex flex-col gap-2">
            {ultimos3Lotes.map(lote => {
              const total = lote.lancamentos.filter(l => l.tipo === 'CREDITO').reduce((acc, l) => acc + Number(l.valor), 0)
              return (
                <div key={lote.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{lote.historico}</p>
                    <p className="text-gray-400 text-xs">{new Date(lote.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-green-600 font-medium">R$ {formatarMoeda(total)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}