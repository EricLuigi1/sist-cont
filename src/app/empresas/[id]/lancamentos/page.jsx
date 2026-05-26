'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { formatarMoeda } from '@/lib/formatacao'
import ModalEstorno from '@/components/ModalEstorno'

export default function LancamentosPage() {
  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const [lotes, setLotes] = useState([])
  const [busca, setBusca] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [usuarioId, setUsuarioId] = useState(null)
  const [erro, setErro] = useState('')
  const [loteAberto, setLoteAberto] = useState(null)
  const [modalEstorno, setModalEstorno] = useState(null)

  function carregarLotes() {
    fetch(`/api/empresas/${id}/lancamentos`)
      .then(res => res.json())
      .then(data => setLotes(data))
  }

  useEffect(() => {
    carregarLotes()
    fetch(`/api/empresas/${id}`)
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.papel === 'ADMIN')
        setUsuarioId(data.usuarioId)
      })
  }, [id])

  const lotesFiltrados = lotes.filter(l =>
    l.historico.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div>
      {modalEstorno && (
        <ModalEstorno
          loteId={modalEstorno.id}
          historico={modalEstorno.historico}
          onSuccess={() => {
            setModalEstorno(null)
            carregarLotes()
          }}
          onClose={() => setModalEstorno(null)}
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lançamentos</h1>
        <a href={`/empresas/${id}/lancamentos/novo`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Novo Lançamento
        </a>
      </div>
      {erro && <p className="text-red-500 mb-4">{erro}</p>}
      <input
        type="text"
        placeholder="Buscar por histórico..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />
      <div className="flex flex-col gap-3">
        {lotesFiltrados.length === 0 ? (
          <p className="text-center text-gray-500 p-4">Nenhum lançamento encontrado.</p>
        ) : (
          lotesFiltrados.map(lote => {
            const totalDebitos = lote.lancamentos.filter(l => l.tipo === 'DEBITO').reduce((acc, l) => acc + Number(l.valor), 0)
            const totalCreditos = lote.lancamentos.filter(l => l.tipo === 'CREDITO').reduce((acc, l) => acc + Number(l.valor), 0)
            const isEstorno = lote.historico.startsWith('Estorno')

            return (
              <div key={lote.id} className={`border rounded-lg overflow-hidden ${isEstorno ? 'border-orange-200' : ''}`}>
                <div className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer" onClick={() => setLoteAberto(loteAberto === lote.id ? null : lote.id)}>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{new Date(lote.data).toLocaleDateString('pt-BR')}</span>
                    <span className={`font-medium ${isEstorno ? 'text-orange-600' : ''}`}>{lote.historico}</span>
                    <span className="text-xs text-gray-400">por {lote.usuario.nome}</span>
                    {isEstorno && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">Estorno</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-green-600">R$ {formatarMoeda(totalCreditos)}</span>
                    <span className="text-xs text-gray-400">{loteAberto === lote.id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {loteAberto === lote.id && (
                  <div className="p-4 border-t">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="text-left pb-2">Conta</th>
                          <th className="text-left pb-2">Tipo</th>
                          <th className="text-left pb-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lote.lancamentos.map(l => (
                          <tr key={l.id} className="border-t">
                            <td className="py-2">{l.conta.codigo} - {l.conta.nome}</td>
                            <td className={`py-2 font-medium ${l.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}`}>
                              {l.tipo === 'CREDITO' ? 'Crédito' : 'Débito'}
                            </td>
                            <td className={`py-2 font-medium ${l.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}`}>
                              {l.tipo === 'CREDITO' ? '+' : '-'}R$ {formatarMoeda(l.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <div className="flex gap-4 text-sm">
                        <span className="text-red-600">Total Débitos: R$ {formatarMoeda(totalDebitos)}</span>
                        <span className="text-green-600">Total Créditos: R$ {formatarMoeda(totalCreditos)}</span>
                      </div>
                      {!isEstorno && !lotes.some(l => l.historico.startsWith('Estorno') && l.historico.includes(lote.historico)) && (
                        <button
                          onClick={() => setModalEstorno(lote)}
                          className="text-sm text-orange-500 hover:underline"
                        >
                          Estornar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}