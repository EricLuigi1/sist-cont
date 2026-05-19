const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
})

async function main() {
  console.log('🌱 Iniciando seed...')

  const senha = await bcrypt.hash('123456', 10)

  const admin = await prisma.usuario.upsert({
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

  const colaborador = await prisma.usuario.upsert({
    where: { email: 'colaborador@teste.com' },
    update: {},
    create: {
      nome: 'Colaborador Teste',
      email: 'colaborador@teste.com',
      senha,
      cpf: '111.111.111-11',
      telefone: '(11) 88888-8888',
    },
  })

  console.log('✅ Usuários criados')

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
        create: [
          { usuarioId: admin.id, papel: 'ADMIN' },
          { usuarioId: colaborador.id, papel: 'COLABORADOR' },
        ],
      },
    },
  })

  console.log('✅ Empresa criada:', empresa.nome)

  const contas = [
  { codigo: '1', nome: 'Ativo', tipo: 'ATIVO', pai: null },
  { codigo: '1.1', nome: 'Ativo Circulante', tipo: 'ATIVO', pai: '1' },
  { codigo: '1.2', nome: 'Ativo Não Circulante', tipo: 'ATIVO', pai: '1' },
  { codigo: '1.1.01', nome: 'Caixa', tipo: 'ATIVO', pai: '1.1' },
  { codigo: '1.1.02', nome: 'Banco', tipo: 'ATIVO', pai: '1.1' },
  { codigo: '1.1.03', nome: 'Contas a Receber', tipo: 'ATIVO', pai: '1.1' },
  { codigo: '1.1.04', nome: 'Estoque', tipo: 'ATIVO', pai: '1.1' },
  { codigo: '1.2.01', nome: 'Imóveis', tipo: 'ATIVO', pai: '1.2' },
  { codigo: '1.2.02', nome: 'Veículos', tipo: 'ATIVO', pai: '1.2' },
  { codigo: '1.2.03', nome: 'Equipamentos', tipo: 'ATIVO', pai: '1.2' },
  { codigo: '2', nome: 'Passivo', tipo: 'PASSIVO', pai: null },
  { codigo: '2.1', nome: 'Passivo Circulante', tipo: 'PASSIVO', pai: '2' },
  { codigo: '2.2', nome: 'Passivo Não Circulante', tipo: 'PASSIVO', pai: '2' },
  { codigo: '2.1.01', nome: 'Fornecedores', tipo: 'PASSIVO', pai: '2.1' },
  { codigo: '2.1.02', nome: 'Salários a Pagar', tipo: 'PASSIVO', pai: '2.1' },
  { codigo: '2.1.03', nome: 'Impostos a Pagar', tipo: 'PASSIVO', pai: '2.1' },
  { codigo: '2.2.01', nome: 'Empréstimos de Longo Prazo', tipo: 'PASSIVO', pai: '2.2' },
  { codigo: '3', nome: 'Patrimônio Líquido', tipo: 'PATRIMONIO_LIQUIDO', pai: null },
  { codigo: '3.1', nome: 'Capital', tipo: 'PATRIMONIO_LIQUIDO', pai: '3' },
  { codigo: '3.2', nome: 'Lucros Acumulados', tipo: 'PATRIMONIO_LIQUIDO', pai: '3' },
  { codigo: '3.3', nome: 'Prejuízos Acumulados', tipo: 'PATRIMONIO_LIQUIDO', pai: '3' },
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
  { codigo: '6', nome: 'Resultado', tipo: 'RESULTADO', pai: null },
  { codigo: '6.1', nome: 'Apuração do Resultado do Exercício', tipo: 'RESULTADO', pai: '6' },
]

  const contasCriadas = {}
  for (const conta of contas) {
  const criada = await prisma.conta.create({
    data: {
      codigo: conta.codigo,
      nome: conta.nome,
      tipo: conta.tipo,
      contaBase: ['1','1.1','1.2','2','2.1','2.2','3','3.1','3.2','3.3','4','4.1','5','5.1','6','6.1'].includes(conta.codigo),
      empresaId: empresa.id,
      contaPaiId: conta.pai ? contasCriadas[conta.pai] : null,
    },
  })
  contasCriadas[conta.codigo] = criada.id
  }

  console.log('✅ Plano de contas criado!')

  const hoje = new Date()

  const lancamentos = [
    {
      historico: 'Integralização de capital social',
      dia: 1,
      usuario: admin.id,
      partidas: [
        { conta: '1.1.01', tipo: 'DEBITO', valor: 50000 },
        { conta: '3.1', tipo: 'CREDITO', valor: 50000 },
      ],
    },
    {
      historico: 'Compra de equipamentos',
      dia: 2,
      usuario: admin.id,
      partidas: [
        { conta: '1.2.03', tipo: 'DEBITO', valor: 10000 },
        { conta: '1.1.01', tipo: 'CREDITO', valor: 10000 },
      ],
    },
    {
      historico: 'Compra de estoque a prazo',
      dia: 3,
      usuario: colaborador.id,
      partidas: [
        { conta: '1.1.04', tipo: 'DEBITO', valor: 8000 },
        { conta: '2.1.01', tipo: 'CREDITO', valor: 8000 },
      ],
    },
    {
      historico: 'Venda de produtos à vista',
      dia: 5,
      usuario: colaborador.id,
      partidas: [
        { conta: '1.1.01', tipo: 'DEBITO', valor: 5000 },
        { conta: '4.1.01', tipo: 'CREDITO', valor: 5000 },
      ],
    },
    {
      historico: 'Prestação de serviços',
      dia: 8,
      usuario: colaborador.id,
      partidas: [
        { conta: '1.1.02', tipo: 'DEBITO', valor: 3000 },
        { conta: '4.1.02', tipo: 'CREDITO', valor: 3000 },
      ],
    },
    {
      historico: 'Pagamento de aluguel',
      dia: 10,
      usuario: admin.id,
      partidas: [
        { conta: '5.1.01', tipo: 'DEBITO', valor: 2000 },
        { conta: '1.1.01', tipo: 'CREDITO', valor: 2000 },
      ],
    },
    {
      historico: 'Pagamento de energia elétrica',
      dia: 12,
      usuario: admin.id,
      partidas: [
        { conta: '5.1.02', tipo: 'DEBITO', valor: 500 },
        { conta: '1.1.01', tipo: 'CREDITO', valor: 500 },
      ],
    },
    {
      historico: 'Venda de produtos a prazo',
      dia: 14,
      usuario: colaborador.id,
      partidas: [
        { conta: '1.1.03', tipo: 'DEBITO', valor: 8000 },
        { conta: '4.1.01', tipo: 'CREDITO', valor: 8000 },
      ],
    },
    {
      historico: 'Pagamento de salários',
      dia: 15,
      usuario: admin.id,
      partidas: [
        { conta: '5.1.03', tipo: 'DEBITO', valor: 4000 },
        { conta: '1.1.02', tipo: 'CREDITO', valor: 4000 },
      ],
    },
    {
      historico: 'Recebimento de contas a receber',
      dia: 18,
      usuario: colaborador.id,
      partidas: [
        { conta: '1.1.01', tipo: 'DEBITO', valor: 8000 },
        { conta: '1.1.03', tipo: 'CREDITO', valor: 8000 },
      ],
    },
    {
      historico: 'Pagamento de fornecedores',
      dia: 20,
      usuario: admin.id,
      partidas: [
        { conta: '2.1.01', tipo: 'DEBITO', valor: 8000 },
        { conta: '1.1.01', tipo: 'CREDITO', valor: 8000 },
      ],
    },
    {
      historico: 'Gastos com marketing',
      dia: 22,
      usuario: colaborador.id,
      partidas: [
        { conta: '5.1.04', tipo: 'DEBITO', valor: 1500 },
        { conta: '1.1.01', tipo: 'CREDITO', valor: 1500 },
      ],
    },
    {
      historico: 'Prestação de serviços à vista',
      dia: 25,
      usuario: colaborador.id,
      partidas: [
        { conta: '1.1.01', tipo: 'DEBITO', valor: 2500 },
        { conta: '4.1.02', tipo: 'CREDITO', valor: 2500 },
      ],
    },
  ]

  for (const l of lancamentos) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), l.dia)
    await prisma.lote.create({
      data: {
        historico: l.historico,
        data,
        empresaId: empresa.id,
        usuarioId: l.usuario,
        lancamentos: {
          create: l.partidas.map(p => ({
            valor: p.valor,
            tipo: p.tipo,
            contaId: contasCriadas[p.conta],
            empresaId: empresa.id,
            usuarioId: l.usuario,
          })),
        },
      },
    })
  }

  console.log('✅ Lançamentos criados!')
  console.log('\n🎉 Seed concluído!')
  console.log('👤 Admin       → admin@teste.com / 123456')
  console.log('👤 Colaborador → colaborador@teste.com / 123456')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })