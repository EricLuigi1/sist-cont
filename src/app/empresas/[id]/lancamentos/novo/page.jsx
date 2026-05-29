'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { formatarMoedaInput, parseMoeda } from '@/lib/formatacao'

function ContaInput({ contas, value, onChange }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!value) setBusca('')
  }, [value])

  const sugestoes = busca.length === 0 ? [] : contas.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.codigo.includes(busca)
  ).slice(0, 8)

  function selecionar(conta) {
    setBusca(conta.codigo + ' - ' + conta.nome)
    setAberto(false)
    onChange(conta.id)
  }

  return (
    <div className="relative flex-1" ref={ref} style={{ zIndex: aberto ? 50 : 'auto' }}>
      <input
        type="text"
        placeholder="Digite o código ou nome da conta..."
        value={busca}
        onChange={e => {
          setBusca(e.target.value)
          setAberto(true)
          if (!e.target.value) onChange('')
        }}
        onFocus={() => busca.length > 0 && setAberto(true)}
        className="w-full border rounded px-3 py-2 text-sm"
      />
      {aberto && sugestoes.length > 0 && (
        <div
          className="absolute left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"
          style={{ zIndex: 9999, top: '100%' }}
        >
          {sugestoes.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => selecionar(c)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex gap-2"
            >
              <span className="font-mono text-gray-500 w-16 shrink-0">{c.codigo}</span>
              <span>{c.nome}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
      .then(data => setContas(data.filter(c => c.analitica)))
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
    if (field === 'valor') {
      novo[index][field] = formatarMoedaInput(value)
    } else {
      novo[index][field] = value
    }
    setDebitos(novo)
  }

  function updateCredito(index, field, value) {
    const novo = [...creditos]
    if (field === 'valor') {
      novo[index][field] = formatarMoedaInput(value)
    } else {
      novo[index][field] = value
    }
    setCreditos(novo)
  }

  const totalDebitos = debitos.reduce((acc, l) => acc + parseMoeda(l.valor), 0)
  const totalCreditos = creditos.reduce((acc, l) => acc + parseMoeda(l.valor), 0)
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
      ...debitos.map(l => ({ contaId: l.contaId, valor: parseMoeda(l.valor), tipo: 'DEBITO' })),
      ...creditos.map(l => ({ contaId: l.contaId, valor: parseMoeda(l.valor), tipo: 'CREDITO' })),
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
            <span className="text-sm font-medium text-red-600">Total: R$ {totalDebitos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col gap-2">
            {debitos.map((debito, index) => (
              <div key={index} className="flex gap-2 items-center">
                <ContaInput contas={contas} value={debito.contaId} onChange={val => updateDebito(index, 'contaId', val)} />
                <input
                  type="text"
                  placeholder="0,00"
                  value={debito.valor}
                  onChange={e => updateDebito(index, 'valor', e.target.value)}
                  className="w-32 border rounded px-3 py-2 text-sm text-right"
                />
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
            <span className="text-sm font-medium text-green-600">Total: R$ {totalCreditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex flex-col gap-2">
            {creditos.map((credito, index) => (
              <div key={index} className="flex gap-2 items-center">
                <ContaInput contas={contas} value={credito.contaId} onChange={val => updateCredito(index, 'contaId', val)} />
                <input
                  type="text"
                  placeholder="0,00"
                  value={credito.valor}
                  onChange={e => updateCredito(index, 'valor', e.target.value)}
                  className="w-32 border rounded px-3 py-2 text-sm text-right"
                />
                {creditos.length > 1 && (
                  <button type="button" onClick={() => removeCredito(index)} className="text-green-500 hover:text-green-700 font-bold text-lg">×</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addCredito} className="mt-2 text-sm text-green-600 hover:underline">+ Adicionar Crédito</button>
        </div>
        <div className={`p-3 rounded-lg text-sm font-medium ${balanceado ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {balanceado ? '✅ Lançamento balanceado!' : `⚠️ Diferença: R$ ${Math.abs(totalDebitos - totalCreditos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
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