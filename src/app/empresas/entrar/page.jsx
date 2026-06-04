'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export default function EntrarEmpresaPage() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(false)
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  function handleChange(e) {
    setCodigo(e.target.value.trim())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!codigo.trim()) {
      setErro('Informe o código de convite.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/empresas/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigo.trim() }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setPedidoEnviado(true)
        setCodigo('')
        setSucesso(
          data?.mensagem ||
            'Pedido enviado com sucesso. Aguarde a aprovação do administrador.'
        )

        setTimeout(() => {
          router.push('/dashboard')
        }, 2500)

        return
      }

      setErro(data?.erro || 'Código inválido!')
    } catch {
      setErro('Não foi possível enviar o pedido. Tente novamente.')
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
                Solicitar acesso
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
              Acesso com aprovação
            </div>

            <h1 className="text-5xl font-semibold tracking-tight">
              Solicite entrada em uma empresa usando o código de convite.
            </h1>

            <p className="mt-5 text-lg leading-8 text-zinc-600">
              Agora, ao usar um código de convite, sua solicitação será enviada
              para o administrador da empresa. O acesso só será liberado após a aprovação.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                'Mais segurança para o workspace da empresa',
                'Entrada somente após aprovação do administrador',
                'Controle de colaboradores em um único ambiente',
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
                  {pedidoEnviado ? (
                    <Clock3 className="size-5" aria-hidden />
                  ) : (
                    <KeyRound className="size-5" aria-hidden />
                  )}
                </div>

                <h2 className="text-2xl font-semibold tracking-tight">
                  {pedidoEnviado ? 'Pedido enviado' : 'Solicitar acesso'}
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {pedidoEnviado
                    ? 'Seu pedido foi enviado ao administrador. Você será redirecionado para o dashboard.'
                    : 'Digite o código de convite fornecido pelo administrador da empresa.'}
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

              {sucesso && (
                <Alert
                  variant="success"
                  className="mb-4 rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  {sucesso}
                </Alert>
              )}

              {!pedidoEnviado && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Field label="Código de convite" htmlFor="codigo">
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        id="codigo"
                        type="text"
                        value={codigo}
                        onChange={handleChange}
                        required
                        placeholder="Ex: abc123..."
                        autoComplete="off"
                        className="h-11 rounded-xl border-zinc-200 bg-white pl-10 font-mono"
                      />
                    </div>
                  </Field>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-11 w-full rounded-xl gap-2"
                  >
                    {loading ? 'Enviando pedido...' : 'Enviar pedido de acesso'}
                    {!loading && <ArrowRight className="size-4" aria-hidden />}
                  </Button>
                </form>
              )}

              {pedidoEnviado && (
                <Button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="h-11 w-full rounded-xl"
                >
                  Voltar ao dashboard
                </Button>
              )}

              <div className="mt-6 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500">
                Não tem um código?{' '}
                <Link
                  href="/dashboard"
                  className="font-medium text-zinc-950 hover:underline"
                >
                  Voltar ao painel
                </Link>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                  <Users className="size-4" aria-hidden />
                </div>

                <p className="text-xs leading-5 text-zinc-500">
                  O código de convite apenas cria um pedido de acesso. A entrada
                  na empresa depende da aprovação de um administrador do workspace.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-400">
              © {new Date().getFullYear()} PPEM Contabilidade. Acesso seguro por convite.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}