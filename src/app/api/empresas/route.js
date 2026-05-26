import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const contasBase = [
  { codigo: '1', nome: 'Ativo', tipo: 'ATIVO', pai: null },
  { codigo: '1.1', nome: 'Ativo Circulante', tipo: 'ATIVO', pai: '1' },
  { codigo: '1.2', nome: 'Ativo Não Circulante', tipo: 'ATIVO', pai: '1' },
  { codigo: '2', nome: 'Passivo', tipo: 'PASSIVO', pai: null },
  { codigo: '2.1', nome: 'Passivo Circulante', tipo: 'PASSIVO', pai: '2' },
  { codigo: '2.2', nome: 'Passivo Não Circulante', tipo: 'PASSIVO', pai: '2' },
  { codigo: '3', nome: 'Patrimônio Líquido', tipo: 'PATRIMONIO_LIQUIDO', pai: null },
  { codigo: '3.1', nome: 'Capital', tipo: 'PATRIMONIO_LIQUIDO', pai: '3' },
  { codigo: '3.2', nome: 'Lucros Acumulados', tipo: 'PATRIMONIO_LIQUIDO', pai: '3' },
  { codigo: '3.3', nome: 'Prejuízos Acumulados', tipo: 'PATRIMONIO_LIQUIDO', pai: '3' },
  { codigo: '4', nome: 'Receita', tipo: 'RECEITA', pai: null },
  { codigo: '4.1', nome: 'Receitas Operacionais', tipo: 'RECEITA', pai: '4' },
  { codigo: '5', nome: 'Despesa', tipo: 'DESPESA', pai: null },
  { codigo: '5.1', nome: 'Despesas Operacionais', tipo: 'DESPESA', pai: '5' },
  { codigo: '6', nome: 'Custos', tipo: 'CUSTO', pai: null },
  { codigo: '6.1', nome: 'Custos Operacionais', tipo: 'CUSTO', pai: '6' },
  { codigo: '7', nome: 'Resultado', tipo: 'RESULTADO', pai: null },
  { codigo: '7.1', nome: 'Apuração do Resultado do Exercício', tipo: 'RESULTADO', pai: '7' },
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
          contaBase: true,
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