'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const naturezasDRE = {
  RECEITA: [
    { value: 'RECEITA_BRUTA', label: 'Receita Operacional Bruta' },
    { value: 'RECEITA_FINANCEIRA', label: 'Receita Financeira' },
    { value: 'RECEITA_OPERACIONAL_OUTRAS', label: 'Outras Receitas Operacionais' },
    { value: 'OUTRAS_RECEITAS', label: 'Outras Receitas' },
    { value: 'DEDUCAO', label: 'Dedução/Abatimento' },
  ],
  DESPESA: [
    { value: 'DESPESA_VENDAS', label: 'Despesa com Vendas' },
    { value: 'DESPESA_FINANCEIRA', label: 'Despesa Financeira' },
    { value: 'DESPESA_ADMINISTRATIVA', label: 'Despesa Geral e Administrativa' },
    { value: 'DESPESA_OUTRAS', label: 'Outras Despesas Operacionais' },
    { value: 'OUTRAS_DESPESAS', label: 'Outras Despesas' },
  ],
  CUSTO: [
    { value: 'CUSTO_OPERACIONAL', label: 'Custo Operacional' },
  ],
}

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
    analitica: false,
    naturezaDRE: '',
  })

  useEffect(() => {
    fetch(`/api/empresas/${id}/contas`)
      .then(res => res.json())
      .then(data => setContas(data))
  }, [id])

  function handleChange(e) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    const updated = { ...form, [e.target.name]: value }
    if (e.target.name === 'tipo') updated.naturezaDRE = ''
    setForm(updated)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!form.nome.trim()) return setErro('Nome é obrigatório!')
    if (form.nome.trim().length < 3) return setErro('Nome deve ter pelo menos 3 caracteres!')
    if (form.analitica && ['RECEITA', 'DESPESA', 'CUSTO'].includes(form.tipo) && !form.naturezaDRE) {
      return setErro('Selecione a natureza DRE para contas analíticas de receita, despesa ou custo!')
    }

    setLoading(true)

    const res = await fetch(`/api/empresas/${id}/contas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        tipo: form.tipo,
        contaPaiId: form.contaPaiId || null,
        analitica: form.analitica,
        naturezaDRE: form.naturezaDRE || null,
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
    CUSTO: 'Custo',
    RESULTADO: 'Resultado',
  }

  const contasFiltradas = contas.filter(c => c.tipo === form.tipo)
  const naturezasDisponiveis = naturezasDRE[form.tipo] || []

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
        <div className="flex items-center gap-3 border rounded px-3 py-3">
          <input type="checkbox" id="analitica" name="analitica" checked={form.analitica} onChange={handleChange} className="w-4 h-4" />
          <div>
            <label htmlFor="analitica" className="text-sm font-medium cursor-pointer">Conta Analítica</label>
            <p className="text-xs text-gray-400">Marque se essa conta terá movimentação de saldo</p>
          </div>
        </div>
        {form.analitica && naturezasDisponiveis.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">Natureza no DRE</label>
            <select name="naturezaDRE" value={form.naturezaDRE} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="">Selecione...</option>
              {naturezasDisponiveis.map(n => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Define onde essa conta aparece no DRE.</p>
          </div>
        )}
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