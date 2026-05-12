'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function FiltroPeriodo() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const [inicio, setInicio] = useState(searchParams.get('inicio') || `${mesAtual}-01`)
  const [fim, setFim] = useState(searchParams.get('fim') || `${mesAtual}-${new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()}`)

  function aplicar() {
    router.push(`${pathname}?inicio=${inicio}&fim=${fim}`)
  }

function atalho(tipo) {
  const h = new Date()
  let i, f

  if (tipo === 'mes-atual') {
    i = new Date(h.getFullYear(), h.getMonth(), 1, 12)
    f = new Date(h.getFullYear(), h.getMonth() + 1, 0, 12)
  } else if (tipo === 'mes-anterior') {
    i = new Date(h.getFullYear(), h.getMonth() - 1, 1, 12)
    f = new Date(h.getFullYear(), h.getMonth(), 0, 12)
  } else if (tipo === 'trimestre') {
    i = new Date(h.getFullYear(), Math.floor(h.getMonth() / 3) * 3, 1, 12)
    f = new Date(h.getFullYear(), Math.floor(h.getMonth() / 3) * 3 + 3, 0, 12)
  } else if (tipo === 'ano') {
    i = new Date(h.getFullYear(), 0, 1, 12)
    f = new Date(h.getFullYear(), 11, 31, 12)
  }

  const fmt = d => d.toISOString().split('T')[0]
  router.push(`${pathname}?inicio=${fmt(i)}&fim=${fmt(f)}`)
}

  return (
    <div className="flex flex-wrap gap-2 items-center mb-6 p-3 bg-gray-50 rounded-lg border">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => atalho('mes-atual')} className="text-xs px-3 py-1 border rounded hover:bg-white">Mês atual</button>
        <button onClick={() => atalho('mes-anterior')} className="text-xs px-3 py-1 border rounded hover:bg-white">Mês anterior</button>
        <button onClick={() => atalho('trimestre')} className="text-xs px-3 py-1 border rounded hover:bg-white">Trimestre</button>
        <button onClick={() => atalho('ano')} className="text-xs px-3 py-1 border rounded hover:bg-white">Ano atual</button>
      </div>
      <div className="flex gap-2 items-center ml-auto">
        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <span className="text-gray-500 text-sm">até</span>
        <input type="date" value={fim} onChange={e => setFim(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        <button onClick={aplicar} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Aplicar</button>
      </div>
    </div>
  )
}