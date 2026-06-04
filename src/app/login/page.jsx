'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const res = await signIn('credentials', {
      email: form.email,
      senha: form.senha,
      redirect: false,
    })

    if (res?.error) {
      setErro('Email ou senha incorretos!')
      setLoading(false)
    } else {
      router.push('/dashboard')
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
            href="/cadastro"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100"
          >
            Criar conta
          </Link>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-16">
        <section className="hidden flex-col justify-center lg:flex">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm">
              <ShieldCheck className="size-4 text-zinc-950" />
              Acesso seguro ao painel
            </div>

            <h1 className="text-5xl font-semibold tracking-tight">
              Entre e continue sua gestão contábil.
            </h1>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              Acesse empresas, lançamentos, relatórios e indicadores em um painel moderno, simples e organizado.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                'Relatórios contábeis em poucos cliques',
                'Controle de empresas e colaboradores',
                'Ambiente moderno para sua rotina financeira',
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
          <div className="w-full max-w-md">
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-8">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
                  <LockKeyhole className="size-5" aria-hidden />
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  Entrar na sua conta
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Acesse o painel da PPEM Contabilidade para continuar.
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

                <Field label="Senha" htmlFor="senha">
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="senha"
                      name="senha"
                      type="password"
                      value={form.senha}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      className="h-11 rounded-xl border-zinc-200 bg-white pl-10"
                    />
                  </div>
                </Field>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-11 w-full rounded-xl gap-2"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                  {!loading && <ArrowRight className="size-4" aria-hidden />}
                </Button>
              </form>

              <div className="mt-6 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500">
                Não tem conta?{' '}
                <Link
                  href="/cadastro"
                  className="font-medium text-zinc-950 hover:underline"
                >
                  Cadastre-se
                </Link>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400">
              © {new Date().getFullYear()} PPEM Contabilidade. Acesso seguro ao sistema.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}