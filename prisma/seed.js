const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
})

async function main() {
  console.log('🌱 Iniciando seed...')

  // Cria usuário admin
  const senha = await bcrypt.hash('123456', 10)
  const usuario = await prisma.usuario.upsert({
    where: { email: 'admin@teste.com' },
    update: {},
    create: {
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      senha,
      cpf: '000.000.000-00',
      telefone: '(11) 99999-9999',
    },
  })

  console.log('✅ Usuário criado:', usuario.email)

  // Cria empresa
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      nome: 'Empresa Teste',
      razaoSocial: 'Empresa Teste LTDA',
      cnpj: '00.000.000/0001-00',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      usuarios: {
        create: {
          usuarioId: usuario.id,
          papel: 'ADMIN',
        },
      },
    },
  })

  console.log('✅ Empresa criada:', empresa.nome)

  // Cria plano de contas
  const contas = [
    { codigo: '1', nome: 'Ativo', tipo: 'ATIVO', pai: null },
    { codigo: '1.1', nome: 'Ativo Circulante', tipo: 'ATIVO', pai: '1' },
    { codigo: '1.1.01', nome: 'Caixa', tipo: 'ATIVO', pai: '1.1' },
    { codigo: '1.1.02', nome: 'Banco', tipo: 'ATIVO', pai: '1.1' },
    { codigo: '1.1.03', nome: 'Contas a Receber', tipo: 'ATIVO', pai: '1.1' },
    { codigo: '1.1.04', nome: 'Estoque', tipo: 'ATIVO', pai: '1.1' },
    { codigo: '1.2', nome: 'Ativo Não Circulante', tipo: 'ATIVO', pai: '1' },
    { codigo: '1.2.01', nome: 'Imóveis', tipo: 'ATIVO', pai: '1.2' },
    { codigo: '1.2.02', nome: 'Veículos', tipo: 'ATIVO', pai: '1.2' },
    { codigo: '1.2.03', nome: 'Equipamentos', tipo: 'ATIVO', pai: '1.2' },
    { codigo: '2', nome: 'Passivo', tipo: 'PASSIVO', pai: null },
    { codigo: '2.1', nome: 'Passivo Circulante', tipo: 'PASSIVO', pai: '2' },
    { codigo: '2.1.01', nome: 'Fornecedores', tipo: 'PASSIVO', pai: '2.1' },
    { codigo: '2.1.02', nome: 'Salários a Pagar', tipo: 'PASSIVO', pai: '2.1' },
    { codigo: '2.1.03', nome: 'Impostos a Pagar', tipo: 'PASSIVO', pai: '2.1' },
    { codigo: '2.2', nome: 'Passivo Não Circulante', tipo: 'PASSIVO', pai: '2' },
    { codigo: '2.2.01', nome: 'Empréstimos de Longo Prazo', tipo: 'PASSIVO', pai: '2.2' },
    { codigo: '3', nome: 'Patrimônio Líquido', tipo: 'PATRIMONIO_LIQUIDO', pai: null },
    { codigo: '3.1', nome: 'Capital Social', tipo: 'PATRIMONIO_LIQUIDO', pai: '3' },
    { codigo: '3.2', nome: 'Lucros Acumulados', tipo: 'PATRIMONIO_LIQUIDO', pai: '3' },
    { codigo: '4', nome: 'Receita', tipo: 'RECEITA', pai: null },
    { codigo: '4.1', nome: 'Receitas Operacionais', tipo: 'RECEITA', pai: '4' },
    { codigo: '4.1.01', nome: 'Vendas de Produtos', tipo: 'RECEITA', pai: '4.1' },
    { codigo: '4.1.02', nome: 'Prestação de Serviços', tipo: 'RECEITA', pai: '4.1' },
    { codigo: '5', nome: 'Despesa', tipo: 'DESPESA', pai: null },
    { codigo: '5.1', nome: 'Despesas Operacionais', tipo: 'DESPESA', pai: '5' },
    { codigo: '5.1.01', nome: 'Aluguel', tipo: 'DESPESA', pai: '5.1' },
    { codigo: '5.1.02', nome: 'Energia Elétrica', tipo: 'DESPESA', pai: '5.1' },
    { codigo: '5.1.03', nome: 'Salários', tipo: 'DESPESA', pai: '5.1' },
    { codigo: '5.1.04', nome: 'Marketing', tipo: 'DESPESA', pai: '5.1' },
    { codigo: '5.1.05', nome: 'Material de Escritório', tipo: 'DESPESA', pai: '5.1' },
  ]

  const contasCriadas = {}

  for (const conta of contas) {
    const criada = await prisma.conta.create({
      data: {
        codigo: conta.codigo,
        nome: conta.nome,
        tipo: conta.tipo,
        empresaId: empresa.id,
        contaPaiId: conta.pai ? contasCriadas[conta.pai] : null,
      },
    })
    contasCriadas[conta.codigo] = criada.id
  }

  console.log('✅ Plano de contas criado!')
  console.log('\n🎉 Seed concluído!')
  console.log('📧 Email: admin@teste.com')
  console.log('🔑 Senha: 123456')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })