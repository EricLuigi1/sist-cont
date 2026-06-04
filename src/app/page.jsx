'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
  Wallet,
  Clock3,
  Users,
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Relatórios claros',
    description: 'Acompanhe DRE, balanço patrimonial e fluxo de caixa com uma visão limpa e profissional.',
  },
  {
    icon: Wallet,
    title: 'Controle financeiro',
    description: 'Organize lançamentos, contas e movimentos em um só lugar, sem planilhas confusas.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança e acesso',
    description: 'Perfis de acesso, permissões por empresa e dados protegidos para cada colaborador.',
  },
  {
    icon: BarChart3,
    title: 'Indicadores na tela',
    description: 'Veja resultados do mês, movimentações recentes e dados essenciais logo na abertura.',
  },
]

const benefits = [
  'Visual moderno e fácil de usar',
  'Pronto para equipes e múltiplas empresas',
  'Impressão de relatórios organizada',
  'Fluxos pensados para contabilidade real',
]

const steps = [
  {
    number: '01',
    title: 'Crie sua empresa',
    description: 'Cadastre a empresa e configure os dados principais para começar a operar.',
  },
  {
    number: '02',
    title: 'Lance movimentações',
    description: 'Registre entradas, saídas e classificações contábeis com rapidez.',
  },
  {
    number: '03',
    title: 'Acompanhe os relatórios',
    description: 'Gere demonstrações e análises para tomar decisões com mais confiança.',
  },
]

const stats = [
  { value: '100%', label: 'foco em rotina contábil' },
  { value: '3', label: 'relatórios principais prontos' },
  { value: '1', label: 'experiência unificada' },
]

const faqs = [
  {
    question: 'Para quem é a PPEM Contabilidade?',
    answer:
      'Para empresas e equipes que precisam de uma rotina contábil mais organizada, visual e prática.',
  },
  {
    question: 'Preciso entender de contabilidade para usar?',
    answer:
      'Não. A interface foi pensada para simplificar o processo e guiar o uso no dia a dia.',
  },
  {
    question: 'Posso usar no celular?',
    answer:
      'Sim. A landing e o sistema funcionam bem em telas menores, com layout responsivo.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">PPEM Contabilidade</p>
              <p className="text-xs text-zinc-500">Gestão contábil moderna</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
            <a href="#recursos" className="transition-colors hover:text-zinc-950">Recursos</a>
            <a href="#como-funciona" className="transition-colors hover:text-zinc-950">Como funciona</a>
            <a href="#faq" className="transition-colors hover:text-zinc-950">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800"
            >
              Começar agora
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm">
              <Sparkles className="size-4 text-zinc-950" />
              Sistema contábil com visual premium
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Sua contabilidade organizada, bonita e fácil de usar.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              A PPEM Contabilidade centraliza lançamentos, relatórios e gestão de empresas em uma experiência moderna,
              pensada para quem quer mais clareza no dia a dia e menos tempo perdido com processos confusos.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-zinc-800"
              >
                Acessar o sistema
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#recursos"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Ver recursos
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map(stat => (
                <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-zinc-200 to-zinc-100 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-2xl">
              <div className="border-b border-zinc-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-zinc-300" />
                  <div className="size-3 rounded-full bg-zinc-300" />
                  <div className="size-3 rounded-full bg-zinc-300" />
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-2xl bg-zinc-950 p-5 text-white shadow-lg">
                  <p className="text-sm text-zinc-300">Resumo do período</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-zinc-300">Receitas</p>
                      <p className="mt-2 text-lg font-semibold">R$ 48.200</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-zinc-300">Despesas</p>
                      <p className="mt-2 text-lg font-semibold">R$ 22.740</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-zinc-300">Resultado</p>
                      <p className="mt-2 text-lg font-semibold">R$ 25.460</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    'DRE pronta para impressão',
                    'Balanço patrimonial claro',
                    'Fluxo de caixa simplificado',
                    'Acesso por colaborador',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <BadgeCheck className="size-5 text-zinc-950" />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="border-y border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Recursos</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Tudo o que você precisa para uma rotina contábil moderna.</h2>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                Do lançamento ao relatório final, a experiência foi pensada para reduzir fricção e deixar as informações mais fáceis de entender.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {features.map(feature => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm transition-transform hover:-translate-y-1">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Icon className="size-5 text-zinc-950" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{feature.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Como funciona</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Uma jornada simples, do cadastro ao relatório.</h2>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                Sem complicação. Cada etapa foi desenhada para ser rápida, clara e fácil de revisar.
              </p>

              <ul className="mt-8 space-y-3">
                {benefits.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-zinc-700">
                    <CheckCircle2 className="size-5 text-zinc-950" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-5">
              {steps.map(step => (
                <div key={step.number} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-semibold text-white">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">Pronto para usar</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Leve sua gestão contábil para um visual muito mais profissional.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
                  Entre, explore e veja como a PPEM Contabilidade pode organizar a rotina da sua empresa com mais clareza.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-zinc-950 transition-transform hover:-translate-y-0.5"
              >
                Acessar agora
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Perguntas frequentes</h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {faqs.map(faq => (
              <div key={faq.question} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} PPEM Contabilidade. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <a href="#recursos" className="transition-colors hover:text-zinc-950">Recursos</a>
            <a href="#faq" className="transition-colors hover:text-zinc-950">FAQ</a>
            <a href="/login" className="transition-colors hover:text-zinc-950">Entrar</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
