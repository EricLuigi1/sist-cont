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

  const lancamentos = await prisma.lancamento.findMany({
    where: { empresaId: id },
    orderBy: { data: 'desc' },
  })

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const lancamentosDoMes = lancamentos.filter(l => new Date(l.data) >= inicioMes)

  const totalReceitas = lancamentosDoMes.filter(l => l.tipo === 'CREDITO').reduce((acc, l) => acc + Number(l.valor), 0)
  const totalDespesas = lancamentosDoMes.filter(l => l.tipo === 'DEBITO').reduce((acc, l) => acc + Number(l.valor), 0)
  const resultado = totalReceitas - totalDespesas
  const ultimoLancamento = lancamentos[0] || null

  const lancamentosDoUsuario = lancamentos.filter(l => l.usuarioId === session.user.id)
  const lancamentosHoje = lancamentosDoUsuario.filter(l => new Date(l.data).toDateString() === hoje.toDateString())

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
            <p className="text-2xl font-bold">{lancamentosDoMes.length}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Colaboradores</p>
            <p className="text-2xl font-bold">{colaboradores}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Último lançamento</p>
            {ultimoLancamento ? (
              <>
                <p className="font-medium">{ultimoLancamento.descricao}</p>
                <p className="text-sm text-gray-400">{new Date(ultimoLancamento.data).toLocaleDateString('pt-BR')}</p>
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
            <p className="text-2xl font-bold">{lancamentosHoje.length}</p>
          </div>
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-1">Seus lançamentos no mês</p>
            <p className="text-2xl font-bold">{lancamentosDoUsuario.filter(l => new Date(l.data) >= inicioMes).length}</p>
          </div>
          <div className="col-span-2 border rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-2">Seus últimos lançamentos</p>
            {lancamentosDoUsuario.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum lançamento ainda</p>
            ) : (
              <div className="flex flex-col gap-2">
                {lancamentosDoUsuario.slice(0, 5).map(l => (
                  <div key={l.id} className="flex justify-between text-sm border-b pb-2">
                    <span>{l.descricao}</span>
                    <span className={l.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}>
                      {l.tipo === 'CREDITO' ? '+' : '-'}R$ {Number(l.valor).toFixed(2)}
                    </span>
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