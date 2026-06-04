'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Calculator } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function formatarDataInput(data) {
  return data.toISOString().split('T')[0]
}

function datasPadrao() {
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  return {
    inicio: formatarDataInput(primeiroDia),
    fim: formatarDataInput(ultimoDia),
  }
}

export default function BotaoApuracao() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = pathname.split('/')[2]

  const padrao = datasPadrao()

  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [inicio, setInicio] = useState(searchParams.get('inicio') || padrao.inicio)
  const [fim, setFim] = useState(searchParams.get('fim') || padrao.fim)

  useEffect(() => {
    const inicioUrl = searchParams.get('inicio')
    const fimUrl = searchParams.get('fim')

    if (inicioUrl) setInicio(inicioUrl)
    if (fimUrl) setFim(fimUrl)
  }, [searchParams])

  function atalho(tipo) {
    const hoje = new Date()
    let inicioData
    let fimData

    if (tipo === 'mes-atual') {
      inicioData = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      fimData = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    }

    if (tipo === 'mes-anterior') {
      inicioData = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      fimData = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    }

    if (tipo === 'semestre') {
      const mes = hoje.getMonth()
      const inicioSemestre = mes < 6 ? 0 : 6

      inicioData = new Date(hoje.getFullYear(), inicioSemestre, 1)
      fimData = new Date(hoje.getFullYear(), inicioSemestre + 6, 0)
    }

    if (tipo === 'ano') {
      inicioData = new Date(hoje.getFullYear(), 0, 1)
      fimData = new Date(hoje.getFullYear(), 11, 31)
    }

    setInicio(formatarDataInput(inicioData))
    setFim(formatarDataInput(fimData))
    setErro('')
    setSucesso('')
  }

  async function handleApurar() {
    setErro('')
    setSucesso('')

    if (!inicio || !fim) {
      setErro('Informe o período da apuração.')
      return
    }

    if (new Date(inicio) > new Date(fim)) {
      setErro('A data inicial não pode ser maior que a data final.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/empresas/${id}/apuracao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inicio, fim }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setSucesso(data?.mensagem || 'Resultado apurado com sucesso!')

        setTimeout(() => {
          setAberto(false)
          setSucesso('')
          router.refresh()
        }, 2500)

        return
      }

      setErro(data?.erro || 'Erro ao apurar resultado.')
    } catch {
      setErro('Não foi possível apurar o resultado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const atalhos = [
    { id: 'mes-atual', label: 'Mês atual' },
    { id: 'mes-anterior', label: 'Mês anterior' },
    { id: 'semestre', label: 'Semestre' },
    { id: 'ano', label: 'Ano atual' },
  ]

  return (
    <div className="relative print:hidden">
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setAberto(!aberto)
          setErro('')
          setSucesso('')
        }}
        className="h-10 rounded-xl"
      >
        <Calculator className="size-4" aria-hidden />
        Apurar resultado
      </Button>

      {aberto && (
        <div className="absolute right-0 z-30 mt-2 w-[22rem] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-zinc-950">
              Apuração do resultado
            </h3>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              A apuração zera receitas, despesas e custos contra a conta de resultado.
              Depois transfere o saldo final para Lucros ou Prejuízos Acumulados.
            </p>
          </div>

          {erro && (
            <Alert variant="destructive" className="mt-3 rounded-xl py-2 text-xs">
              {erro}
            </Alert>
          )}

          {sucesso && (
            <Alert variant="success" className="mt-3 rounded-xl py-2 text-xs">
              {sucesso}
            </Alert>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {atalhos.map(atalhoItem => (
              <Button
                key={atalhoItem.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => atalho(atalhoItem.id)}
                disabled={loading}
                className="h-8 rounded-xl text-xs"
              >
                {atalhoItem.label}
              </Button>
            ))}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <Input
              type="date"
              value={inicio}
              onChange={e => setInicio(e.target.value)}
              disabled={loading}
              className="h-9 rounded-xl"
            />

            <span className="text-center text-xs text-zinc-500">
              até
            </span>

            <Input
              type="date"
              value={fim}
              onChange={e => setFim(e.target.value)}
              disabled={loading}
              className="h-9 rounded-xl"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              className="h-9 flex-1 rounded-xl"
              onClick={handleApurar}
              disabled={loading}
            >
              {loading ? 'Apurando...' : 'Confirmar apuração'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setAberto(false)}
              disabled={loading}
              className="h-9 rounded-xl"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}