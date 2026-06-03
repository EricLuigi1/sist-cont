import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import BotaoImprimir from '@/components/BotaoImprimir'
import FiltroPeriodo from '@/components/FiltroPeriodo'
import { formatarMoeda } from '@/lib/formatacao'

export default async function DREPage({ params, searchParams }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const { inicio, fim } = await searchParams

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    select: { nome: true, razaoSocial: true, cnpj: true },
  })

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { nome: true },
  })

  const dataGeracao = new Date().toLocaleDateString('pt-BR')

  if (!vinculo) redirect('/dashboard')

  const hoje = new Date()
  const inicioData = inicio ? new Date(inicio + 'T12:00:00') : new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12)
  const fimData = fim ? new Date(fim + 'T12:00:00') : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 12)

  const lancamentos = await prisma.lancamento.findMany({
    where: {
      empresaId: id,
      lote: { data: { gte: inicioData, lte: fimData } },
    },
    include: { conta: true },
  })

  function somarPorNatureza(natureza, tipo) {
    return lancamentos
      .filter(l => l.conta.naturezaDRE === natureza && l.tipo === tipo)
      .reduce((acc, l) => acc + Number(l.valor), 0)
  }

  function contasPorNatureza(natureza, tipo) {
    const grupos = {}
    lancamentos
      .filter(l => l.conta.naturezaDRE === natureza && l.tipo === tipo)
      .forEach(l => {
        if (!grupos[l.contaId]) grupos[l.contaId] = { conta: l.conta, total: 0 }
        grupos[l.contaId].total += Number(l.valor)
      })
    return Object.values(grupos).sort((a, b) => a.conta.codigo.localeCompare(b.conta.codigo))
  }

  const receitaBruta = somarPorNatureza('RECEITA_BRUTA', 'CREDITO')
  const deducoes = somarPorNatureza('DEDUCAO', 'DEBITO')
  const receitaLiquida = receitaBruta - deducoes
  const custosOperacionais = somarPorNatureza('CUSTO_OPERACIONAL', 'DEBITO')
  const lucroBruto = receitaLiquida - custosOperacionais
  const despesasVendas = somarPorNatureza('DESPESA_VENDAS', 'DEBITO')
  const despesasFinanceiras = somarPorNatureza('DESPESA_FINANCEIRA', 'DEBITO')
  const receitasFinanceiras = somarPorNatureza('RECEITA_FINANCEIRA', 'CREDITO')
  const despesasAdministrativas = somarPorNatureza('DESPESA_ADMINISTRATIVA', 'DEBITO')
  const despesasOutras = somarPorNatureza('DESPESA_OUTRAS', 'DEBITO')
  const totalDespesasOperacionais = despesasVendas + despesasFinanceiras - receitasFinanceiras + despesasAdministrativas + despesasOutras
  const outrasReceitasOperacionais = somarPorNatureza('RECEITA_OPERACIONAL_OUTRAS', 'CREDITO')
  const lucroOperacional = lucroBruto - totalDespesasOperacionais + outrasReceitasOperacionais
  const outrasReceitas = somarPorNatureza('OUTRAS_RECEITAS', 'CREDITO')
  const outrasDespesas = somarPorNatureza('OUTRAS_DESPESAS', 'DEBITO')
  const resultadoFinal = lucroOperacional + outrasReceitas - outrasDespesas

  const fmt = d => new Date(d.getTime() + d.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR')
  const periodoLabel = `${fmt(inicioData)} até ${fmt(fimData)}`

  function LinhaGrupo({ numero, titulo, valor }) {
    const cor = valor >= 0 ? 'text-green-700' : 'text-red-700'
    const bg = valor >= 0 ? 'bg-green-50' : 'bg-red-50'
    return (
      <div className={`flex justify-between font-semibold px-3 py-2 rounded mt-2 ${bg}`}>
        <span>{numero} - {titulo}</span>
        <span className={cor}>R$ {formatarMoeda(Math.abs(valor))}</span>
      </div>
    )
  }

  function LinhaContas({ natureza, tipo }) {
    const contas = contasPorNatureza(natureza, tipo)
    if (contas.length === 0) return null
    return contas.map(({ conta, total }) => (
      <div key={conta.id} className="flex justify-between text-sm px-6 py-1 border-b text-gray-600">
        <span>{conta.codigo} - {conta.nome}</span>
        <span>R$ {formatarMoeda(total)}</span>
      </div>
    ))
  }

  function LinhaResultado({ numero, titulo, valor }) {
    const positivo = valor >= 0
    return (
      <div className={`flex justify-between font-bold px-3 py-3 rounded mt-3 ${positivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <span>{numero} - {titulo}</span>
        <span>R$ {formatarMoeda(Math.abs(valor))}{!positivo ? ' (Prejuízo)' : ''}</span>
      </div>
    )
  }

  function CabecalhoPDF() {
    return (
      <div className="cabecalho-pdf mb-6 border-b pb-4 p-4">
        <h2 className="text-xl font-bold">{empresa.razaoSocial}</h2>
        <p className="text-sm text-gray-600">CNPJ: {empresa.cnpj}</p>
        <p className="text-xs text-gray-400 mt-2">Gerado por: {usuarioLogado.nome} — {dataGeracao}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">DRE</h1>
          <p className="text-gray-500 text-sm">Demonstração do Resultado do Exercício</p>
        </div>
        <BotaoImprimir />
      </div>
      <div className="no-print">
        <FiltroPeriodo />
      </div>
      <div id="relatorio-print" className="border rounded-lg overflow-hidden">
        <CabecalhoPDF />
        <div className="bg-gray-800 text-white p-4">
          <h2 className="font-bold text-center">DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO</h2>
          <p className="text-center text-gray-400 text-sm">{periodoLabel}</p>
        </div>
        <div className="p-4 flex flex-col gap-1">
          <LinhaGrupo numero="1" titulo="Receita Operacional Bruta" valor={receitaBruta} />
          <LinhaContas natureza="RECEITA_BRUTA" tipo="CREDITO" />
          <LinhaGrupo numero="2" titulo="Deduções e Abatimentos" valor={deducoes} />
          <LinhaContas natureza="DEDUCAO" tipo="DEBITO" />
          <LinhaResultado numero="3" titulo="Receita Operacional Líquida" valor={receitaLiquida} />
          <LinhaGrupo numero="4" titulo="Custos Operacionais" valor={custosOperacionais} />
          <LinhaContas natureza="CUSTO_OPERACIONAL" tipo="DEBITO" />
          <LinhaResultado numero="5" titulo="Lucro Bruto" valor={lucroBruto} />
          <LinhaGrupo numero="6" titulo="Despesas Operacionais" valor={totalDespesasOperacionais} />
          <div className="ml-3">
            {despesasVendas > 0 && <p className="text-xs text-gray-500 px-3 pt-2 font-medium">6.1 Despesas com Vendas</p>}
            <LinhaContas natureza="DESPESA_VENDAS" tipo="DEBITO" />
            {despesasFinanceiras > 0 && <p className="text-xs text-gray-500 px-3 pt-2 font-medium">6.2 Despesas Financeiras</p>}
            <LinhaContas natureza="DESPESA_FINANCEIRA" tipo="DEBITO" />
            {receitasFinanceiras > 0 && <p className="text-xs text-gray-500 px-3 pt-2 font-medium">6.3 (-) Receitas Financeiras</p>}
            <LinhaContas natureza="RECEITA_FINANCEIRA" tipo="CREDITO" />
            {despesasAdministrativas > 0 && <p className="text-xs text-gray-500 px-3 pt-2 font-medium">6.4 Despesas Gerais e Administrativas</p>}
            <LinhaContas natureza="DESPESA_ADMINISTRATIVA" tipo="DEBITO" />
            {despesasOutras > 0 && <p className="text-xs text-gray-500 px-3 pt-2 font-medium">6.5 Outras Despesas Operacionais</p>}
            <LinhaContas natureza="DESPESA_OUTRAS" tipo="DEBITO" />
          </div>
          <LinhaGrupo numero="7" titulo="Outras Receitas Operacionais" valor={outrasReceitasOperacionais} />
          <LinhaContas natureza="RECEITA_OPERACIONAL_OUTRAS" tipo="CREDITO" />
          <LinhaResultado numero="8" titulo="Lucro (Prejuízo) Operacional" valor={lucroOperacional} />
          <LinhaGrupo numero="9" titulo="Outras Receitas" valor={outrasReceitas} />
          <LinhaContas natureza="OUTRAS_RECEITAS" tipo="CREDITO" />
          <LinhaGrupo numero="10" titulo="Outras Despesas" valor={outrasDespesas} />
          <LinhaContas natureza="OUTRAS_DESPESAS" tipo="DEBITO" />
          <LinhaResultado numero="11" titulo="Resultado do Exercício Antes do IR" valor={resultadoFinal} />
        </div>
      </div>
    </div>
  )
}