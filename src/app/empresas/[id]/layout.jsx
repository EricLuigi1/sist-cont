'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  UserPlus,
  ChevronDown,
  FileText,
  Info,
  LayoutDashboard,
  Receipt,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const relatorioLinks = [
  { href: 'relatorios/dre', label: 'DRE' },
  { href: 'relatorios/balanco', label: 'Balanço Patrimonial' },
  { href: 'relatorios/fluxo', label: 'Fluxo de Caixa' },
]

export default function EmpresaLayout({ children }) {
  const [relatoriosAberto, setRelatoriosAberto] = useState(false)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [empresa, setEmpresa] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [pedidosPendentes, setPedidosPendentes] = useState(0)
  const [copiado, setCopiado] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [codigoAberto, setCodigoAberto] = useState(false)

  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const perfilRef = useRef(null)
  const codigoRef = useRef(null)


const navPrincipal = [
  { href: `/empresas/${id}/lancamentos`, label: 'Lançamentos', icon: Receipt },
  { href: `/empresas/${id}/contas`, label: 'Plano de Contas', icon: BookOpen },
  { href: `/empresas/${id}/colaboradores`, label: 'Colaboradores', icon: Users },

  ...(empresa?.papel === 'ADMIN'
    ? [
        {
          href: `/empresas/${id}/pedidos`,
          label: 'Pedidos',
          icon: UserPlus,
          badge: pedidosPendentes,
        },
      ]
    : []),

  { href: `/empresas/${id}/info`, label: 'Informações', icon: Info },
]

  const relatoriosAtivo = pathname.includes('/relatorios/')

  useEffect(() => {
    if (relatoriosAtivo) setRelatoriosAberto(true)
  }, [relatoriosAtivo])

  useEffect(() => {
    if (id) {
      fetch(`/api/empresas/${id}`)
        .then(res => res.json())
        .then(data => setEmpresa(data))
    }

    fetch('/api/perfil')
      .then(res => res.json())
      .then(data => setUsuario(data))
  }, [id])

  useEffect(() => {
    if (!id || empresa?.papel !== 'ADMIN') {
      setPedidosPendentes(0)
      return
    }

    fetch(`/api/empresas/${id}/pedidos`, {
      cache: 'no-store',
    })
      .then(res => {
        if (!res.ok) return []
        return res.json()
      })
      .then(data => {
        setPedidosPendentes(Array.isArray(data) ? data.length : 0)
      })
      .catch(() => {
        setPedidosPendentes(0)
      })
  }, [id, empresa?.papel, pathname])

  useEffect(() => {
    setSidebarAberta(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e) {
      if (perfilRef.current && !perfilRef.current.contains(e.target)) setPerfilAberto(false)
      if (codigoRef.current && !codigoRef.current.contains(e.target)) setCodigoAberto(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function copiarCodigo() {
    if (empresa?.codigoConvite) {
      navigator.clipboard.writeText(empresa.codigoConvite)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  function isActive(href) {
    if (href === `/empresas/${id}`) return pathname === href
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <>
      <Link
        href={`/empresas/${id}`}
        className="mb-6 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white">
          {empresa?.nome?.[0]?.toUpperCase() ?? 'E'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {empresa?.nome ?? 'Carregando...'}
          </p>
          <p className="text-xs text-zinc-500">Workspace</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-2" aria-label="Navegação principal">
        <Link
          href={`/empresas/${id}`}
          className={cn(
            'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-950',
            isActive(`/empresas/${id}`) && pathname === `/empresas/${id}` && 'bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white'
          )}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden />
          <span>Dashboard</span>
        </Link>

        <div>
          <button
            type="button"
            onClick={() => setRelatoriosAberto(!relatoriosAberto)}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-950',
              relatoriosAtivo && 'bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white'
            )}
            aria-expanded={relatoriosAberto}
          >
            <span className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 shrink-0" aria-hidden />
              Relatórios
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform duration-200',
                relatoriosAberto && 'rotate-180'
              )}
              aria-hidden
            />
          </button>

          {relatoriosAberto && (
            <div className="ml-5 mt-2 flex flex-col gap-1 border-l border-zinc-200 pl-4">
              {relatorioLinks.map(link => {
                const href = `/empresas/${id}/${link.href}`
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'rounded-xl px-3 py-2.5 text-sm text-zinc-600 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-950',
                      pathname === href && 'bg-zinc-100 font-semibold text-zinc-950'
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {navPrincipal.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-950',
                isActive(item.href) && 'bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="truncate">{item.label}</span>
              {item.badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </span>
            </Link>
          )
        })}
      </nav>

      <Link
        href="/dashboard"
        className="mt-6 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-950"
      >
        <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
        <span>Voltar às empresas</span>
      </Link>
    </>
  )

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarAberta(true)}
              aria-label="Abrir menu"
            >
              <Receipt className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-semibold text-zinc-900">PPEM Contabilidade</p>
              <p className="text-xs text-zinc-500">Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {empresa?.codigoConvite && (
              <div className="relative" ref={codigoRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCodigoAberto(!codigoAberto)}
                  className="hidden border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 sm:inline-flex"
                >
                  <FileText className="size-3.5" aria-hidden />
                  Convite
                </Button>
                {codigoAberto && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">
                    <p className="mb-2 text-xs text-zinc-500">Clique para copiar</p>
                    <button
                      type="button"
                      onClick={copiarCodigo}
                      className="w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-muted px-3 py-2 text-left font-mono text-sm transition-colors hover:bg-accent"
                    >
                      {copiado ? '✓ Copiado!' : empresa.codigoConvite}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="relative" ref={perfilRef}>
              <button
                type="button"
                onClick={() => setPerfilAberto(!perfilAberto)}
                className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-2 py-1.5 shadow-sm transition-all hover:bg-zinc-50"
                aria-expanded={perfilAberto}
                aria-haspopup="menu"
              >
                <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-zinc-950 text-xs font-medium text-white">
                  {usuario?.foto ? (
                    <img src={usuario.foto} alt="" className="size-full object-cover" />
                  ) : (
                    usuario?.nome?.[0]?.toUpperCase() ?? 'U'
                  )}
                </div>
                <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                  {usuario?.nome?.split(' ')[0] ?? 'Perfil'}
                </span>
              </button>

              {perfilAberto && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 shadow-xl"
                >
                  <a href="/perfil" role="menuitem" className="block px-4 py-2.5 text-sm transition-colors hover:bg-zinc-100">
                    Meu Perfil
                  </a>
                  <a href="/perfil?aba=senha" role="menuitem" className="block px-4 py-2.5 text-sm transition-colors hover:bg-zinc-100">
                    Alterar Senha
                  </a>
                  <hr className="my-1 border-zinc-200" />
                  <a
                    href="/api/auth/signout"
                    role="menuitem"
                    className="block px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    Sair
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-200 bg-white p-5 lg:flex">
          {sidebarContent}
        </aside>

        {sidebarAberta && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarAberta(false)}
              aria-label="Fechar menu"
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200 bg-white p-5 shadow-2xl lg:hidden">
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Menu
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarAberta(false)}
                  aria-label="Fechar menu"
                >
                  <X className="size-5" />
                </Button>
              </div>
              {sidebarContent}
            </aside>
          </>
        )}

        <main className="flex-1 overflow-x-hidden">
          <div className="page-container px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {children}
          </div>
        </main>
      </div>
    </div>
  )
}
