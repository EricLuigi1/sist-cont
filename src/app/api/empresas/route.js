import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const empresas = await prisma.empresa.findMany()
  return NextResponse.json(empresas)
}

export async function POST(request) {
  const body = await request.json()

  const empresa = await prisma.empresa.create({
    data: {
      nome: body.nome,
      razaoSocial: body.razaoSocial,
      cnpj: body.cnpj,
      endereco: body.endereco,
      cidade: body.cidade,
      estado: body.estado,
    },
  })

  return NextResponse.json(empresa, { status: 201 })
}