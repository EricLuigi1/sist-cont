import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import BotaoSair from '@/components/BotaoSair'
import {
  ArrowRight,
  Building2,
  FileText,
  KeyRound,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DeleteEmpresaButton from '@/components/DeleteEmpresaButton'
import { Card, CardContent } from '@/components/ui/card'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const vinculos = await prisma.empresaUsuario.findMany({
    where: { usuarioId: session.user.id },
    include: { empresa: true },
  })

  const primeiroNome = session.user.nome?.split(' ')[0] ?? 'usuário'
  const totalEmpresas = vinculos.length
  const totalAdministradas = vinculos.filter(v => v.papel === 'ADMIN').length
  const totalColaborador = vinculos.filter(v => v.papel !== 'ADMIN').length

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <Building2 className="size-5" aria-hidden />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight">
                PPEM Contabilidade
              </p>
              <p className="text-xs text-zinc-500">
                Dashboard principal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm sm:block">
              {session.user.nome}
            </div>

            <Button asChild variant="outline" className="h-10 rounded-2xl">
             <BotaoSair className="block px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">
                Sair
             </BotaoSair>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100"
            aria-hidden
          />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm">
                <Sparkles className="size-4 text-zinc-950" aria-hidden />
                Bem-vindo ao seu painel de gestão
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Olá, {primeiroNome}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
                Selecione uma empresa para continuar ou crie um novo workspace
                para organizar seus lançamentos, relatórios e colaboradores.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 rounded-2xl px-5">
                  <Link href="/empresas/nova" className="inline-flex items-center gap-2">
                    <Plus className="size-4" aria-hidden />
                    Criar nova empresa
                  </Link>
                </Button>

                <Button asChild variant="outline" className="h-11 rounded-2xl px-5">
                  <Link href="/empresas/entrar" className="inline-flex items-center gap-2">
                    <KeyRound className="size-4" aria-hidden />
                    Entrar com convite
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
                <p className="text-sm text-zinc-500">
                  Empresas vinculadas
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {totalEmpresas}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
                <p className="text-sm text-zinc-500">
                  Como administrador
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {totalAdministradas}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
                <p className="text-sm text-zinc-500">
                  Como colaborador
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {totalColaborador}
                </p>
              </div>
            </div>
          </div>
        </section>

        {vinculos.length > 0 ? (
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
                Suas empresas
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Clique em uma empresa para acessar o painel.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vinculos.map(v => (
                <Card
                  key={v.id}
                  className="h-full rounded-3xl border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg"
                >
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-sm">
                          {v.empresa.nome?.[0]?.toUpperCase() ?? 'E'}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-zinc-950">
                            {v.empresa.nome}
                          </p>

                          <p className="mt-1 truncate text-sm text-zinc-500">
                            {v.empresa.razaoSocial || 'Empresa vinculada'}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={v.papel === 'ADMIN' ? 'default' : 'secondary'}
                        className="shrink-0 rounded-full px-3 py-1"
                      >
                        {v.papel === 'ADMIN' ? 'Administrador' : 'Colaborador'}
                      </Badge>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex items-center gap-2 text-sm text-zinc-500">
                        <Users className="size-4" aria-hidden />
                        Acesso disponível
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild className="h-10 rounded-xl">
                          <Link href={`/empresas/${v.empresa.id}`} className="inline-flex items-center gap-2">
                            Acessar
                            <ArrowRight className="size-4" aria-hidden />
                          </Link>
                        </Button>

                        {v.papel === 'ADMIN' && (
                          <DeleteEmpresaButton
                            empresaId={v.empresa.id}
                            empresaNome={v.empresa.nome}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-10">
            <Card className="rounded-[2rem] border-dashed border-zinc-300 bg-white shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-3xl bg-zinc-950 text-white shadow-sm">
                  <FileText className="size-6" aria-hidden />
                </div>

                <h2 className="text-xl font-semibold">
                  Nenhuma empresa vinculada
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Crie uma empresa para começar ou entre com um código de convite
                  para acessar um workspace existente.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="h-11 rounded-2xl px-5">
                    <Link href="/empresas/nova">
                      Criar nova empresa
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-11 rounded-2xl px-5">
                    <Link href="/empresas/entrar">
                      Entrar com convite
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}