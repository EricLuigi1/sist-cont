import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const body = await request.json()

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: body.email },
  })

  if (usuarioExistente) {
    return NextResponse.json({ erro: 'Email já cadastrado!' }, { status: 400 })
  }

  const cpfExistente = await prisma.usuario.findUnique({
    where: { cpf: body.cpf },
  })

  if (cpfExistente) {
    return NextResponse.json({ erro: 'CPF já cadastrado!' }, { status: 400 })
  }

  const senhaCriptografada = await bcrypt.hash(body.senha, 10)

  const usuario = await prisma.usuario.create({
    data: {
      nome: body.nome,
      email: body.email,
      cpf: body.cpf,
      telefone: body.telefone,
      senha: senhaCriptografada,
    },
  })

  return NextResponse.json({ mensagem: 'Usuário criado com sucesso!', id: usuario.id }, { status: 201 })
}