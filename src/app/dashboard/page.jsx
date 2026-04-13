import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const vinculos = await prisma.empresaUsuario.findMany({
    where: { usuarioId: session.user.id },
    include: { empresa: true },
  })

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold mb-2">Olá, {session.user.nome}! 👋</h1>
        <p className="text-gray-500 mb-8">Selecione uma empresa ou crie uma nova</p>
        {vinculos.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {vinculos.map(v => (
              <a key={v.id} href={`/empresas/${v.empresa.id}`} className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{v.empresa.nome}</p>
                  <p className="text-xs text-gray-400">{v.papel === 'ADMIN' ? 'Administrador' : 'Colaborador'}</p>
                </div>
                <span className="text-blue-600 text-sm">Acessar →</span>
              </a>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <a href="/empresas/nova" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center font-medium">
            + Criar nova empresa
          </a>
          <a href="/empresas/entrar" className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 text-center font-medium">
            Entrar com código de convite
          </a>
        </div>
      </div>
    </div>
  )
}