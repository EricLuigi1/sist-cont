'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  Clock3,
  Mail,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export default function PedidosPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id

  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregarPedidos() {
    setLoading(true)
    setErro('')

    try {
      const res = await fetch(`/api/empresas/${id}/pedidos`, {
        cache: 'no-store',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setErro(data?.erro || 'Erro ao carregar pedidos.')
        setPedidos([])
        return
      }

      setPedidos(data)
    } catch {
      setErro('Não foi possível carregar os pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) carregarPedidos()
  }, [id])

  async function responderPedido(pedidoId, acao) {
    setErro('')
    setSucesso('')
    setProcessando(`${acao}-${pedidoId}`)

    try {
      const res = await fetch(`/api/empresas/${id}/pedidos/${pedidoId}/${acao}`, {
        method: 'POST',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setErro(data?.erro || `Erro ao ${acao === 'aceitar' ? 'aceitar' : 'recusar'} pedido.`)
        return
      }

      setPedidos(prev => prev.filter(pedido => pedido.id !== pedidoId))
      setSucesso(
        acao === 'aceitar'
          ? 'Pedido aceito com sucesso. O usuário agora é colaborador da empresa.'
          : 'Pedido recusado com sucesso.'
      )

      setTimeout(() => setSucesso(''), 3000)
    } catch {
      setErro('Não foi possível processar o pedido.')
    } finally {
      setProcessando('')
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Pedidos de acesso"
        description="Aprove ou recuse solicitações de entrada na empresa"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Button>
        }
      />

      {erro && (
        <Alert variant="destructive" className="mt-4 rounded-2xl">
          {erro}
        </Alert>
      )}

      {sucesso && (
        <Alert variant="success" className="mt-4 rounded-2xl">
          {sucesso}
        </Alert>
      )}

      <Card className="mt-6 overflow-hidden rounded-3xl border-zinc-200 bg-white shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <ShieldCheck className="size-5" aria-hidden />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-950">
                    Solicitações pendentes
                </h2>

                {!loading && pedidos.length > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-semibold text-white">
                    {pedidos.length}
                    </span>
                )}
                </div>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Quando alguém usa o código de convite da empresa, o acesso fica pendente
                até um administrador aprovar.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
              Carregando pedidos...
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-3xl bg-white text-zinc-500 shadow-sm">
                <Clock3 className="size-6" aria-hidden />
              </div>

              <h3 className="text-lg font-semibold text-zinc-950">
                Nenhum pedido pendente
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Quando um usuário solicitar acesso usando o código de convite,
                o pedido aparecerá aqui para aprovação.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pedidos.map(pedido => (
                <div
                  key={pedido.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white shadow-sm">
                        {pedido.usuario?.nome?.[0]?.toUpperCase() ?? 'U'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-zinc-950">
                            {pedido.usuario?.nome ?? 'Usuário'}
                          </h3>

                          <Badge variant="secondary" className="rounded-full px-3 py-1">
                            Pendente
                          </Badge>
                        </div>

                        <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                          <Mail className="size-4 shrink-0" aria-hidden />
                          <span className="truncate">
                            {pedido.usuario?.email ?? 'Email não informado'}
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          Solicitado em{' '}
                          {new Date(pedido.criadoEm).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                      <Button
                        type="button"
                        onClick={() => responderPedido(pedido.id, 'aceitar')}
                        disabled={!!processando}
                        className="h-10 rounded-xl"
                      >
                        <Check className="size-4" aria-hidden />
                        {processando === `aceitar-${pedido.id}` ? 'Aceitando...' : 'Aceitar'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => responderPedido(pedido.id, 'recusar')}
                        disabled={!!processando}
                        className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="size-4" aria-hidden />
                        {processando === `recusar-${pedido.id}` ? 'Recusando...' : 'Recusar'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
            <UserPlus className="size-5" aria-hidden />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              Como funciona?
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Ao aceitar um pedido, o usuário será vinculado à empresa como colaborador.
              Ao recusar, ele não terá acesso ao workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}