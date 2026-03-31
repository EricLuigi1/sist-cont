import { prisma } from '@/lib/prisma'

async function getEmpresas() {
  return await prisma.empresa.findMany()
}

export default async function EmpresasPage() {
  const empresas = await getEmpresas()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <a href="/empresas/nova" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Nova Empresa
        </a>
      </div>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 p-3 text-left">Nome</th>
            <th className="border border-gray-200 p-3 text-left">Razão Social</th>
            <th className="border border-gray-200 p-3 text-left">CNPJ</th>
            <th className="border border-gray-200 p-3 text-left">Cidade</th>
            <th className="border border-gray-200 p-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {empresas.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center p-4 text-gray-500">
                Nenhuma empresa cadastrada ainda.
              </td>
            </tr>
          ) : (
            empresas.map((empresa) => (
              <tr key={empresa.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-3">{empresa.nome}</td>
                <td className="border border-gray-200 p-3">{empresa.razaoSocial}</td>
                <td className="border border-gray-200 p-3">{empresa.cnpj}</td>
                <td className="border border-gray-200 p-3">{empresa.cidade}</td>
                <td className="border border-gray-200 p-3">{empresa.estado}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}