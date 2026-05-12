const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
})

async function main() {
  console.log('🌱 Iniciando seed...')

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

  // Lançamentos de teste
  const hoje = new Date()
  const diasDoMes = [1, 3, 5, 8, 10, 12, 15, 18, 20, 22]

  const lançamentosTeste = [
    {
      historico: 'Venda de produtos à vista',
      dia: 1,
      partidas: [
        { conta: '1.1.01', tipo: 'DEBITO', valor: 5000 },
        { conta: '4.1.01', tipo: 'CREDITO', valor: 5000 },
      ],
    },
    {
      historico: 'Prestação de serviços',
      dia: 3,
      partidas: [
        { conta: '1.1.02', tipo: 'DEBITO', valor: 3000 },
        { conta: '4.1.02', tipo: 'CREDITO', valor: 3000 },
      ],
    },
    {
      historico: 'Pagamento de aluguel',
      dia: 5,
      partidas: [
        { conta: '5.1.01', tipo: 'DEBITO', valor: 2000 },
        { conta: '1.1.01', tipo: 'CREDITO', valor: 2000 },
      ],
    },
    {
      historico: 'Pagamento de energia elétrica',
      dia: 8,
      partidas: [
        { conta: '5.1.02', tipo: 'DEBITO', valor: 500 },
        { conta: '1.1.01', tipo: 'CREDITO', valor: 500 },
      ],
    },
    {
      historico: 'Venda de produtos a prazo',
      dia: 10,
      partidas: [
        { conta: '1.1.03', tipo: 'DEBITO', valor: 8000 },
        { conta: '4.1.01', tipo: 'CREDITO', valor: 8000 },
      ],
    },
    {
      historico: 'Pagamento de salários',
      dia: 12,
      partidas: [
        { conta: '5.1.03', tipo: 'DEBITO', valor: 4000 },
        { conta: '1.1.02', tipo: 'CREDITO', valor: 4000 },
      ],
    },
    {
      historico: 'Compra de estoque',
      dia: 15,
      partidas: [
        { conta: '1.1.04', tipo: 'DEBITO', valor: 3000 },
        { conta: '2.1.01', tipo: 'CREDITO', valor: 3000 },
      ],
    },
    {
      historico: 'Recebimento de contas a receber',
      dia: 18,
      partidas: [
        { conta: '1.1.01', tipo: 'DEBITO', valor: 8000 },
        { conta: '1.1.03', tipo: 'CREDITO', valor: 8000 },
      ],
    },
    {
      historico: 'Gastos com marketing',
      dia: 20,
      partidas: [
        { conta: '5.1.04', tipo: 'DEBITO', valor: 1500 },
        { conta: '1.1.01', tipo: 'CREDITO', valor: 1500 },
      ],
    },
    {
      historico: 'Prestação de serviços à vista',
      dia: 22,
      partidas: [
        { conta: '1.1.01', tipo: 'DEBITO', valor: 2500 },
        { conta: '4.1.02', tipo: 'CREDITO', valor: 2500 },
      ],
    },
  ]

  for (const l of lançamentosTeste) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), l.dia)
    await prisma.lote.create({
      data: {
        historico: l.historico,
        data,
        empresaId: empresa.id,
        usuarioId: usuario.id,
        lancamentos: {
          create: l.partidas.map(p => ({
            valor: p.valor,
            tipo: p.tipo,
            contaId: contasCriadas[p.conta],
            empresaId: empresa.id,
            usuarioId: usuario.id,
          })),
        },
      },
    })
  }

  console.log('✅ Lançamentos de teste criados!')
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