'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Calculator } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

  const atalhos = [
    { id: 'mes-atual', label: 'Mês atual' },
    { id: 'mes-anterior', label: 'Mês anterior' },
    { id: 'semestre', label: 'Semestre' },
    { id: 'ano', label: 'Ano atual' },
  ]

  return (
    <div className="relative">
      <Button type="button" variant="outline" onClick={() => setAberto(!aberto)}>
        <Calculator className="size-4" aria-hidden />
        Apurar resultado
      </Button>
      {aberto && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border bg-popover p-4 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <h3 className="font-semibold tracking-tight">Apuração do resultado</h3>
          {erro && <Alert variant="destructive" className="mt-3 py-2 text-xs">{erro}</Alert>}
          {sucesso && <Alert variant="success" className="mt-3 py-2 text-xs">{sucesso}</Alert>}
          <div className="mt-3 flex flex-wrap gap-2">
            {atalhos.map(a => (
              <Button key={a.id} type="button" variant="outline" size="xs" onClick={() => atalho(a.id)}>
                {a.label}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="h-8 flex-1" />
            <span className="text-xs text-muted-foreground">até</span>
            <Input type="date" value={fim} onChange={e => setFim(e.target.value)} className="h-8 flex-1" />
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" className="flex-1" onClick={handleApurar} disabled={loading}>
              {loading ? 'Apurando...' : 'Confirmar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
