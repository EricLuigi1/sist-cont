import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ erro: 'Não autorizado!' }, { status: 401 })
  }

  const { id } = await params

  const vinculo = await prisma.empresaUsuario.findUnique({
    where: {
      usuarioId_empresaId: {
        usuarioId: session.user.id,
        empresaId: id,
      },
    },
    include: { empresa: true },
  })

  if (!vinculo) {
    return NextResponse.json({ erro: 'Acesso negado!' }, { status: 403 })
  }

  return NextResponse.json({
    nome: vinculo.empresa.nome,
    codigoConvite: vinculo.papel === 'ADMIN' ? vinculo.empresa.codigoConvite : null,
    papel: vinculo.papel,
  })
}