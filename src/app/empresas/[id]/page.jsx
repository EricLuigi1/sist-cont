import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function EmpresaPage({ params }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: id,
      },
    },
    include: {
      empresa: true,
    },
  })

  if (!vinculo) redirect('/dashboard')

  const empresa = vinculo.empresa

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">{empresa.nome}</h1>
      <p className="text-gray-500 mb-6">{empresa.razaoSocial}</p>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">CNPJ</p>
          <p className="font-medium">{empresa.cnpj}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Endereço</p>
          <p className="font-medium">{empresa.endereco}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Cidade</p>
          <p className="font-medium">{empresa.cidade}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Estado</p>
          <p className="font-medium">{empresa.estado}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <a href={`/empresas/${empresa.id}/contas`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Plano de Contas
        </a>
        <a href={`/empresas/${empresa.id}/lancamentos`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Lançamentos
        </a>
        <a href={`/empresas/${empresa.id}/relatorios`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Relatórios
        </a>
      </div>
    </div>
  )
}