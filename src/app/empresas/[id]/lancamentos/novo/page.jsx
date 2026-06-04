'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatarMoedaInput, parseMoeda } from '@/lib/formatacao'
import { cn } from '@/lib/utils'

const tiposDevedores = ['ATIVO', 'DESPESA', 'CUSTO']

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

function calcularEfeitoNoSaldo(tipoConta, tipoLancamento, valor) {
  const contaDevedora = tiposDevedores.includes(tipoConta)

  if (contaDevedora) {
    return tipoLancamento === 'DEBITO' ? valor : -valor
  }

  return tipoLancamento === 'CREDITO' ? valor : -valor
}

function ContaInput({ contas, value, onChange }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  const contaSelecionada = contas.find(conta => conta.id === value)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!value) {
      setBusca('')
      return
    }

    const conta = contas.find(item => item.id === value)

    if (conta) {
      setBusca(`${conta.codigo} - ${conta.nome}`)
    }
  }, [value, contas])

  const sugestoes = busca.length === 0
    ? []
    : contas
        .filter(conta => {
          const termo = busca.toLowerCase()

          return (
            conta.nome.toLowerCase().includes(termo) ||
            conta.codigo.toLowerCase().includes(termo)
          )
        })
        .slice(0, 8)

  function selecionar(conta) {
    setBusca(`${conta.codigo} - ${conta.nome}`)
    setAberto(false)
    onChange(conta.id)
  }

  return (
    <div className="relative min-w-0 flex-1" ref={ref} style={{ zIndex: aberto ? 50 : 'auto' }}>
      <Search className="pointer-events-none absolute left-3 top-5 size-4 -translate-y-1/2 text-zinc-400" />

      <Input
        type="text"
        placeholder="Código ou nome da conta"
        value={busca}
        onChange={e => {
          setBusca(e.target.value)
          setAberto(true)

          if (!e.target.value) {
            onChange('')
          }
        }}
        onFocus={() => busca.length > 0 && setAberto(true)}
        className="h-10 rounded-xl border-zinc-200 bg-white pl-9 text-sm"
      />

      {contaSelecionada && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-zinc-500">Saldo atual:</span>
          <span
            className={cn(
              'financial-amount font-semibold',
              Number(contaSelecionada.saldo || 0) < 0
                ? 'text-red-700'
                : 'text-zinc-700'
            )}
          >
            {formatarSaldo(contaSelecionada.saldo)}
          </span>
        </div>
      )}

      {aberto && sugestoes.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1 shadow-xl">
          {sugestoes.map(conta => (
            <button
              key={conta.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => selecionar(conta)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100"
            >
              <span className="min-w-0 flex items-center gap-3">
                <span className="w-20 shrink-0 font-mono text-xs text-zinc-500">
                  {conta.codigo}
                </span>

                <span className="min-w-0 truncate font-medium text-zinc-800">
                  {conta.nome}
                </span>
              </span>

              <span
                className={cn(
                  'financial-amount shrink-0 text-xs font-semibold',
                  Number(conta.saldo || 0) < 0 ? 'text-red-700' : 'text-zinc-500'
                )}
              >
                {formatarSaldo(conta.saldo)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LinhasLancamento({
  titulo,
  tipo,
  linhas,
  contas,
  total,
  onAdd,
  onRemove,
  onUpdate,
  carregandoContas,
}) {
  const cor = tipo === 'debito' ? 'red' : 'emerald'

  return (
    <Card className="overflow-visible rounded-3xl border-zinc-200 bg-white shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            className={cn(
              'text-sm font-semibold uppercase tracking-[0.16em]',
              cor === 'red' ? 'text-red-700' : 'text-emerald-700'
            )}
          >
            {titulo}
          </h2>

          <span
            className={cn(
              'rounded-full px-3 py-1 text-sm font-semibold',
              cor === 'red'
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
            )}
          >
            R$ {formatarValor(total)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {linhas.map((linha, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 sm:flex-row sm:items-start"
            >
              <ContaInput
                contas={contas}
                value={linha.contaId}
                onChange={valor => onUpdate(index, 'contaId', valor)}
              />

              <Input
                type="text"
                placeholder="0,00"
                value={linha.valor}
                onChange={e => onUpdate(index, 'valor', e.target.value)}
                inputMode="decimal"
                className="financial-amount h-10 rounded-xl border-zinc-200 bg-white text-right text-sm sm:w-32"
              />

              {linhas.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="inline-flex h-10 items-center justify-center rounded-xl px-3 text-red-600 transition-colors hover:bg-red-50 sm:w-10"
                  aria-label={`Remover ${titulo.toLowerCase()}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="ml-2 text-sm sm:hidden">Remover</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={carregandoContas}
          className={cn(
            'mt-3 h-10 rounded-xl',
            cor === 'red'
              ? 'border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800'
              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
          )}
        >
          <Plus className="size-4" aria-hidden />
          Adicionar {tipo === 'debito' ? 'débito' : 'crédito'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function NovoLancamentoPage() {
  const params = useParams()
  const id = params.id

  const [contas, setContas] = useState([])
  const [carregandoContas, setCarregandoContas] = useState(true)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [historico, setHistorico] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [debitos, setDebitos] = useState([{ contaId: '', valor: '' }])
  const [creditos, setCreditos] = useState([{ contaId: '', valor: '' }])

  useEffect(() => {
    if (!id) return

    setCarregandoContas(true)

    fetch(`/api/empresas/${id}/contas`, {
      cache: 'no-store',
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContas(data.filter(conta => conta.analitica))
        } else {
          setContas([])
        }
      })
      .catch(() => {
        setContas([])
        setErro('Não foi possível carregar o plano de contas.')
      })
      .finally(() => setCarregandoContas(false))
  }, [id])

  function addDebito() {
    setDebitos(prev => [...prev, { contaId: '', valor: '' }])
  }

  function addCredito() {
    setCreditos(prev => [...prev, { contaId: '', valor: '' }])
  }

  function removeDebito(index) {
    setDebitos(prev => prev.filter((_, i) => i !== index))
  }

  function removeCredito(index) {
    setCreditos(prev => prev.filter((_, i) => i !== index))
  }

  function updateDebito(index, field, value) {
    setDebitos(prev => {
      const novo = [...prev]

      novo[index] = {
        ...novo[index],
        [field]: field === 'valor' ? formatarMoedaInput(value) : value,
      }

      return novo
    })
  }

  function updateCredito(index, field, value) {
    setCreditos(prev => {
      const novo = [...prev]

      novo[index] = {
        ...novo[index],
        [field]: field === 'valor' ? formatarMoedaInput(value) : value,
      }

      return novo
    })
  }

  const totalDebitos = debitos.reduce((acc, lancamento) => acc + parseMoeda(lancamento.valor), 0)
  const totalCreditos = creditos.reduce((acc, lancamento) => acc + parseMoeda(lancamento.valor), 0)
  const diferenca = Math.abs(totalDebitos - totalCreditos)
  const balanceado = diferenca < 0.01 && totalDebitos > 0

  function validarSaldosDisponiveis() {
    const efeitosPorConta = {}

    const movimentos = [
      ...debitos.map(lancamento => ({
        ...lancamento,
        tipo: 'DEBITO',
      })),
      ...creditos.map(lancamento => ({
        ...lancamento,
        tipo: 'CREDITO',
      })),
    ]

    

    for (const movimento of movimentos) {
      const conta = contas.find(item => item.id === movimento.contaId)
      const valor = parseMoeda(movimento.valor)

      if (!conta) continue

      const efeito = calcularEfeitoNoSaldo(conta.tipo, movimento.tipo, valor)

      if (!efeitosPorConta[conta.id]) {
        efeitosPorConta[conta.id] = {
          conta,
          efeito: 0,
        }
      }

      efeitosPorConta[conta.id].efeito += efeito
    }

    const contaNegativa = Object.values(efeitosPorConta).find(({ conta, efeito }) => {
      const saldoAtual = Number(conta.saldo || 0)
      const saldoFinal = saldoAtual + efeito

      return saldoFinal < -0.01
    })

    if (!contaNegativa) {
      return { valido: true }
    }

    const saldoAtual = Number(contaNegativa.conta.saldo || 0)
    const saldoFinal = saldoAtual + contaNegativa.efeito

    return {
      valido: false,
      mensagem:
        `A conta "${contaNegativa.conta.codigo} - ${contaNegativa.conta.nome}" não possui saldo suficiente. ` +
        `Saldo atual: ${formatarSaldo(saldoAtual)}. Saldo após o lançamento: ${formatarSaldo(saldoFinal)}.`,
    }
  }

  function validarFormulario() {
    const historicoTratado = historico.trim()

    if (!historicoTratado) {
      return { valido: false, mensagem: 'Histórico é obrigatório.' }
    }

    if (historicoTratado.length > 255) {
      return { valido: false, mensagem: 'O histórico deve ter no máximo 255 caracteres.' }
    }

    if (!data) {
      return { valido: false, mensagem: 'Data é obrigatória.' }
    }

    const dataTeste = new Date(`${data}T12:00:00`)

    if (Number.isNaN(dataTeste.getTime())) {
      return { valido: false, mensagem: 'Informe uma data válida.' }
    }

    const debitoSemConta = debitos.findIndex(lancamento => !lancamento.contaId)
    if (debitoSemConta !== -1) {
      return { valido: false, mensagem: `Selecione uma conta para o débito ${debitoSemConta + 1}.` }
    }

    const creditoSemConta = creditos.findIndex(lancamento => !lancamento.contaId)
    if (creditoSemConta !== -1) {
      return { valido: false, mensagem: `Selecione uma conta para o crédito ${creditoSemConta + 1}.` }
    }

    const debitoSemValor = debitos.findIndex(lancamento => parseMoeda(lancamento.valor) <= 0)
    if (debitoSemValor !== -1) {
      return { valido: false, mensagem: `Informe um valor maior que zero para o débito ${debitoSemValor + 1}.` }
    }

    const creditoSemValor = creditos.findIndex(lancamento => parseMoeda(lancamento.valor) <= 0)
    if (creditoSemValor !== -1) {
      return { valido: false, mensagem: `Informe um valor maior que zero para o crédito ${creditoSemValor + 1}.` }
    }

    if (!balanceado) {
      return {
        valido: false,
        mensagem: `Total de débitos (R$ ${formatarValor(totalDebitos)}) deve ser igual ao total de créditos (R$ ${formatarValor(totalCreditos)}).`,
      }
    }

    const validacaoSaldo = validarSaldosDisponiveis()

    if (!validacaoSaldo.valido) {
      return validacaoSaldo
    }

    const lancamentos = [
      ...debitos.map(lancamento => ({
        contaId: lancamento.contaId,
        valor: parseMoeda(lancamento.valor),
        tipo: 'DEBITO',
      })),
      ...creditos.map(lancamento => ({
        contaId: lancamento.contaId,
        valor: parseMoeda(lancamento.valor),
        tipo: 'CREDITO',
      })),
    ]

    return {
      valido: true,
      dados: {
        historico: historicoTratado,
        data,
        lancamentos,
      },
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    const validacao = validarFormulario()

    if (!validacao.valido) {
      setErro(validacao.mensagem)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/empresas/${id}/lancamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.dados),
      })

      const data = await res.json().catch(() => null)

    if (res.ok) {
      setSucesso('Lançamento salvo com sucesso!')
      setHistorico('')
      setData(new Date().toISOString().split('T')[0])
      setDebitos([{ contaId: '', valor: '' }])
      setCreditos([{ contaId: '', valor: '' }])
      setErro('')

      fetch(`/api/empresas/${id}/contas`, {
        cache: 'no-store',
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setContas(data.filter(conta => conta.analitica))
          }
        })

      return
    }

      setErro(data?.erro || 'Erro ao salvar lançamento.')
    } catch {
      setErro('Não foi possível salvar o lançamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Novo lançamento"
        description="Registre débitos e créditos de forma balanceada"
        actions={
          <Button type="button" variant="outline" asChild className="rounded-xl">
            <Link href={`/empresas/${id}/lancamentos`}>
              <ArrowLeft className="size-4" aria-hidden />
              Voltar
            </Link>
          </Button>
        }
      />

      {erro && (
        <Alert variant="destructive" className="mt-4 rounded-2xl">
          {erro}
        </Alert>
      )}
  
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <Card className="rounded-3xl border-zinc-200 bg-white shadow-sm">
          <CardContent className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_180px]">
            <Field label="Histórico" htmlFor="historico">
              <Input
                id="historico"
                value={historico}
                onChange={e => setHistorico(e.target.value)}
                required
                maxLength={255}
                placeholder="Ex: Venda de produtos à vista"
                className="h-10 rounded-xl border-zinc-200 bg-white"
              />
            </Field>

            <Field label="Data" htmlFor="data">
              <Input
                id="data"
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                required
                className="h-10 rounded-xl border-zinc-200 bg-white"
              />
            </Field>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <LinhasLancamento
            titulo="Débitos"
            tipo="debito"
            linhas={debitos}
            contas={contas}
            total={totalDebitos}
            onAdd={addDebito}
            onRemove={removeDebito}
            onUpdate={updateDebito}
            carregandoContas={carregandoContas}
          />

          <LinhasLancamento
            titulo="Créditos"
            tipo="credito"
            linhas={creditos}
            contas={contas}
            total={totalCreditos}
            onAdd={addCredito}
            onRemove={removeCredito}
            onUpdate={updateCredito}
            carregandoContas={carregandoContas}
          />
        </div>

        <Card
          className={cn(
            'rounded-3xl border shadow-sm',
            balanceado
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          )}
        >
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-2xl text-white',
                  balanceado ? 'bg-emerald-600' : 'bg-red-600'
                )}
              >
                {balanceado ? (
                  <CheckCircle2 className="size-5" aria-hidden />
                ) : (
                  <CircleAlert className="size-5" aria-hidden />
                )}
              </div>

              <div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    balanceado ? 'text-emerald-900' : 'text-red-900'
                  )}
                >
                  {balanceado ? 'Lançamento balanceado' : 'Diferença no lançamento'}
                </p>

                <p
                  className={cn(
                    'mt-0.5 text-sm',
                    balanceado ? 'text-emerald-700' : 'text-red-700'
                  )}
                >
                  Débitos: R$ {formatarValor(totalDebitos)} | Créditos: R$ {formatarValor(totalCreditos)} | Diferença: R$ {formatarValor(diferenca)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                disabled={loading || !balanceado || carregandoContas}
                className="h-10 rounded-xl px-5"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>

              <Button
                type="button"
                variant="outline"
                asChild
                className="h-10 rounded-xl px-5"
              >
                <Link href={`/empresas/${id}/lancamentos`}>
                  Cancelar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
