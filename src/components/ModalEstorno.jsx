'use client'

import { useState } from 'react'

export default function ModalEstorno({ loteId, historico, onSuccess, onClose }) {
  const [motivo, setMotivo] = useState('ERRO')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const id = pathname.split('/')[2]

  async function handleEstornar() {
    setLoading(true)
    setErro('')

    const res = await fetch(`/api/empresas/${id}/lancamentos/estorno`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loteId, motivo, observacao }),
    })

    const data = await res.json()

    if (res.ok) {
      onSuccess()
    } else {
      setErro(data.erro || 'Erro ao realizar estorno!')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-1">Estornar Lançamento</h2>
        <p className="text-sm text-gray-500 mb-4">"{historico}"</p>
        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Motivo do estorno</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'ERRO', label: 'Erro', desc: 'Valores ou contas incorretos' },
              { value: 'OMISSAO', label: 'Omissão', desc: 'Lançamento não realizado' },
              { value: 'DUPLICIDADE', label: 'Duplicidade', desc: 'Lançado mais de uma vez' },
              { value: 'CANCELAMENTO', label: 'Cancelamento', desc: 'Operação cancelada' },
            ].map(op => (
              <button
                key={op.value}
                type="button"
                onClick={() => setMotivo(op.value)}
                className={`text-left p-3 rounded-lg border-2 transition-all ${motivo === op.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className={`text-sm font-medium ${motivo === op.value ? 'text-red-600' : 'text-gray-700'}`}>{op.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{op.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Observação (opcional)</label>
          <input
            type="text"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            placeholder="Descreva o motivo com mais detalhes..."
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleEstornar}
            disabled={loading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Estornando...' : 'Confirmar Estorno'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}