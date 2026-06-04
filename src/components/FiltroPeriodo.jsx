'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
export default function FiltroPeriodo() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hoje = new Date()
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const [inicio, setInicio] = useState(searchParams.get('inicio') || `${mesAtual}-01`)
  const [fim, setFim] = useState(
    searchParams.get('fim') ||
      `${mesAtual}-${new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()}`
  )

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

  const atalhos = [
    { id: 'mes-atual', label: 'Mês atual' },
    { id: 'mes-anterior', label: 'Mês anterior' },
    { id: 'trimestre', label: 'Trimestre' },
    { id: 'ano', label: 'Ano atual' },
  ]

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {atalhos.map(a => (
          <Button
            key={a.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => atalho(a.id)}
          >
            {a.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="size-4 shrink-0 text-muted-foreground hidden sm:block" aria-hidden />
        <Input
          type="date"
          value={inicio}
          onChange={e => setInicio(e.target.value)}
          className="w-auto min-w-[140px]"
          aria-label="Data inicial"
        />
        <span className="text-sm text-muted-foreground">até</span>
        <Input
          type="date"
          value={fim}
          onChange={e => setFim(e.target.value)}
          className="w-auto min-w-[140px]"
          aria-label="Data final"
        />
        <Button type="button" size="sm" onClick={aplicar}>
          Aplicar
        </Button>
      </div>
    </div>
  )
}
