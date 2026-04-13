'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function EmpresaLayout({ children }) {
  const [relatoriosAberto, setRelatoriosAberto] = useState(false)
  const [empresa, setEmpresa] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const [codigoAberto, setCodigoAberto] = useState(false)
  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const perfilRef = useRef(null)
  const codigoRef = useRef(null)

  useEffect(() => {
    if (id) {
      fetch(`/api/empresas/${id}`)
        .then(res => res.json())
        .then(data => setEmpresa(data))
    }
  }, [id])

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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-14 border-b flex items-center justify-between px-6 bg-white">
        <span className="font-semibold text-gray-700">Sistema Contábil</span>
        <div className="flex items-center gap-4">
          {empresa?.codigoConvite && (
            <div className="relative" ref={codigoRef}>
              <button onClick={() => setCodigoAberto(!codigoAberto)} className="text-sm text-gray-400 hover:text-gray-700 border rounded px-3 py-1">
                Código de convite
              </button>
              {codigoAberto && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gray-800 text-white text-xs rounded px-3 py-2 whitespace-nowrap">
                    <p className="mb-1 text-gray-400">Clique para copiar</p>
                    <button onClick={copiarCodigo} className="font-mono hover:text-yellow-300 w-full text-left">
                      {copiado ? '✓ Copiado!' : empresa.codigoConvite}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="relative" ref={perfilRef}>
            <button onClick={() => setPerfilAberto(!perfilAberto)} className="flex items-center gap-2 text-sm font-medium hover:text-blue-600">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">U</div>
              Meu Perfil
            </button>
            {perfilAberto && (
              <div className="absolute right-0 mt-2 w-40 border rounded-lg shadow bg-white flex flex-col z-10">
                <a href="/perfil" className="px-4 py-2 text-sm hover:bg-gray-50">Alterar senha</a>
                <a href="/api/auth/signout" className="px-4 py-2 text-sm text-red-500 hover:bg-gray-50">Sair</a>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-gray-50 p-6 flex flex-col gap-4">
          <a href={`/empresas/${id}`} className="flex items-center gap-3 hover:opacity-80">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {empresa?.nome?.[0] ?? 'E'}
            </div>
            <span className="font-bold text-lg">{empresa?.nome ?? '...'}</span>
          </a>
          <nav className="flex flex-col gap-1 mt-4">
            <button onClick={() => setRelatoriosAberto(!relatoriosAberto)} className="flex items-center justify-between text-sm px-3 py-2 rounded hover:bg-gray-200 w-full text-left">
              <span>Relatórios</span>
              <span>{relatoriosAberto ? '▲' : '▼'}</span>
            </button>
            {relatoriosAberto && (
              <div className="flex flex-col gap-1 ml-3">
                <a href={`/empresas/${id}/relatorios/dre`} className="text-sm px-3 py-2 rounded hover:bg-gray-200">DRE</a>
                <a href={`/empresas/${id}/relatorios/balanco`} className="text-sm px-3 py-2 rounded hover:bg-gray-200">Balanço Patrimonial</a>
                <a href={`/empresas/${id}/relatorios/fluxo`} className="text-sm px-3 py-2 rounded hover:bg-gray-200">Fluxo de Caixa</a>
              </div>
            )}
            <a href={`/empresas/${id}/lancamentos`} className="text-sm px-3 py-2 rounded hover:bg-gray-200">Lançamentos</a>
            <a href={`/empresas/${id}/contas`} className="text-sm px-3 py-2 rounded hover:bg-gray-200">Plano de Contas</a>
          </nav>
          <div className="mt-auto">
            <a href="/dashboard" className="text-sm text-gray-500 hover:text-blue-600">← Voltar</a>
          </div>
        </aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}