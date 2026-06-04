'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Info,
  Layers3,
  Save,
} from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const tiposLabel = {
  ATIVO: 'Ativo',
  PASSIVO: 'Passivo',
  PATRIMONIO_LIQUIDO: 'Patrimônio Líquido',
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
  CUSTO: 'Custo',
  RESULTADO: 'Resultado',
}

const naturezasDRE = {
  RECEITA: [
    { value: 'RECEITA_BRUTA', label: 'Receita Operacional Bruta' },
    { value: 'RECEITA_FINANCEIRA', label: 'Receita Financeira' },
    { value: 'RECEITA_OPERACIONAL_OUTRAS', label: 'Outras Receitas Operacionais' },
    { value: 'OUTRAS_RECEITAS', label: 'Outras Receitas' },
  ],
  DESPESA: [
    { value: 'DEDUCAO', label: 'Dedução ou Abatimento' },
    { value: 'DESPESA_VENDAS', label: 'Despesa com Vendas' },
    { value: 'DESPESA_FINANCEIRA', label: 'Despesa Financeira' },
    { value: 'DESPESA_ADMINISTRATIVA', label: 'Despesa Geral e Administrativa' },
    { value: 'DESPESA_OUTRAS', label: 'Outras Despesas Operacionais' },
    { value: 'OUTRAS_DESPESAS', label: 'Outras Despesas' },
  ],
  CUSTO: [
    { value: 'CUSTO_OPERACIONAL', label: 'Custo Operacional' },
  ],
}

