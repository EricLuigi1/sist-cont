import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const body = await request.json()

  // Verifica se o email já está cadastrado
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: body.email },
  })

  if (usuarioExistente) {
    return NextResponse.json(
      { erro: 'Email já cadastrado!' },
      { status: 400 }
    )
  }

  // Criptografa a senha antes de salvar
  const senhaCriptografada = await bcrypt.hash(body.senha, 10)

  // Cria o usuário no banco
  const usuario = await prisma.usuario.create({
    data: {
      nome: body.nome,
      email: body.email,
      senha: senhaCriptografada,
    },
  })

  return NextResponse.json(
    { mensagem: 'Usuário criado com sucesso!', id: usuario.id },
    { status: 201 }
  )
}