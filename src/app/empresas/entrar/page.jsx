'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EntrarEmpresaPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const res = await fetch('/api/empresas/entrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/empresas/${data.id}`)
    } else {
      const data = await res.json()
      setErro(data.erro || 'Código inválido!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-8 border rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Entrar em uma empresa</h1>
        <p className="text-gray-500 mb-6">Digite o código de convite fornecido pelo administrador</p>
        {erro && <p className="text-red-500 mb-4">{erro}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código de convite</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
              placeholder="Ex: abc123..."
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
          <a href="/dashboard" className="text-center text-sm text-blue-600 hover:underline">
            Voltar
          </a>
        </form>
      </div>
    </div>
  )
}