import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import BotaoImprimir from '@/components/BotaoImprimir'
import FiltroPeriodo from '@/components/FiltroPeriodo'
import { formatarMoeda } from '@/lib/formatacao'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/alert'
import {
  ReportDocument,
  ReportDocumentHeader,
  ReportLineDetail,
  ReportLineGroup,
  ReportLineResult,
  ReportPdfHeader,
  ReportSectionLabel,
} from '@/components/financial/ReportDocument'

export default async function DREPage({ params, searchParams }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const { inicio, fim } = await searchParams

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: { usuarioId_empresaId: { usuarioId: session.user.id, empresaId: id } },
  })

  if (!vinculo) redirect('/dashboard')

  const empresa = await prisma.empresa.findUnique({
    where: { id },
    select: { nome: true, razaoSocial: true, cnpj: true },
  })

  const usuarioLogado = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { nome: true },
  })

  const dataGeracao = new Date().toLocaleDateString('pt-BR')

  const hoje = new Date()
  const inicioData = inicio
    ? new Date(`${inicio}T00:00:00`)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0)

  const fimData = fim
    ? new Date(`${fim}T23:59:59.999`)
    : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999)

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

  const totalDespesasOperacionais =
    despesasVendas +
    despesasFinanceiras -
    receitasFinanceiras +
    despesasAdministrativas +
    despesasOutras

  const outrasReceitasOperacionais = somarPorNatureza('RECEITA_OPERACIONAL_OUTRAS', 'CREDITO')
  const lucroOperacional = lucroBruto - totalDespesasOperacionais + outrasReceitasOperacionais

  const outrasReceitas = somarPorNatureza('OUTRAS_RECEITAS', 'CREDITO')
  const outrasDespesas = somarPorNatureza('OUTRAS_DESPESAS', 'DEBITO')
  const resultadoFinal = lucroOperacional + outrasReceitas - outrasDespesas

  const lancamentosSemNaturezaDRE = lancamentos.filter(l => {
    return (
      ['RECEITA', 'DESPESA', 'CUSTO'].includes(l.conta.tipo) &&
      !l.conta.naturezaDRE
    )
  })

  const contasSemNaturezaDRE = [
    ...new Map(
      lancamentosSemNaturezaDRE.map(l => [
        l.contaId,
        {
          id: l.contaId,
          codigo: l.conta.codigo,
          nome: l.conta.nome,
          tipo: l.conta.tipo,
        },
      ])
    ).values(),
  ].sort((a, b) => a.codigo.localeCompare(b.codigo))

  const fmt = d => new Date(d.getTime() + d.getTimezoneOffset() * -60000).toLocaleDateString('pt-BR')
  const periodoLabel = `${fmt(inicioData)} até ${fmt(fimData)}`
  const fmtValor = v => `R$ ${formatarMoeda(v)}`

  function LinhaContas({ natureza, tipo, multiplicador = 1 }) {
    const contas = contasPorNatureza(natureza, tipo)

    if (contas.length === 0) return null

    return contas.map(({ conta, total }) => (
      <ReportLineDetail
        key={conta.id}
        codigo={conta.codigo}
        nome={conta.nome}
        valor={total * multiplicador}
        formatValue={fmtValor}
      />
    ))
  }

  return (
    <>
      <div className="space-y-4">
        <PageHeader
          title="DRE"
          description="Demonstração do Resultado do Exercício"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <FiltroPeriodo />
          <BotaoImprimir />
        </div>

        {lancamentosSemNaturezaDRE.length > 0 && (
          <Alert variant="destructive" className="print:hidden">
            Existem {lancamentosSemNaturezaDRE.length} lançamento(s) em contas de receita,
            despesa ou custo sem natureza DRE. Esses valores não foram considerados na DRE.
            {contasSemNaturezaDRE.length > 0 && (
              <span className="mt-2 block text-xs">
                Contas: {contasSemNaturezaDRE.map(conta => `${conta.codigo} - ${conta.nome}`).join('; ')}
              </span>
            )}
          </Alert>
        )}
      </div>

      <ReportDocument>
        <ReportPdfHeader
          razaoSocial={empresa?.razaoSocial ?? empresa?.nome ?? ''}
          cnpj={empresa?.cnpj ?? ''}
          geradoPor={usuarioLogado?.nome ?? ''}
          dataGeracao={dataGeracao}
        />

        <ReportDocumentHeader
          title="Demonstração do Resultado do Exercício"
          period={periodoLabel}
        />

        <div className="flex flex-col gap-1 p-4 sm:p-5">
          <ReportLineGroup
            numero="1"
            titulo="Receita Operacional Bruta"
            valor={receitaBruta}
            formatValue={fmtValor}
          />
          <LinhaContas natureza="RECEITA_BRUTA" tipo="CREDITO" />

          <ReportLineGroup
            numero="2"
            titulo="Deduções e Abatimentos"
            valor={deducoes}
            formatValue={fmtValor}
          />
          <LinhaContas natureza="DEDUCAO" tipo="DEBITO" />

          <ReportLineResult
            numero="3"
            titulo="Receita Operacional Líquida"
            valor={receitaLiquida}
            formatValue={fmtValor}
          />

          <ReportLineGroup
            numero="4"
            titulo="Custos Operacionais"
            valor={custosOperacionais}
            formatValue={fmtValor}
          />
          <LinhaContas natureza="CUSTO_OPERACIONAL" tipo="DEBITO" />

          <ReportLineResult
            numero="5"
            titulo="Lucro Bruto"
            valor={lucroBruto}
            formatValue={fmtValor}
          />

          <ReportLineGroup
            numero="6"
            titulo="Despesas Operacionais"
            valor={totalDespesasOperacionais}
            formatValue={fmtValor}
          />

          <div className="ml-1 border-l-2 border-zinc-200 pl-2 print:border-black/20">
            {despesasVendas > 0 && (
              <ReportSectionLabel>6.1 Despesas com Vendas</ReportSectionLabel>
            )}
            <LinhaContas natureza="DESPESA_VENDAS" tipo="DEBITO" />

            {despesasFinanceiras > 0 && (
              <ReportSectionLabel>6.2 Despesas Financeiras</ReportSectionLabel>
            )}
            <LinhaContas natureza="DESPESA_FINANCEIRA" tipo="DEBITO" />

            {receitasFinanceiras > 0 && (
              <ReportSectionLabel>6.3 (-) Receitas Financeiras</ReportSectionLabel>
            )}
            <LinhaContas
              natureza="RECEITA_FINANCEIRA"
              tipo="CREDITO"
              multiplicador={-1}
            />

            {despesasAdministrativas > 0 && (
              <ReportSectionLabel>6.4 Despesas Gerais e Administrativas</ReportSectionLabel>
            )}
            <LinhaContas natureza="DESPESA_ADMINISTRATIVA" tipo="DEBITO" />

            {despesasOutras > 0 && (
              <ReportSectionLabel>6.5 Outras Despesas Operacionais</ReportSectionLabel>
            )}
            <LinhaContas natureza="DESPESA_OUTRAS" tipo="DEBITO" />
          </div>

          <ReportLineGroup
            numero="7"
            titulo="Outras Receitas Operacionais"
            valor={outrasReceitasOperacionais}
            formatValue={fmtValor}
          />
          <LinhaContas natureza="RECEITA_OPERACIONAL_OUTRAS" tipo="CREDITO" />

          <ReportLineResult
            numero="8"
            titulo="Lucro (Prejuízo) Operacional"
            valor={lucroOperacional}
            formatValue={fmtValor}
          />

          <ReportLineGroup
            numero="9"
            titulo="Outras Receitas"
            valor={outrasReceitas}
            formatValue={fmtValor}
          />
          <LinhaContas natureza="OUTRAS_RECEITAS" tipo="CREDITO" />

          <ReportLineGroup
            numero="10"
            titulo="Outras Despesas"
            valor={outrasDespesas}
            formatValue={fmtValor}
          />
          <LinhaContas natureza="OUTRAS_DESPESAS" tipo="DEBITO" />

          <ReportLineResult
            numero="11"
            titulo="Resultado do Exercício Antes do IR"
            valor={resultadoFinal}
            formatValue={fmtValor}
          />
        </div>
      </ReportDocument>
    </>
  )
}
