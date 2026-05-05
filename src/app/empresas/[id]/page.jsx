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
    include: { empresa: true },
  })

  if (!vinculo) redirect('/dashboard')

  const empresa = vinculo.empresa
  const isAdmin = vinculo.papel === 'ADMIN'

  const lotes = await prisma.lote.findMany({
    where: { empresaId: id },
    orderBy: { data: 'desc' },
    include: { lancamentos: true },
  })

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const lotesDoMes = lotes.filter(l => new Date(l.data) >= inicioMes)

  const lancamentosDoMes = lotesDoMes.flatMap(l => l.lancamentos)

  const totalReceitas = lancamentosDoMes.filter(l => l.tipo === 'CREDITO').reduce((acc, l) => acc + Number(l.valor), 0)
  const totalDespesas = lancamentosDoMes.filter(l => l.tipo === 'DEBITO').reduce((acc, l) => acc + Number(l.valor), 0)
  const resultado = totalReceitas - totalDespesas
  const ultimoLote = lotes[0] || null

  const lotesDoUsuario = lotes.filter(l => l.usuarioId === session.user.id)
  const lotesHoje = lotesDoUsuario.filter(l => new Date(l.data).toDateString() === hoje.toDateString())

  const colaboradores = await prisma.empresaUsuario.count({ where: { empresaId: id } })

  return (
    <>
      {isAdmin ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Resultado do mês</p>
            <p className={`text-2xl font-bold ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {resultado >= 0 ? '+' : ''}R$ {resultado.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{resultado >= 0 ? 'Lucro' : 'Prejuízo'}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Receitas do mês</p>
            <p className="text-2xl font-bold text-green-600">R$ {totalReceitas.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Despesas do mês</p>
            <p className="text-2xl font-bold text-red-600">R$ {totalDespesas.toFixed(2)}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Total de lançamentos no mês</p>
            <p className="text-2xl font-bold">{lotesDoMes.length}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Colaboradores</p>
            <p className="text-2xl font-bold">{colaboradores}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Último lançamento</p>
            {ultimoLote ? (
              <>
                <p className="font-medium">{ultimoLote.historico}</p>
                <p className="text-sm text-gray-400">{new Date(ultimoLote.data).toLocaleDateString('pt-BR')}</p>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Nenhum lançamento ainda</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Seus lançamentos hoje</p>
            <p className="text-2xl font-bold">{lotesHoje.length}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Seus lançamentos no mês</p>
            <p className="text-2xl font-bold">{lotesDoUsuario.filter(l => new Date(l.data) >= inicioMes).length}</p>
          </div>
          <div className="col-span-2 border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">Seus últimos lançamentos</p>
            {lotesDoUsuario.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum lançamento ainda</p>
            ) : (
              <div className="flex flex-col gap-2">
                {lotesDoUsuario.slice(0, 5).map(l => (
                  <div key={l.id} className="flex justify-between text-sm border-b pb-2">
                    <span>{l.historico}</span>
                    <span className="text-gray-500">{new Date(l.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}