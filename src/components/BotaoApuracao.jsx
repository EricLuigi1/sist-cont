'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function BotaoApuracao() {
  const pathname = usePathname()
  const router = useRouter()
  const id = pathname.split('/')[2]
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const hoje = new Date()
  const primeiroDia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  const ultimoDiaStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(ultimoDia.getDate()).padStart(2, '0')}`

  const [inicio, setInicio] = useState(primeiroDia)
  const [fim, setFim] = useState(ultimoDiaStr)

  function atalho(tipo) {
    const h = new Date()
    let i, f

    if (tipo === 'mes-atual') {
      i = new Date(h.getFullYear(), h.getMonth(), 1)
      f = new Date(h.getFullYear(), h.getMonth() + 1, 0)
    } else if (tipo === 'mes-anterior') {
      i = new Date(h.getFullYear(), h.getMonth() - 1, 1)
      f = new Date(h.getFullYear(), h.getMonth(), 0)
    } else if (tipo === 'semestre') {
      const mes = h.getMonth()
      const inicioSemestre = mes < 6 ? 0 : 6
      i = new Date(h.getFullYear(), inicioSemestre, 1)
      f = new Date(h.getFullYear(), inicioSemestre + 6, 0)
    } else if (tipo === 'ano') {
      i = new Date(h.getFullYear(), 0, 1)
      f = new Date(h.getFullYear(), 11, 31)
    }

    const fmt = d => d.toISOString().split('T')[0]
    setInicio(fmt(i))
    setFim(fmt(f))
  }

  async function handleApurar() {
    setLoading(true)
    setErro('')
    setSucesso('')

    const res = await fetch(`/api/empresas/${id}/apuracao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inicio, fim }),
    })

    const data = await res.json()

    if (res.ok) {
      setSucesso(data.mensagem)
      setTimeout(() => {
        setAberto(false)
        setSucesso('')
        router.refresh()
      }, 3000)
    } else {
      setErro(data.erro || 'Erro ao apurar resultado!')
    }

    setLoading(false)
  }

  return (
    <div className="relative">
      <button onClick={() => setAberto(!aberto)} className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 text-sm font-medium">
        Apurar Resultado
      </button>
      {aberto && (
        <div className="absolute right-0 mt-2 w-80 border rounded-lg shadow-lg bg-white z-20 p-4">
          <h3 className="font-semibold mb-3">Apuração do Resultado</h3>
          {erro && <p className="text-red-500 text-sm mb-3">{erro}</p>}
          {sucesso && <p className="text-green-600 text-sm mb-3">{sucesso}</p>}
          <div className="flex gap-2 flex-wrap mb-3">
            <button onClick={() => atalho('mes-atual')} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Mês atual</button>
            <button onClick={() => atalho('mes-anterior')} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Mês anterior</button>
            <button onClick={() => atalho('semestre')} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Semestre</button>
            <button onClick={() => atalho('ano')} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Ano atual</button>
          </div>
          <div className="flex gap-2 items-center mb-4">
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" />
            <span className="text-gray-500 text-sm">até</span>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleApurar} disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm">
              {loading ? 'Apurando...' : 'Confirmar'}
            </button>
            <button onClick={() => setAberto(false)} className="px-4 py-2 border rounded hover:bg-gray-50 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}