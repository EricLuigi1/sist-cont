'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Edit2,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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

const tiposLabel = {
  ATIVO: 'Ativo',
  PASSIVO: 'Passivo',
  PATRIMONIO_LIQUIDO: 'Patrimônio Líquido',
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
  CUSTO: 'Custo',
  RESULTADO: 'Resultado',
}

const resumoTipos = [
  { tipo: 'ATIVO', label: 'Ativo' },
  { tipo: 'PASSIVO', label: 'Passivo' },
  { tipo: 'PATRIMONIO_LIQUIDO', label: 'Patrimônio Líquido' },
  { tipo: 'RECEITA', label: 'Receitas' },
  { tipo: 'DESPESA', label: 'Despesas' },
  { tipo: 'CUSTO', label: 'Custos' },
]

function getIndentacao(codigo) {
  const nivel = codigo.split('.').length

  if (nivel === 1) return 'font-semibold text-zinc-950'
  if (nivel === 2) return 'pl-4 font-medium text-zinc-800'

  return 'pl-8 text-zinc-600'
}

function formatarValor(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatarSaldo(valor) {
  const numero = Number(valor || 0)

  if (Math.abs(numero) < 0.01) {
    return 'R$ 0,00'
  }

  if (numero < 0) {
    return `(R$ ${formatarValor(Math.abs(numero))})`
  }

  return `R$ ${formatarValor(numero)}`
}

function codigoRaizPorTipo(tipo) {
  const mapa = {
    ATIVO: '1',
    PASSIVO: '2',
    PATRIMONIO_LIQUIDO: '3',
    RECEITA: '4',
    DESPESA: '5',
    CUSTO: '6',
    RESULTADO: '7',
  }

  return mapa[tipo]
}

export default function ContasPage() {
  const pathname = usePathname()
  const id = pathname.split('/')[2]

  const [contas, setContas] = useState([])
  const [busca, setBusca] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nomeEditado, setNomeEditado] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(true)

  function carregarContas() {
    setLoading(true)
    setErro('')

    fetch(`/api/empresas/${id}/contas`, {
      cache: 'no-store',
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContas(data)
        } else {
          setContas([])
          setErro(data?.erro || 'Erro ao carregar contas.')
        }
      })
      .catch(() => {
        setContas([])
        setErro('Não foi possível carregar o plano de contas.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregarContas()

    fetch(`/api/empresas/${id}`)
      .then(res => res.json())
      .then(data => setIsAdmin(data.papel === 'ADMIN'))
      .catch(() => setIsAdmin(false))
  }, [id])

  const contasFiltradas = contas.filter(conta => {
    const termo = busca.toLowerCase().trim()

    if (!termo) return true

    return (
      conta.nome.toLowerCase().includes(termo) ||
      conta.codigo.includes(termo) ||
      tiposLabel[conta.tipo]?.toLowerCase().includes(termo)
    )
  })

  const resumo = useMemo(() => {
    return resumoTipos.map(item => {
      const codigoRaiz = codigoRaizPorTipo(item.tipo)
      const contaRaiz = contas.find(conta => conta.codigo === codigoRaiz)
      const saldo = contaRaiz?.saldo || 0

      return {
        ...item,
        saldo,
      }
    }).filter(item => {
      return contas.some(conta => conta.tipo === item.tipo)
    })
  }, [contas])

  async function handleEditar(conta) {
    setErro('')

    if (editando === conta.id) {
      const nome = nomeEditado.trim()

      if (!nome) {
        setErro('Nome da conta é obrigatório.')
        return
      }

      const res = await fetch(`/api/empresas/${id}/contas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: conta.id,
          nome,
        }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setEditando(null)
        setNomeEditado('')
        carregarContas()
      } else {
        setErro(data?.erro || 'Erro ao editar conta.')
      }

      return
    }

    setEditando(conta.id)
    setNomeEditado(conta.nome)
  }

  async function handleExcluir(contaId) {
    setErro('')

    if (!confirm('Tem certeza que deseja excluir esta conta?')) return

    const res = await fetch(`/api/empresas/${id}/contas?contaId=${contaId}`, {
      method: 'DELETE',
    })

    const data = await res.json().catch(() => null)

    if (res.ok) {
      carregarContas()
    } else {
      setErro(data?.erro || 'Erro ao excluir conta.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Plano de Contas"
        description="Estrutura contábil da empresa com saldo atualizado por conta"
        actions={
          isAdmin && (
            <Button asChild className="rounded-xl">
              <Link href={`/empresas/${id}/contas/nova`}>
                <Plus className="size-4" aria-hidden />
                Nova conta
              </Link>
            </Button>
          )
        }
      />

      {erro && (
        <Alert variant="destructive" className="mt-4 rounded-2xl">
          {erro}
        </Alert>
      )}

      {resumo.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {resumo.map(item => (
            <div
              key={item.tipo}
              className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                {item.label}
              </p>
              <p
                className={cn(
                  'mt-2 text-lg font-semibold tracking-tight',
                  item.saldo < 0 ? 'text-red-700' : 'text-zinc-950'
                )}
              >
                {formatarSaldo(item.saldo)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="relative mt-6">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Buscar por código, nome ou tipo..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="h-11 rounded-xl border-zinc-200 bg-white pl-9"
          aria-label="Buscar contas"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-zinc-500">
            Carregando contas...
          </div>
        ) : contasFiltradas.length === 0 ? (
          <div className="p-8">
            <EmptyState title="Nenhuma conta encontrada" />
          </div>
        ) : (
          <Table enterprise>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-40">Tipo</TableHead>
                <TableHead className="w-32">Natureza</TableHead>
                <TableHead className="w-40 text-right">Saldo</TableHead>
                {isAdmin && <TableHead className="w-44 text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody>
              {contasFiltradas.map(conta => {
                const saldo = Number(conta.saldo || 0)
                const saldoZerado = Math.abs(saldo) < 0.01

                return (
                  <TableRow key={conta.id}>
                    <TableCell className="font-mono text-xs tabular-nums text-zinc-500">
                      {conta.codigo}
                    </TableCell>

                    <TableCell className={getIndentacao(conta.codigo)}>
                      {editando === conta.id ? (
                        <Input
                          value={nomeEditado}
                          onChange={e => setNomeEditado(e.target.value)}
                          className="h-9 rounded-xl border-zinc-200 bg-white"
                          autoFocus
                        />
                      ) : (
                        <span className="block truncate">
                          {conta.nome}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-zinc-500">
                      {tiposLabel[conta.tipo] || conta.tipo}
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          conta.analitica
                            ? 'bg-zinc-100 text-zinc-700'
                            : 'bg-zinc-950 text-white'
                        )}
                      >
                        {conta.analitica ? 'Analítica' : 'Sintética'}
                      </span>
                    </TableCell>

                    <TableCell
                      className={cn(
                        'financial-amount text-right font-semibold',
                        saldo < 0 && 'text-red-700',
                        saldoZerado && 'text-zinc-400'
                      )}
                    >
                      {formatarSaldo(saldo)}
                    </TableCell>

                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditar(conta)}
                            className="rounded-xl"
                          >
                            {editando === conta.id ? (
                              <>
                                <Save className="size-4" aria-hidden />
                                Salvar
                              </>
                            ) : (
                              <>
                                <Edit2 className="size-4" aria-hidden />
                                Editar
                              </>
                            )}
                          </Button>

                          {editando === conta.id ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditando(null)
                                setNomeEditado('')
                              }}
                              className="rounded-xl"
                            >
                              <X className="size-4" aria-hidden />
                              Cancelar
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-red-600 hover:text-red-700"
                              onClick={() => handleExcluir(conta.id)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
