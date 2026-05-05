'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const tiposLabel = {
  ATIVO: 'Ativo',
  PASSIVO: 'Passivo',
  PATRIMONIO_LIQUIDO: 'Patrimônio Líquido',
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
}

function getIndentacao(codigo) {
  const nivel = codigo.split('.').length
  if (nivel === 1) return 'font-bold'
  if (nivel === 2) return 'pl-4 font-medium'
  return 'pl-8 text-gray-600'
}

export default function ContasPage() {
  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const [contas, setContas] = useState([])
  const [busca, setBusca] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nomeEditado, setNomeEditado] = useState('')
  const [erro, setErro] = useState('')

  function carregarContas() {
    fetch(`/api/empresas/${id}/contas`)
      .then(res => res.json())
      .then(data => setContas(data))
  }

  useEffect(() => {
    carregarContas()
    fetch(`/api/empresas/${id}`)
      .then(res => res.json())
      .then(data => setIsAdmin(data.papel === 'ADMIN'))
  }, [id])

  const contasFiltradas = contas.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.codigo.includes(busca)
  )

  async function handleEditar(conta) {
    if (editando === conta.id) {
      const res = await fetch(`/api/empresas/${id}/contas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conta.id, nome: nomeEditado }),
      })
      if (res.ok) {
        setEditando(null)
        carregarContas()
      } else {
        const data = await res.json()
        setErro(data.erro || 'Erro ao editar!')
      }
    } else {
      setEditando(conta.id)
      setNomeEditado(conta.nome)
    }
  }

  async function handleExcluir(contaId) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return

    const res = await fetch(`/api/empresas/${id}/contas?contaId=${contaId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      carregarContas()
    } else {
      const data = await res.json()
      setErro(data.erro || 'Erro ao excluir!')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Plano de Contas</h1>
        {isAdmin && (
          <a href={`/empresas/${id}/contas/nova`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Nova Conta
          </a>
        )}
      </div>
      {erro && <p className="text-red-500 mb-4">{erro}</p>}
      <input
        type="text"
        placeholder="Buscar por código ou nome..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 p-3 text-left">Código</th>
            <th className="border border-gray-200 p-3 text-left">Nome</th>
            <th className="border border-gray-200 p-3 text-left">Tipo</th>
            {isAdmin && <th className="border border-gray-200 p-3 text-left">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {contasFiltradas.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-4 text-gray-500">
                Nenhuma conta encontrada.
              </td>
            </tr>
          ) : (
            contasFiltradas.map(conta => (
              <tr key={conta.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-3 font-mono text-sm">{conta.codigo}</td>
                <td className={`border border-gray-200 p-3 ${getIndentacao(conta.codigo)}`}>
                  {editando === conta.id ? (
                    <input
                      value={nomeEditado}
                      onChange={e => setNomeEditado(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                      autoFocus
                    />
                  ) : (
                    conta.nome
                  )}
                </td>
                <td className="border border-gray-200 p-3 text-sm">{tiposLabel[conta.tipo]}</td>
                {isAdmin && (
                  <td className="border border-gray-200 p-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditar(conta)} className="text-sm text-blue-600 hover:underline">
                        {editando === conta.id ? 'Salvar' : 'Editar'}
                      </button>
                      {editando === conta.id && (
                        <button onClick={() => setEditando(null)} className="text-sm text-gray-500 hover:underline">
                          Cancelar
                        </button>
                      )}
                      {editando !== conta.id && (
                        <button onClick={() => handleExcluir(conta.id)} className="text-sm text-red-500 hover:underline">
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}