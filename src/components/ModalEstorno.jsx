'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function ModalEstorno({
  empresaId,
  loteId,
  historico,
  onSuccess,
  onClose,
}) {
  const [motivo, setMotivo] = useState('ERRO')
  const [observacao, setObservacao] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleEstornar() {
    setErro('')

    if (!data) {
      setErro('Informe a data do estorno.')
      return
    }

    if (observacao.trim().length > 180) {
      setErro('A observação deve ter no máximo 180 caracteres.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/empresas/${empresaId}/lancamentos/estorno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loteId,
          motivo,
          observacao: observacao.trim(),
          data,
        }),
      })

      const dataResposta = await res.json().catch(() => null)

      if (res.ok) {
        onSuccess()
        return
      }

      setErro(dataResposta?.erro || 'Erro ao realizar estorno!')
    } catch {
      setErro('Não foi possível realizar o estorno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const opcoes = [
    { value: 'ERRO', label: 'Erro', desc: 'Valores ou contas incorretos' },
    { value: 'OMISSAO', label: 'Omissão', desc: 'Lançamento não realizado' },
    { value: 'DUPLICIDADE', label: 'Duplicidade', desc: 'Lançado mais de uma vez' },
    { value: 'CANCELAMENTO', label: 'Cancelamento', desc: 'Operação cancelada' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-estorno-title"
    >
      <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="size-5" aria-hidden />
          </div>

          <div>
            <h2 id="modal-estorno-title" className="text-lg font-semibold tracking-tight">
              Estornar lançamento
            </h2>

            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {historico}
            </p>
          </div>
        </div>

        <Alert className="mb-4 rounded-2xl">
          O lançamento original será preservado. O sistema criará um novo lote com os débitos e créditos invertidos.
        </Alert>

        {erro && (
          <Alert variant="destructive" className="mb-4 rounded-2xl">
            {erro}
          </Alert>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Motivo do estorno</p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {opcoes.map(op => (
              <button
                key={op.value}
                type="button"
                onClick={() => setMotivo(op.value)}
                className={cn(
                  'rounded-2xl border-2 p-3 text-left transition-all',
                  motivo === op.value
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                )}
              >
                <p className={cn('text-sm font-medium', motivo === op.value && 'text-amber-800')}>
                  {op.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{op.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
          <Field label="Data do estorno" htmlFor="dataEstorno">
            <Input
              id="dataEstorno"
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="h-10 rounded-xl"
            />
          </Field>

          <Field label="Observação (opcional)" htmlFor="observacaoEstorno">
            <Input
              id="observacaoEstorno"
              type="text"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              maxLength={180}
              placeholder="Descreva o motivo com mais detalhes..."
              className="h-10 rounded-xl"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="destructive"
            className="flex-1 rounded-xl"
            onClick={handleEstornar}
            disabled={loading}
          >
            {loading ? 'Estornando...' : 'Confirmar estorno'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