export default function NovaContaPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id
  const voltar = searchParams.get('voltar') || `/empresas/${id}/contas`

  const [loading, setLoading] = useState(false)
  const [carregandoContas, setCarregandoContas] = useState(true)
  const [erro, setErro] = useState('')
  const [contas, setContas] = useState([])
  const [form, setForm] = useState({
    nome: '',
    tipo: 'ATIVO',
    contaPaiId: '',
    analitica: true,
    naturezaDRE: '',
  })

  useEffect(() => {
    if (!id) return

    setCarregandoContas(true)

    fetch(`/api/empresas/${id}/contas`)
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
        setErro('Não foi possível carregar as contas.')
      })
      .finally(() => setCarregandoContas(false))
  }, [id])

  const contasPaiDisponiveis = useMemo(() => {
    return contas.filter(conta => {
      return conta.tipo === form.tipo && !conta.analitica
    })
  }, [contas, form.tipo])

  const naturezasDisponiveis = naturezasDRE[form.tipo] || []
  const exigeNaturezaDRE = form.analitica && naturezasDisponiveis.length > 0

  function handleChange(e) {
    const { name, type, checked, value } = e.target
    const novoValor = type === 'checkbox' ? checked : value

    setForm(prev => {
      const atualizado = {
        ...prev,
        [name]: novoValor,
      }

      if (name === 'tipo') {
        atualizado.contaPaiId = ''
        atualizado.naturezaDRE = ''
      }

      if (name === 'analitica' && !checked) {
        atualizado.naturezaDRE = ''
      }

      return atualizado
    })
  }

  function validarFormulario() {
    const dados = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      contaPaiId: form.contaPaiId || null,
      analitica: Boolean(form.analitica),
      naturezaDRE: form.naturezaDRE || null,
    }

    if (!dados.nome) {
      return { valido: false, mensagem: 'Nome da conta é obrigatório.' }
    }

    if (dados.nome.length < 3) {
      return { valido: false, mensagem: 'O nome da conta deve ter pelo menos 3 caracteres.' }
    }

    if (dados.nome.length > 120) {
      return { valido: false, mensagem: 'O nome da conta deve ter no máximo 120 caracteres.' }
    }

    if (!tiposLabel[dados.tipo]) {
      return { valido: false, mensagem: 'Tipo de conta inválido.' }
    }

    if (!dados.contaPaiId) {
      return { valido: false, mensagem: 'Selecione uma conta pai para gerar o código corretamente.' }
    }

    if (exigeNaturezaDRE && !dados.naturezaDRE) {
      return {
        valido: false,
        mensagem: 'Selecione a natureza DRE para essa conta analítica.',
      }
    }

    return { valido: true, dados }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    const validacao = validarFormulario()

    if (!validacao.valido) {
      setErro(validacao.mensagem)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/empresas/${id}/contas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.dados),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        router.push(voltar)
        return
      }

      setErro(data?.erro || 'Erro ao cadastrar conta.')
    } catch {
      setErro('Não foi possível cadastrar a conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const selectClass = 'h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 shadow-sm outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Nova conta
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cadastre uma nova conta no plano de contas da empresa.
          </p>
        </div>

        <Button asChild variant="outline" className="rounded-xl">
          <Link href={voltar}>
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Link>
        </Button>
      </div>

      {erro && (
        <Alert variant="destructive" className="mb-4 rounded-2xl">
          {erro}
        </Alert>
      )}

      <Card className="overflow-hidden rounded-3xl border-zinc-200 bg-white shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <BookOpen className="size-5" aria-hidden />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Dados da conta
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                A natureza DRE aparece apenas para contas analíticas de receita, despesa ou custo.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="Nome da conta" htmlFor="nome">
              <Input
                id="nome"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                maxLength={120}
                placeholder="Ex: Despesas com Internet"
                className="h-11 rounded-xl border-zinc-200 bg-white"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo" htmlFor="tipo">
                <select
                  id="tipo"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {Object.entries(tiposLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Conta pai" htmlFor="contaPaiId" hint="O código será gerado automaticamente.">
                <select
                  id="contaPaiId"
                  name="contaPaiId"
                  value={form.contaPaiId}
                  onChange={handleChange}
                  disabled={carregandoContas}
                  className={selectClass}
                >
                  <option value="">
                    {carregandoContas ? 'Carregando...' : 'Selecione uma conta pai'}
                  </option>

                  {contasPaiDisponiveis.map(conta => (
                    <option key={conta.id} value={conta.id}>
                      {conta.codigo} - {conta.nome}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 transition-colors hover:bg-zinc-100">
              <input
                type="checkbox"
                name="analitica"
                checked={form.analitica}
                onChange={handleChange}
                className="mt-1 size-4"
              />

              <div>
                <span className="text-sm font-medium text-zinc-950">
                  Conta analítica
                </span>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Marque quando a conta puder receber lançamentos. Contas sintéticas servem apenas para agrupar subcontas.
                </p>
              </div>
            </label>

            {exigeNaturezaDRE && (
              <Field
                label="Natureza na DRE"
                htmlFor="naturezaDRE"
                hint="Define em qual linha essa conta aparecerá na Demonstração do Resultado."
              >
                <select
                  id="naturezaDRE"
                  name="naturezaDRE"
                  value={form.naturezaDRE}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Selecione a natureza...</option>
                  {naturezasDisponiveis.map(natureza => (
                    <option key={natureza.value} value={natureza.value}>
                      {natureza.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {!exigeNaturezaDRE && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-500 shadow-sm">
                    <Info className="size-4" aria-hidden />
                  </div>

                  <p className="text-sm leading-6 text-zinc-500">
                    {form.analitica
                      ? 'Este tipo de conta não participa diretamente da DRE.'
                      : 'Contas sintéticas não precisam de natureza DRE, pois apenas agrupam outras contas.'}
                  </p>
                </div>
              </div>
            )}

            {form.analitica && form.naturezaDRE && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <CheckCircle2 className="size-4" aria-hidden />
                  </div>

                  <p className="text-sm leading-6 text-emerald-800">
                    Esta conta será considerada na DRE conforme a natureza selecionada.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                type="submit"
                disabled={loading || carregandoContas}
                className="h-11 rounded-xl px-5"
              >
                <Save className="size-4" aria-hidden />
                {loading ? 'Salvando...' : 'Cadastrar conta'}
              </Button>

              <Button
                type="button"
                variant="outline"
                asChild
                className="h-11 rounded-xl px-5"
              >
                <Link href={voltar}>
                  Cancelar
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
            <Layers3 className="size-5" aria-hidden />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              Dica de estrutura
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Para criar uma conta que apareça na DRE, selecione um tipo como Receita,
              Despesa ou Custo, marque como analítica e escolha a natureza correspondente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
