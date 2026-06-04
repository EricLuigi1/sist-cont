'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Factory,
  FileText,
  Landmark,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export default function NovaEmpresaPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    endereco: '',
    cidade: '',
    estado: '',
  })

  function apenasNumeros(valor) {
    return String(valor || '').replace(/\D/g, '')
  }

  function formatarCnpj(valor) {
    const numeros = apenasNumeros(valor).slice(0, 14)

    return numeros
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  function validarCNPJ(cnpj) {
    const numeros = apenasNumeros(cnpj)

    if (numeros.length !== 14) return false
    if (/^(\d)\1+$/.test(numeros)) return false

    let tamanho = numeros.length - 2
    let numerosBase = numeros.substring(0, tamanho)
    const digitos = numeros.substring(tamanho)

    let soma = 0
    let pos = tamanho - 7

    for (let i = tamanho; i >= 1; i--) {
      soma += Number(numerosBase.charAt(tamanho - i)) * pos--
      if (pos < 2) pos = 9
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)

    if (resultado !== Number(digitos.charAt(0))) return false

    tamanho += 1
    numerosBase = numeros.substring(0, tamanho)
    soma = 0
    pos = tamanho - 7

    for (let i = tamanho; i >= 1; i--) {
      soma += Number(numerosBase.charAt(tamanho - i)) * pos--
      if (pos < 2) pos = 9
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)

    return resultado === Number(digitos.charAt(1))
  }

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'cnpj') {
      setForm(prev => ({ ...prev, cnpj: formatarCnpj(value) }))
      return
    }

    if (name === 'estado') {
      setForm(prev => ({ ...prev, estado: value.toUpperCase().slice(0, 2) }))
      return
    }

    setForm(prev => ({ ...prev, [name]: value }))
  }

  function validarFormulario() {
    const dados = {
      nome: form.nome.trim(),
      razaoSocial: form.razaoSocial.trim(),
      cnpj: form.cnpj.trim(),
      endereco: form.endereco.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase(),
    }

    if (!dados.nome) {
      return { valido: false, mensagem: 'Informe o nome fantasia da empresa.' }
    }

    if (!dados.razaoSocial) {
      return { valido: false, mensagem: 'Informe a razão social da empresa.' }
    }

    if (!dados.cnpj) {
      return { valido: false, mensagem: 'Informe o CNPJ da empresa.' }
    }

    if (!validarCNPJ(dados.cnpj)) {
      return { valido: false, mensagem: 'Informe um CNPJ válido.' }
    }

    if (!dados.endereco) {
      return { valido: false, mensagem: 'Informe o endereço da empresa.' }
    }

    if (!dados.cidade) {
      return { valido: false, mensagem: 'Informe a cidade da empresa.' }
    }

    if (!dados.estado) {
      return { valido: false, mensagem: 'Informe o estado da empresa.' }
    }

    if (!/^[A-Z]{2}$/.test(dados.estado)) {
      return {
        valido: false,
        mensagem: 'Informe o estado usando a sigla com 2 letras. Exemplo: SP.',
      }
    }

    return {
      valido: true,
      dados: {
        ...dados,
        cnpj: apenasNumeros(dados.cnpj),
      },
    }
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
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.dados),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        router.push(`/empresas/${data.id}`)
        return
      }

      setErro(data?.erro || 'Erro ao cadastrar empresa!')
    } catch {
      setErro('Não foi possível cadastrar a empresa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <Building2 className="size-5" aria-hidden />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight">
                PPEM Contabilidade
              </p>
              <p className="text-xs text-zinc-500">
                Cadastro de empresa
              </p>
            </div>
          </Link>

          <Button asChild variant="outline" className="h-10 rounded-2xl">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" aria-hidden />
              Voltar
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8 lg:py-16">
        <section className="hidden flex-col justify-center lg:flex">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm">
              <ShieldCheck className="size-4 text-zinc-950" />
              Novo workspace contábil
            </div>

            <h1 className="text-5xl font-semibold tracking-tight">
              Cadastre uma empresa e comece a organizar sua contabilidade.
            </h1>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              Crie um workspace para registrar lançamentos, controlar contas,
              gerar relatórios e convidar colaboradores.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                'Organize os dados principais da empresa',
                'Acesse DRE, balanço e fluxo de caixa',
                'Convide colaboradores para trabalhar no mesmo ambiente',
              ].map(item => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm"
                >
                  <CheckCircle2 className="size-5 text-zinc-950" aria-hidden />
                  <span className="text-sm text-zinc-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
                  <Factory className="size-5" aria-hidden />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Nova empresa
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Preencha os dados abaixo para criar um novo workspace contábil.
                </p>
              </div>

              {erro && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field label="Nome fantasia" htmlFor="nome">
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="nome"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      required
                      maxLength={80}
                      placeholder="Ex: Empresa Teste"
                      className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                    />
                  </div>
                </Field>

                <Field label="Razão social" htmlFor="razaoSocial">
                  <div className="relative">
                    <Landmark className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="razaoSocial"
                      name="razaoSocial"
                      value={form.razaoSocial}
                      onChange={handleChange}
                      required
                      maxLength={120}
                      placeholder="Razão social da empresa"
                      className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                    />
                  </div>
                </Field>

                <Field label="CNPJ" htmlFor="cnpj">
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="cnpj"
                      name="cnpj"
                      value={form.cnpj}
                      onChange={handleChange}
                      required
                      inputMode="numeric"
                      placeholder="00.000.000/0000-00"
                      className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                    />
                  </div>
                </Field>

                <Field label="Endereço" htmlFor="endereco">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="endereco"
                      name="endereco"
                      value={form.endereco}
                      onChange={handleChange}
                      required
                      maxLength={160}
                      placeholder="Rua, número e bairro"
                      className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                    />
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                  <Field label="Cidade" htmlFor="cidade">
                    <Input
                      id="cidade"
                      name="cidade"
                      value={form.cidade}
                      onChange={handleChange}
                      required
                      maxLength={80}
                      placeholder="Cidade"
                      className="h-11 rounded-xl border-zinc-200 bg-white"
                    />
                  </Field>

                  <Field label="Estado" htmlFor="estado">
                    <Input
                      id="estado"
                      name="estado"
                      value={form.estado}
                      onChange={handleChange}
                      required
                      maxLength={2}
                      placeholder="UF"
                      className="h-11 rounded-xl border-zinc-200 bg-white uppercase"
                    />
                  </Field>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-11 w-full rounded-xl gap-2"
                >
                  {loading ? 'Salvando...' : 'Cadastrar empresa'}
                  {!loading && <ArrowRight className="size-4" aria-hidden />}
                </Button>
              </form>

              <div className="mt-6 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500">
                Deseja voltar ao painel?{' '}
                <Link
                  href="/dashboard"
                  className="font-medium text-zinc-950 hover:underline"
                >
                  Ir para o dashboard
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400">
              © {new Date().getFullYear()} PPEM Contabilidade. Workspace seguro.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}