'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ColaboradoresPage() {
  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const [colaboradores, setColaboradores] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [usuarioAtualId, setUsuarioAtualId] = useState(null)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  function carregarColaboradores() {
    fetch(`/api/empresas/${id}/colaboradores`)
      .then(res => res.json())
      .then(data => setColaboradores(data))
  }

  useEffect(() => {
    carregarColaboradores()
    fetch(`/api/empresas/${id}`)
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.papel === 'ADMIN')
        setUsuarioAtualId(data.usuarioId)
      })
  }, [id])

  async function handleRemover(usuarioId, nome) {
    if (!confirm(`Tem certeza que deseja remover ${nome} da empresa?`)) return

    const res = await fetch(`/api/empresas/${id}/colaboradores?usuarioId=${usuarioId}`, {
      method: 'DELETE',
    })

    const data = await res.json()

    if (res.ok) {
      setSucesso('Colaborador removido com sucesso!')
      carregarColaboradores()
      setTimeout(() => setSucesso(''), 3000)
    } else {
      setErro(data.erro || 'Erro ao remover colaborador!')
      setTimeout(() => setErro(''), 3000)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Colaboradores</h1>
        <span className="text-sm text-gray-500">{colaboradores.length} membro(s)</span>
      </div>
      {erro && <p className="text-red-500 mb-4">{erro}</p>}
      {sucesso && <p className="text-green-600 mb-4">{sucesso}</p>}
      <div className="flex flex-col gap-3">
        {colaboradores.map(c => (
          <div key={c.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {c.usuario.nome[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{c.usuario.nome}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.papel === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {c.papel === 'ADMIN' ? 'Administrador' : 'Colaborador'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{c.usuario.email}</p>
                <p className="text-sm text-gray-500">{c.usuario.telefone}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-400">
                Desde {new Date(c.criadoEm).toLocaleDateString('pt-BR')}
              </p>
              {isAdmin && c.papel !== 'ADMIN' && (
                <button
                  onClick={() => handleRemover(c.usuario.id, c.usuario.nome)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}