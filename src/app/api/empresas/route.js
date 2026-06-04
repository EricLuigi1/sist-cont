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
    return NextResponse.json(
      { erro: 'Não autorizado!' },
      { status: 401 }
    )
  }

  let body

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { erro: 'Dados inválidos.' },
      { status: 400 }
    )
  }

  function limparTexto(valor) {
    return String(valor || '').trim()
  }

  function apenasNumeros(valor) {
    return String(valor || '').replace(/\D/g, '')
  }

  const nome = limparTexto(body.nome)
  const razaoSocial = limparTexto(body.razaoSocial)
  const cnpj = apenasNumeros(body.cnpj)
  const endereco = limparTexto(body.endereco)
  const cidade = limparTexto(body.cidade)
  const estado = limparTexto(body.estado).toUpperCase()

  if (!nome || !razaoSocial || !cnpj || !endereco || !cidade || !estado) {
    return NextResponse.json(
      { erro: 'Preencha todos os campos obrigatórios.' },
      { status: 400 }
    )
  }

  if (nome.length > 80) {
    return NextResponse.json(
      { erro: 'O nome fantasia deve ter no máximo 80 caracteres.' },
      { status: 400 }
    )
  }

  if (razaoSocial.length > 120) {
    return NextResponse.json(
      { erro: 'A razão social deve ter no máximo 120 caracteres.' },
      { status: 400 }
    )
  }

  if (cnpj.length !== 14) {
    return NextResponse.json(
      { erro: 'Informe um CNPJ válido com 14 números.' },
      { status: 400 }
    )
  }

  if (endereco.length > 160) {
    return NextResponse.json(
      { erro: 'O endereço deve ter no máximo 160 caracteres.' },
      { status: 400 }
    )
  }

  if (cidade.length > 80) {
    return NextResponse.json(
      { erro: 'A cidade deve ter no máximo 80 caracteres.' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{2}$/.test(estado)) {
    return NextResponse.json(
      { erro: 'Informe o estado usando a sigla com 2 letras. Exemplo: SP.' },
      { status: 400 }
    )
  }

  try {
    const empresaExistente = await prisma.empresa.findFirst({
      where: { cnpj },
      select: { id: true },
    })

    if (empresaExistente) {
      return NextResponse.json(
        { erro: 'Já existe uma empresa cadastrada com este CNPJ.' },
        { status: 409 }
      )
    }

    const empresa = await prisma.$transaction(async tx => {
      const novaEmpresa = await tx.empresa.create({
        data: {
          nome,
          razaoSocial,
          cnpj,
          endereco,
          cidade,
          estado,
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
        const criada = await tx.conta.create({
          data: {
            codigo: conta.codigo,
            nome: conta.nome,
            tipo: conta.tipo,
            analitica: conta.analitica,
            naturezaDRE: conta.naturezaDRE || null,
            contaBase: [
              '1',
              '1.1',
              '1.2',
              '2',
              '2.1',
              '2.2',
              '3',
              '3.1',
              '3.2',
              '3.3',
              '4',
              '4.1',
              '5',
              '5.1',
              '6',
              '6.1',
              '7',
              '7.1',
            ].includes(conta.codigo),
            empresaId: novaEmpresa.id,
            contaPaiId: conta.pai ? contasCriadas[conta.pai] : null,
          },
        })

        contasCriadas[conta.codigo] = criada.id
      }

      return novaEmpresa
      }, {
        maxWait: 10000,
        timeout: 30000,
      })

    return NextResponse.json(
      { id: empresa.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar empresa:', error)

    return NextResponse.json(
      { erro: 'Erro ao criar empresa.' },
      { status: 500 }
    )
  }
}