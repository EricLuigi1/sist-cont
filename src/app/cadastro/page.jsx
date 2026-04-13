'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', cpf: '', telefone: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const res = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push('/login')
    } else {
      const data = await res.json()
      setErro(data.erro || 'Erro ao cadastrar!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-8 border rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Cadastro</h1>
        {erro && <p className="text-red-500 mb-4">{erro}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome completo</label>
            <input name="nome" type="text" value={form.nome} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CPF</label>
            <input name="cpf" type="text" value={form.cpf} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input name="telefone" type="text" value={form.telefone} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input name="senha" type="password" value={form.senha} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          <a href="/login" className="text-center text-sm text-blue-600 hover:underline">Já tem conta? Faça login</a>
        </form>
      </div>
    </div>
  )
}