import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const contasBase = [
  { codigo: '1', nome: 'Ativo', tipo: 'ATIVO', pai: null, analitica: false, naturezaDRE: null },
  { codigo: '1.1', nome: 'Ativo Circulante', tipo: 'ATIVO', pai: '1', analitica: false, naturezaDRE: null },
  { codigo: '1.1.01', nome: 'Caixa', tipo: 'ATIVO', pai: '1.1', analitica: true, naturezaDRE: null },
  { codigo: '1.1.02', nome: 'Bancos Conta Movimento', tipo: 'ATIVO', pai: '1.1', analitica: true, naturezaDRE: null },
  { codigo: '1.1.03', nome: 'Clientes', tipo: 'ATIVO', pai: '1.1', analitica: true, naturezaDRE: null },
  { codigo: '1.1.04', nome: 'Duplicatas a Receber', tipo: 'ATIVO', pai: '1.1', analitica: true, naturezaDRE: null },
  { codigo: '1.1.05', nome: 'Títulos a Receber', tipo: 'ATIVO', pai: '1.1', analitica: true, naturezaDRE: null },
  { codigo: '1.1.06', nome: 'Estoque de Mercadorias', tipo: 'ATIVO', pai: '1.1', analitica: true, naturezaDRE: null },
  { codigo: '1.1.07', nome: 'Estoque de Material de Expediente', tipo: 'ATIVO', pai: '1.1', analitica: true, naturezaDRE: null },
  { codigo: '1.1.08', nome: 'Estoque de Material de Limpeza', tipo: 'ATIVO', pai: '1.1', analitica: true, naturezaDRE: null },
  { codigo: '1.2', nome: 'Ativo Não Circulante', tipo: 'ATIVO', pai: '1', analitica: false, naturezaDRE: null },
  { codigo: '1.2.01', nome: 'Clientes', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.02', nome: 'Duplicatas a Receber', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.03', nome: 'Títulos a Receber', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.04', nome: 'Computadores e Periféricos', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.05', nome: 'Imóveis', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.06', nome: 'Instalações', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.07', nome: 'Móveis e Utensílios', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.08', nome: 'Veículos', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.09', nome: 'Fundo de Comércio', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '1.2.10', nome: 'Marcas e Patentes', tipo: 'ATIVO', pai: '1.2', analitica: true, naturezaDRE: null },
  { codigo: '2', nome: 'Passivo', tipo: 'PASSIVO', pai: null, analitica: false, naturezaDRE: null },
  { codigo: '2.1', nome: 'Passivo Circulante', tipo: 'PASSIVO', pai: '2', analitica: false, naturezaDRE: null },
  { codigo: '2.1.01', nome: 'Fornecedores', tipo: 'PASSIVO', pai: '2.1', analitica: true, naturezaDRE: null },
  { codigo: '2.1.02', nome: 'Duplicatas a Pagar', tipo: 'PASSIVO', pai: '2.1', analitica: true, naturezaDRE: null },
  { codigo: '2.1.03', nome: 'Empréstimos e Financiamentos', tipo: 'PASSIVO', pai: '2.1', analitica: true, naturezaDRE: null },
  { codigo: '2.1.04', nome: 'Títulos a Pagar', tipo: 'PASSIVO', pai: '2.1', analitica: true, naturezaDRE: null },
  { codigo: '2.1.05', nome: 'Impostos e Taxas a Recolher', tipo: 'PASSIVO', pai: '2.1', analitica: true, naturezaDRE: null },
  { codigo: '2.1.06', nome: 'Salários a Pagar', tipo: 'PASSIVO', pai: '2.1', analitica: true, naturezaDRE: null },
  { codigo: '2.2', nome: 'Passivo Não Circulante', tipo: 'PASSIVO', pai: '2', analitica: false, naturezaDRE: null },
  { codigo: '2.2.01', nome: 'Fornecedores', tipo: 'PASSIVO', pai: '2.2', analitica: true, naturezaDRE: null },
  { codigo: '2.2.02', nome: 'Duplicatas a Pagar', tipo: 'PASSIVO', pai: '2.2', analitica: true, naturezaDRE: null },
  { codigo: '2.2.03', nome: 'Títulos a Pagar', tipo: 'PASSIVO', pai: '2.2', analitica: true, naturezaDRE: null },
  { codigo: '3', nome: 'Patrimônio Líquido', tipo: 'PATRIMONIO_LIQUIDO', pai: null, analitica: false, naturezaDRE: null },
  { codigo: '3.1', nome: 'Capital', tipo: 'PATRIMONIO_LIQUIDO', pai: '3', analitica: true, naturezaDRE: null },
  { codigo: '3.2', nome: 'Lucros Acumulados', tipo: 'PATRIMONIO_LIQUIDO', pai: '3', analitica: true, naturezaDRE: null },
  { codigo: '3.3', nome: 'Prejuízos Acumulados', tipo: 'PATRIMONIO_LIQUIDO', pai: '3', analitica: true, naturezaDRE: null },
  { codigo: '4', nome: 'Receita', tipo: 'RECEITA', pai: null, analitica: false, naturezaDRE: null },
  { codigo: '4.1', nome: 'Receitas Operacionais', tipo: 'RECEITA', pai: '4', analitica: false, naturezaDRE: null },
  { codigo: '4.1.01', nome: 'Vendas de Mercadorias', tipo: 'RECEITA', pai: '4.1', analitica: true, naturezaDRE: 'RECEITA_BRUTA' },
  { codigo: '4.1.02', nome: 'Receitas de Serviços', tipo: 'RECEITA', pai: '4.1', analitica: true, naturezaDRE: 'RECEITA_BRUTA' },
  { codigo: '4.1.03', nome: 'Descontos Obtidos', tipo: 'RECEITA', pai: '4.1', analitica: true, naturezaDRE: 'RECEITA_FINANCEIRA' },
  { codigo: '4.1.04', nome: 'Receitas de Juros', tipo: 'RECEITA', pai: '4.1', analitica: true, naturezaDRE: 'RECEITA_FINANCEIRA' },
  { codigo: '4.1.05', nome: 'Receitas de Aluguéis', tipo: 'RECEITA', pai: '4.1', analitica: true, naturezaDRE: 'RECEITA_OPERACIONAL_OUTRAS' },
  { codigo: '4.1.06', nome: 'Receitas Eventuais', tipo: 'RECEITA', pai: '4.1', analitica: true, naturezaDRE: 'RECEITA_OPERACIONAL_OUTRAS' },
  { codigo: '5', nome: 'Despesa', tipo: 'DESPESA', pai: null, analitica: false, naturezaDRE: null },
  { codigo: '5.1', nome: 'Despesas Operacionais', tipo: 'DESPESA', pai: '5', analitica: false, naturezaDRE: null },
  { codigo: '5.1.01', nome: 'Propaganda e Publicidade', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_VENDAS' },
  { codigo: '5.1.02', nome: 'Descontos Concedidos', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DEDUCAO' },
  { codigo: '5.1.03', nome: 'Despesas Bancárias', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_FINANCEIRA' },
  { codigo: '5.1.04', nome: 'Despesas de Juros', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_FINANCEIRA' },
  { codigo: '5.1.05', nome: 'Café e Lanches', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.06', nome: 'Salários', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.07', nome: 'Água e Esgoto', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.08', nome: 'Despesas de Aluguéis', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.09', nome: 'Combustíveis', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_VENDAS' },
  { codigo: '5.1.10', nome: 'Energia Elétrica', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.11', nome: 'Fretes e Carretos', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_VENDAS' },
  { codigo: '5.1.12', nome: 'Material de Expediente', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.13', nome: 'Material de Limpeza', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.14', nome: 'Prêmios de Seguro', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.15', nome: 'Comunicação', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.16', nome: 'Serviços de Terceiros', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.17', nome: 'Despesas Eventuais', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_OUTRAS' },
  { codigo: '5.1.18', nome: 'Impostos e Taxas', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_ADMINISTRATIVA' },
  { codigo: '5.1.19', nome: 'Despesas de Organização', tipo: 'DESPESA', pai: '5.1', analitica: true, naturezaDRE: 'DESPESA_OUTRAS' },
  { codigo: '6', nome: 'Custos', tipo: 'CUSTO', pai: null, analitica: false, naturezaDRE: null },
  { codigo: '6.1', nome: 'Custos Operacionais', tipo: 'CUSTO', pai: '6', analitica: false, naturezaDRE: null },
  { codigo: '7', nome: 'Resultado', tipo: 'RESULTADO', pai: null, analitica: false, naturezaDRE: null },
  { codigo: '7.1', nome: 'Apuração do Resultado do Exercício', tipo: 'RESULTADO', pai: '7', analitica: true, naturezaDRE: null },
]

export async function POST(request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })
  }

  const body = await request.json()

  try {
    const empresa = await prisma.empresa.create({
      data: {
        nome: body.nome,
        razaoSocial: body.razaoSocial,
        cnpj: body.cnpj,
        endereco: body.endereco,
        cidade: body.cidade,
        estado: body.estado,
        usuarios: {
          create: {
            usuarioId: session.user.id,
            papel: 'ADMIN',
          },
        },
      },
    })
    
  const contasCriadas = {}
  for (const conta of contasBase) {
    const criada = await prisma.conta.create({
      data: {
        codigo: conta.codigo,
        nome: conta.nome,
        tipo: conta.tipo,
        analitica: conta.analitica,
        naturezaDRE: conta.naturezaDRE || null,
        contaBase: ['1','1.1','1.2','2','2.1','2.2','3','3.1','3.2','3.3','4','4.1','5','5.1','6','6.1','7','7.1'].includes(conta.codigo),
        empresaId: empresa.id,
        contaPaiId: conta.pai ? contasCriadas[conta.pai] : null,
      },
    })
    contasCriadas[conta.codigo] = criada.id
  }

    return NextResponse.json(empresa, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar empresa:', error)
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
}