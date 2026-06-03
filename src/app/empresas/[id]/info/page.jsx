'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function InfoEmpresaPage() {
  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const [empresa, setEmpresa] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [form, setForm] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
  })

  useEffect(() => {
    fetch(`/api/empresas/${id}/info`)
      .then(res => res.json())
      .then(data => {
        setEmpresa(data)
        setIsAdmin(data.papel === 'ADMIN')
        setForm({
          nome: data.nome,
          razaoSocial: data.razaoSocial,
          cnpj: data.cnpj,
          endereco: data.endereco,
          cidade: data.cidade,
          estado: data.estado,
        })
      })
  }, [id])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSalvar(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setSucesso('')

    const res = await fetch(`/api/empresas/${id}/info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (res.ok) {
      setSucesso('Empresa atualizada com sucesso!')
      setEmpresa({ ...empresa, ...form })
      setEditando(false)
      setTimeout(() => setSucesso(''), 3000)
    } else {
      setErro(data.erro || 'Erro ao atualizar empresa!')
    }

    setLoading(false)
  }

  if (!empresa) return <div className="text-gray-500">Carregando...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Informações da Empresa</h1>
        {isAdmin && !editando && (
          <button onClick={() => setEditando(true)} className="border px-4 py-2 rounded text-sm hover:bg-gray-50">
            ✏️ Editar
          </button>
        )}
      </div>
      {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}
      {sucesso && <p className="text-green-600 text-sm mb-4">{sucesso}</p>}
      {editando ? (
        <form onSubmit={handleSalvar} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
            <input name="nome" value={form.nome} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Razão Social</label>
            <input name="razaoSocial" value={form.razaoSocial} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CNPJ</label>
            <input name="cnpj" value={form.cnpj} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <input name="endereco" value={form.endereco} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cidade</label>
              <input name="cidade" value={form.cidade} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <input name="estado" value={form.estado} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setEditando(false)} className="px-6 py-2 border rounded hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Nome Fantasia</p>
              <p className="font-medium">{empresa.nome}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Razão Social</p>
              <p className="font-medium">{empresa.razaoSocial}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">CNPJ</p>
              <p className="font-medium">{empresa.cnpj}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Endereço</p>
              <p className="font-medium">{empresa.endereco}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Cidade</p>
              <p className="font-medium">{empresa.cidade}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <p className="font-medium">{empresa.estado}</p>
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Membro desde</p>
            <p className="font-medium">{new Date(empresa.criadoEm).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      )}
    </div>
  )
}