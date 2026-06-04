'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  IdCard,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export default function CadastroPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
  })

  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  function apenasNumeros(valor) {
    return String(valor || '').replace(/\D/g, '')
  }

  function formatarCPF(valor) {
    const numeros = apenasNumeros(valor).slice(0, 11)

    return numeros
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }

  function formatarTelefone(valor) {
    const numeros = apenasNumeros(valor).slice(0, 11)

    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }

    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function validarCPF(cpf) {
    const numeros = apenasNumeros(cpf)

    if (numeros.length !== 11) return false
    if (/^(\d)\1+$/.test(numeros)) return false

    let soma = 0

    for (let i = 0; i < 9; i++) {
      soma += Number(numeros[i]) * (10 - i)
    }

    let primeiroDigito = 11 - (soma % 11)
    if (primeiroDigito >= 10) primeiroDigito = 0

    if (primeiroDigito !== Number(numeros[9])) return false

    soma = 0

    for (let i = 0; i < 10; i++) {
      soma += Number(numeros[i]) * (11 - i)
    }

    let segundoDigito = 11 - (soma % 11)
    if (segundoDigito >= 10) segundoDigito = 0

    return segundoDigito === Number(numeros[10])
  }

  function validarTelefone(telefone) {
    const numeros = apenasNumeros(telefone)
    return numeros.length === 10 || numeros.length === 11
  }

  function validarSenha(senha) {
    return (
      senha.length >= 8 &&
      /[A-Za-zÀ-ÿ]/.test(senha) &&
      /\d/.test(senha)
    )
  }

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'cpf') {
      setForm(prev => ({
        ...prev,
        cpf: formatarCPF(value),
      }))
      return
    }

    if (name === 'telefone') {
      setForm(prev => ({
        ...prev,
        telefone: formatarTelefone(value),
      }))
      return
    }

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  function validarFormulario() {
    const dados = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      cpf: apenasNumeros(form.cpf),
      telefone: apenasNumeros(form.telefone),
      senha: form.senha,
    }

    if (!dados.nome || !dados.email || !dados.cpf || !dados.telefone || !dados.senha) {
      return {
        valido: false,
        mensagem: 'Preencha todos os campos obrigatórios.',
      }
    }

    if (dados.nome.length < 3) {
      return {
        valido: false,
        mensagem: 'O nome deve ter pelo menos 3 caracteres.',
      }
    }

    if (!validarEmail(dados.email)) {
      return {
        valido: false,
        mensagem: 'Informe um email válido.',
      }
    }

    if (!validarCPF(dados.cpf)) {
      return {
        valido: false,
        mensagem: 'Informe um CPF válido.',
      }
    }

    if (!validarTelefone(dados.telefone)) {
      return {
        valido: false,
        mensagem: 'Informe um telefone válido com DDD.',
      }
    }

    if (!validarSenha(dados.senha)) {
      return {
        valido: false,
        mensagem: 'A senha deve ter pelo menos 8 caracteres, incluindo letras e números.',
      }
    }

    return {
      valido: true,
      dados,
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
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.dados),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        router.push('/login')
        return
      }

      setErro(data?.erro || 'Erro ao cadastrar!')
    } catch {
      setErro('Não foi possível cadastrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <Building2 className="size-5" aria-hidden />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight">
                PPEM Contabilidade
              </p>
              <p className="text-xs text-zinc-500">
                Gestão contábil moderna
              </p>
            </div>
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:px-8 lg:py-16">
        <section className="hidden flex-col justify-center lg:flex">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm">
              <ShieldCheck className="size-4 text-zinc-950" />
              Cadastro rápido e seguro
            </div>

            <h1 className="text-5xl font-semibold tracking-tight">
              Crie sua conta e organize sua rotina contábil.
            </h1>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              Comece a usar a PPEM Contabilidade para gerenciar empresas,
              colaboradores, lançamentos e relatórios em uma plataforma moderna.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                'Crie e gerencie múltiplas empresas',
                'Convide colaboradores para o workspace',
                'Acesse relatórios contábeis com visual profissional',
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
                  <User className="size-5" aria-hidden />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Criar conta
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Preencha seus dados para começar a usar a PPEM Contabilidade.
                </p>
              </div>

              {erro && (
                <Alert
                  variant="destructive"
                  className="mb-4 rounded-2xl border-red-200 bg-red-50 text-red-700"
                >
                  {erro}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field label="Nome completo" htmlFor="nome">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="nome"
                      name="nome"
                      type="text"
                      value={form.nome}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      placeholder="Seu nome completo"
                      className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                    />
                  </div>
                </Field>

                <Field label="Email" htmlFor="email">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      placeholder="seuemail@exemplo.com"
                      className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                    />
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="CPF" htmlFor="cpf">
                    <div className="relative">
                      <IdCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="cpf"
                        name="cpf"
                        type="text"
                        value={form.cpf}
                        onChange={handleChange}
                        required
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                      />
                    </div>
                  </Field>

                  <Field label="Telefone" htmlFor="telefone">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="telefone"
                        name="telefone"
                        type="text"
                        value={form.telefone}
                        onChange={handleChange}
                        required
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="(00) 00000-0000"
                        className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                      />
                    </div>
                  </Field>
                </div>

                <Field
                  label="Senha"
                  htmlFor="senha"
                  hint="Use pelo menos 8 caracteres, com letras e números."
                >
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="senha"
                      name="senha"
                      type="password"
                      value={form.senha}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                      placeholder="Crie uma senha segura"
                      className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                    />
                  </div>
                </Field>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-11 w-full rounded-xl gap-2"
                >
                  {loading ? 'Cadastrando...' : 'Criar conta'}
                  {!loading && <ArrowRight className="size-4" aria-hidden />}
                </Button>
              </form>

              <div className="mt-6 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500">
                Já tem conta?{' '}
                <Link
                  href="/login"
                  className="font-medium text-zinc-950 hover:underline"
                >
                  Faça login
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400">
              © {new Date().getFullYear()} PPEM Contabilidade. Cadastro seguro.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
