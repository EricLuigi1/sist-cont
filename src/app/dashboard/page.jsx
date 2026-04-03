import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Olá, {session.user.nome}!</h1>
        <p className="text-gray-500 mb-8">O que deseja fazer?</p>
        <div className="flex flex-col gap-4">
          <a href="/empresas/nova" className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 text-lg font-medium">
            Criar nova empresa
          </a>
          <a href="/empresas/entrar" className="border border-blue-600 text-blue-600 px-6 py-4 rounded-lg hover:bg-blue-50 text-lg font-medium">
            Entrar em uma empresa existente
          </a>
        </div>
      </div>
    </div>
  )
}