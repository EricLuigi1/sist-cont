import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      telefone: true,
      foto: true,
      criadoEm: true,
    },
  })

  return NextResponse.json(usuario)
}

export async function PUT(request) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })

  const body = await request.json()

  if (body.senhaNova) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
    })

    const senhaCorreta = await bcrypt.compare(body.senhaAtual, usuario.senha)
    if (!senhaCorreta) {
      return NextResponse.json({ erro: 'Senha atual incorreta!' }, { status: 400 })
    }

    const senhaCriptografada = await bcrypt.hash(body.senhaNova, 10)
    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { senha: senhaCriptografada },
    })

    return NextResponse.json({ mensagem: 'Senha alterada com sucesso!' })
  }

  const usuario = await prisma.usuario.update({
    where: { id: session.user.id },
    data: {
      nome: body.nome,
      telefone: body.telefone,
      foto: body.foto || null,
    },
  })

  return NextResponse.json({ mensagem: 'Perfil atualizado com sucesso!', usuario })
}