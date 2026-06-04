'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Plus, Search } from 'lucide-react'
import { formatarMoeda } from '@/lib/formatacao'
import ModalEstorno from '@/components/ModalEstorno'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export default function LancamentosPage() {
  const pathname = usePathname()
  const id = pathname.split('/')[2]

  const [lotes, setLotes] = useState([])
  const [busca, setBusca] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [usuarioAtual, setUsuarioAtual] = useState(null)
  const [erro, setErro] = useState('')
  const [loteAberto, setLoteAberto] = useState(null)
  const [modalEstorno, setModalEstorno] = useState(null)
  const [loading, setLoading] = useState(true)

  function carregarLotes() {
    setLoading(true)
    setErro('')

    fetch(`/api/empresas/${id}/lancamentos`, {
      cache: 'no-store',
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLotes(data)
        } else {
          setLotes([])
          setErro(data?.erro || 'Erro ao carregar lançamentos.')
        }
      })
      .catch(() => {
        setLotes([])
        setErro('Não foi possível carregar os lançamentos.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregarLotes()

    fetch(`/api/empresas/${id}`)
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.papel === 'ADMIN')
      })
      .catch(() => setIsAdmin(false))

    fetch('/api/perfil')
      .then(res => res.json())
      .then(data => setUsuarioAtual(data))
      .catch(() => setUsuarioAtual(null))
  }, [id])

  const lotesFiltrados = lotes.filter(lote =>
    lote.historico.toLowerCase().includes(busca.toLowerCase())
  )

  function loteFoiEstornado(lote) {
    return lotes.some(item => {
      if (!item.historico?.startsWith('Estorno')) return false

      return (
        item.historico.includes(lote.id) ||
        item.historico.includes(lote.historico)
      )
    })
  }

  return (
    <div>
      {modalEstorno && (
        <ModalEstorno
          empresaId={id}
          loteId={modalEstorno.id}
          historico={modalEstorno.historico}
          onSuccess={() => {
            setModalEstorno(null)
            carregarLotes()
          }}
          onClose={() => setModalEstorno(null)}
        />
      )}

      <PageHeader
        title="Lançamentos"
        description="Histórico de lotes contábeis da empresa"
        actions={
          <Button asChild>
            <Link href={`/empresas/${id}/lancamentos/novo`}>
              <Plus className="size-4" aria-hidden />
              Novo lançamento
            </Link>
          </Button>
        }
      />

      {erro && (
        <Alert variant="destructive" className="mb-4 rounded-2xl">
          {erro}
        </Alert>
      )}

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />

        <Input
          type="search"
          placeholder="Buscar por histórico..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="h-10 pl-9"
          aria-label="Buscar lançamentos"
        />
      </div>

      {loading ? (
        <div className="rounded-3xl border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          Carregando lançamentos...
        </div>
      ) : lotesFiltrados.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento encontrado"
          description={busca ? 'Tente outro termo de busca.' : 'Registre o primeiro lançamento da empresa.'}
          action={
            <Button asChild variant="outline">
              <Link href={`/empresas/${id}/lancamentos/novo`}>Criar lançamento</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {lotesFiltrados.map(lote => {
            const totalDebitos = lote.lancamentos
              .filter(l => l.tipo === 'DEBITO')
              .reduce((acc, l) => acc + Number(l.valor), 0)

            const totalCreditos = lote.lancamentos
              .filter(l => l.tipo === 'CREDITO')
              .reduce((acc, l) => acc + Number(l.valor), 0)

            const isEstorno = lote.historico.startsWith('Estorno')
            const jaEstornado = !isEstorno && loteFoiEstornado(lote)
            const aberto = loteAberto === lote.id
            const podeEstornar =
              !isEstorno &&
              !jaEstornado &&
              (isAdmin || lote.usuarioId === usuarioAtual?.id)

            return (
              <Card
                key={lote.id}
                className={cn(
                  'overflow-hidden transition-shadow hover:shadow-md',
                  isEstorno && 'ring-amber-200/80',
                  jaEstornado && 'opacity-80'
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/40 sm:p-5"
                  onClick={() => setLoteAberto(aberto ? null : lote.id)}
                  aria-expanded={aberto}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                      {new Date(lote.data).toLocaleDateString('pt-BR')}
                    </span>

                    <span className={cn('truncate font-medium', isEstorno && 'text-amber-700 dark:text-amber-400')}>
                      {lote.historico}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      por {lote.usuario?.nome ?? 'Usuário'}
                    </span>

                    {isEstorno && <Badge variant="warning">Estorno</Badge>}
                    {jaEstornado && <Badge variant="secondary">Estornado</Badge>}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="financial-amount text-emerald-700 dark:text-emerald-400">
                      R$ {formatarMoeda(totalCreditos)}
                    </span>

                    <ChevronDown
                      className={cn('size-4 text-muted-foreground transition-transform', aberto && 'rotate-180')}
                      aria-hidden
                    />
                  </div>
                </button>

                {aberto && (
                  <CardContent className="border-t bg-muted/20 pt-0 pb-5">
                    <Table className="mt-4 border-0">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Conta</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {lote.lancamentos.map(l => (
                          <TableRow key={l.id}>
                            <TableCell>
                              <span className="font-mono text-xs text-muted-foreground">
                                {l.conta.codigo}
                              </span>
                              {' '}
                              {l.conta.nome}
                            </TableCell>

                            <TableCell>
                              <Badge variant={l.tipo === 'CREDITO' ? 'success' : 'destructive'}>
                                {l.tipo === 'CREDITO' ? 'Crédito' : 'Débito'}
                              </Badge>
                            </TableCell>

                            <TableCell
                              className={cn(
                                'text-right financial-amount',
                                l.tipo === 'CREDITO'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-red-700 dark:text-red-400'
                              )}
                            >
                              {l.tipo === 'CREDITO' ? '+' : '-'}R$ {formatarMoeda(l.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="financial-amount text-red-700 dark:text-red-400">
                          Débitos: R$ {formatarMoeda(totalDebitos)}
                        </span>

                        <span className="financial-amount text-emerald-700 dark:text-emerald-400">
                          Créditos: R$ {formatarMoeda(totalCreditos)}
                        </span>
                      </div>

                      {podeEstornar && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={() => setModalEstorno(lote)}
                        >
                          Estornar
                        </Button>
                      )}

                      {jaEstornado && (
                        <span className="text-xs text-muted-foreground">
                          Este lote já possui estorno registrado.
                        </span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
