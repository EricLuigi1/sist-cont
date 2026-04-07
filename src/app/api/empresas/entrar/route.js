import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })
  }

  const body = await request.json()

  // Busca a empresa pelo código de convite
  const empresa = await prisma.empresa.findUnique({
    where: { codigoConvite: body.codigo },
  })

  if (!empresa) {
    return NextResponse.json({ erro: 'Código de convite inválido!' }, { status: 404 })
  }

  // Verifica se o usuário já está vinculado a essa empresa
  const vinculoExistente = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: empresa.id,
      },
    },
  })

  if (vinculoExistente) {
    return NextResponse.json({ erro: 'Você já faz parte dessa empresa!' }, { status: 400 })
  }

  
  await prisma.empresaUsuario.create({
    data: {
      usuarioId: session.user.id,
      empresaId: empresa.id,
      papel: 'COLABORADOR',
    },
  })

  return NextResponse.json({ id: empresa.id }, { status: 200 })
}