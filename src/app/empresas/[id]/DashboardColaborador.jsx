'use client'

export default function DashboardColaborador({
  lotesHoje,
  lotesDoMes,
  lotesDoUsuario,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Seus lançamentos hoje</p>
          <p className="text-3xl font-bold">{lotesHoje}</p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">Seus lançamentos no mês</p>
          <p className="text-3xl font-bold">{lotesDoMes}</p>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Seus últimos lançamentos</h2>
        {lotesDoUsuario.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum lançamento ainda</p>
        ) : (
          <div className="flex flex-col gap-2">
            {lotesDoUsuario.map(lote => {
              const total = lote.lancamentos.filter(l => l.tipo === 'CREDITO').reduce((acc, l) => acc + Number(l.valor), 0)
              return (
                <div key={lote.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{lote.historico}</p>
                    <p className="text-gray-400 text-xs">{new Date(lote.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className="text-green-600 font-medium">R$ {total.toFixed(2)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}