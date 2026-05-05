'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function NovaContaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [contas, setContas] = useState([])
  const [form, setForm] = useState({
    nome: '',
    tipo: 'ATIVO',
    contaPaiId: '',
  })

  useEffect(() => {
    fetch(`/api/empresas/${id}/contas`)
      .then(res => res.json())
      .then(data => setContas(data))
  }, [id])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const res = await fetch(`/api/empresas/${id}/contas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        tipo: form.tipo,
        contaPaiId: form.contaPaiId || null,
      }),
    })

    if (res.ok) {
      router.push(`/empresas/${id}/contas`)
    } else {
      const data = await res.json()
      setErro(data.erro || 'Erro ao cadastrar conta!')
      setLoading(false)
    }
  }

  const tiposLabel = {
    ATIVO: 'Ativo',
    PASSIVO: 'Passivo',
    PATRIMONIO_LIQUIDO: 'Patrimônio Líquido',
    RECEITA: 'Receita',
    DESPESA: 'Despesa',
  }

  const contasFiltradas = contas.filter(c => c.tipo === form.tipo)

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Nova Conta</h1>
      {erro && <p className="text-red-500 mb-4">{erro}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input name="nome" value={form.nome} onChange={handleChange} required className="w-full border rounded px-3 py-2" placeholder="Ex: Caixa" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select name="tipo" value={form.tipo} onChange={handleChange} className="w-full border rounded px-3 py-2">
            {Object.entries(tiposLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Conta Pai (opcional)</label>
          <select name="contaPaiId" value={form.contaPaiId} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="">Nenhuma (conta raiz)</option>
            {contasFiltradas.map(c => (
              <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">O código será gerado automaticamente.</p>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Salvando...' : 'Cadastrar Conta'}
        </button>
        <a href={`/empresas/${id}/contas`} className="text-center text-sm text-blue-600 hover:underline">
          Voltar
        </a>
      </form>
    </div>
  )
}