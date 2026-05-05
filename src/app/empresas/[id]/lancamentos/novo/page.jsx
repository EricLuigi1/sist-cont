'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function NovoLancamentoPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const [contas, setContas] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [historico, setHistorico] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [debitos, setDebitos] = useState([{ contaId: '', valor: '' }])
  const [creditos, setCreditos] = useState([{ contaId: '', valor: '' }])

  useEffect(() => {
    fetch(`/api/empresas/${id}/contas`)
      .then(res => res.json())
      .then(data => setContas(data))
  }, [id])

  function addDebito() {
    setDebitos([...debitos, { contaId: '', valor: '' }])
  }

  function addCredito() {
    setCreditos([...creditos, { contaId: '', valor: '' }])
  }

  function removeDebito(index) {
    setDebitos(debitos.filter((_, i) => i !== index))
  }

  function removeCredito(index) {
    setCreditos(creditos.filter((_, i) => i !== index))
  }

  function updateDebito(index, field, value) {
    const novo = [...debitos]
    novo[index][field] = value
    setDebitos(novo)
  }

  function updateCredito(index, field, value) {
    const novo = [...creditos]
    novo[index][field] = value
    setCreditos(novo)
  }

  const totalDebitos = debitos.reduce((acc, l) => acc + (Number(l.valor) || 0), 0)
  const totalCreditos = creditos.reduce((acc, l) => acc + (Number(l.valor) || 0), 0)
  const balanceado = Math.abs(totalDebitos - totalCreditos) < 0.01 && totalDebitos > 0

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!historico.trim()) return setErro('Histórico é obrigatório!')
    if (!data) return setErro('Data é obrigatória!')
    if (debitos.some(l => !l.contaId || !l.valor)) return setErro('Preencha todos os campos dos débitos!')
    if (creditos.some(l => !l.contaId || !l.valor)) return setErro('Preencha todos os campos dos créditos!')
    if (!balanceado) return setErro(`Total de débitos (R$ ${totalDebitos.toFixed(2)}) deve ser igual ao total de créditos (R$ ${totalCreditos.toFixed(2)})!`)

    setLoading(true)

    const lancamentos = [
      ...debitos.map(l => ({ ...l, tipo: 'DEBITO' })),
      ...creditos.map(l => ({ ...l, tipo: 'CREDITO' })),
    ]

    const res = await fetch(`/api/empresas/${id}/lancamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historico, data, lancamentos }),
    })

    if (res.ok) {
      router.push(`/empresas/${id}/lancamentos`)
    } else {
      const data = await res.json()
      setErro(data.erro || 'Erro ao salvar!')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Novo Lançamento</h1>
      {erro && <p className="text-red-500 mb-4">{erro}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Histórico</label>
            <input value={historico} onChange={e => setHistorico(e.target.value)} required className="w-full border rounded px-3 py-2" placeholder="Ex: Venda de produtos à vista" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} required className="border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-red-600">Débitos</h2>
            <span className="text-sm font-medium text-red-600">Total: R$ {totalDebitos.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-2">
            {debitos.map((debito, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select value={debito.contaId} onChange={e => updateDebito(index, 'contaId', e.target.value)} className="flex-1 border rounded px-3 py-2 text-sm">
                  <option value="">Selecione a conta</option>
                  {contas.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>
                  ))}
                </select>
                <input type="number" step="0.01" min="0" placeholder="Valor" value={debito.valor} onChange={e => updateDebito(index, 'valor', e.target.value)} className="w-32 border rounded px-3 py-2 text-sm" />
                {debitos.length > 1 && (
                  <button type="button" onClick={() => removeDebito(index)} className="text-red-500 hover:text-red-700 font-bold text-lg">×</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addDebito} className="mt-2 text-sm text-red-600 hover:underline">+ Adicionar Débito</button>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-green-600">Créditos</h2>
            <span className="text-sm font-medium text-green-600">Total: R$ {totalCreditos.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-2">
            {creditos.map((credito, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select value={credito.contaId} onChange={e => updateCredito(index, 'contaId', e.target.value)} className="flex-1 border rounded px-3 py-2 text-sm">
                  <option value="">Selecione a conta</option>
                  {contas.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>
                  ))}
                </select>
                <input type="number" step="0.01" min="0" placeholder="Valor" value={credito.valor} onChange={e => updateCredito(index, 'valor', e.target.value)} className="w-32 border rounded px-3 py-2 text-sm" />
                {creditos.length > 1 && (
                  <button type="button" onClick={() => removeCredito(index)} className="text-green-500 hover:text-green-700 font-bold text-lg">×</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addCredito} className="mt-2 text-sm text-green-600 hover:underline">+ Adicionar Crédito</button>
        </div>
        <div className={`p-3 rounded-lg text-sm font-medium ${balanceado ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {balanceado ? '✅ Lançamento balanceado!' : `⚠️ Diferença: R$ ${Math.abs(totalDebitos - totalCreditos).toFixed(2)}`}
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading || !balanceado} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar Lançamento'}
          </button>
          <a href={`/empresas/${id}/lancamentos`} className="px-6 py-2 border rounded hover:bg-gray-50 text-center">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}