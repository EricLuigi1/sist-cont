import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

function limparTexto(valor) {
  return String(valor || '').trim()
}

function apenasNumeros(valor) {
  return String(valor || '').replace(/\D/g, '')
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarCPF(cpf) {
  const numeros = apenasNumeros(cpf)

  if (numeros.length !== 11) return false
  if (/^(\d)\1+$/.test(numeros)) return false

  let soma = 0

  for (let i = 0; i < 9; i++) {
    soma += Number(numeros[i]) * (10 - i)
  }

  let primeiroDigito = 11 - (soma % 11)
  if (primeiroDigito >= 10) primeiroDigito = 0

  if (primeiroDigito !== Number(numeros[9])) return false

  soma = 0

  for (let i = 0; i < 10; i++) {
    soma += Number(numeros[i]) * (11 - i)
  }

  let segundoDigito = 11 - (soma % 11)
  if (segundoDigito >= 10) segundoDigito = 0

  return segundoDigito === Number(numeros[10])
}

function validarTelefone(telefone) {
  const numeros = apenasNumeros(telefone)

  return numeros.length === 10 || numeros.length === 11
}

function validarSenha(senha) {
  return (
    senha.length >= 8 &&
    /[A-Za-zÀ-ÿ]/.test(senha) &&
    /\d/.test(senha)
  )
}

export async function POST(request) {
  let body

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { erro: 'Dados inválidos.' },
      { status: 400 }
    )
  }

  const nome = limparTexto(body.nome)
  const email = limparTexto(body.email).toLowerCase()
  const cpf = apenasNumeros(body.cpf)
  const telefone = apenasNumeros(body.telefone)
  const senha = String(body.senha || '')

  if (!nome || !email || !cpf || !telefone || !senha) {
    return NextResponse.json(
      { erro: 'Preencha todos os campos obrigatórios.' },
      { status: 400 }
    )
  }

  if (nome.length < 3) {
    return NextResponse.json(
      { erro: 'O nome deve ter pelo menos 3 caracteres.' },
      { status: 400 }
    )
  }

  if (nome.length > 120) {
    return NextResponse.json(
      { erro: 'O nome deve ter no máximo 120 caracteres.' },
      { status: 400 }
    )
  }

  if (!validarEmail(email)) {
    return NextResponse.json(
      { erro: 'Informe um email válido.' },
      { status: 400 }
    )
  }

  if (!validarCPF(cpf)) {
    return NextResponse.json(
      { erro: 'Informe um CPF válido.' },
      { status: 400 }
    )
  }

  if (!validarTelefone(telefone)) {
    return NextResponse.json(
      { erro: 'Informe um telefone válido com DDD.' },
      { status: 400 }
    )
  }

  if (!validarSenha(senha)) {
    return NextResponse.json(
      { erro: 'A senha deve ter pelo menos 8 caracteres, incluindo letras e números.' },
      { status: 400 }
    )
  }

  try {
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { erro: 'Email já cadastrado!' },
        { status: 409 }
      )
    }

    const cpfExistente = await prisma.usuario.findUnique({
      where: { cpf },
      select: { id: true },
    })

    if (cpfExistente) {
      return NextResponse.json(
        { erro: 'CPF já cadastrado!' },
        { status: 409 }
      )
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        cpf,
        telefone,
        senha: senhaCriptografada,
      },
    })

    return NextResponse.json(
      {
        mensagem: 'Usuário criado com sucesso!',
        id: usuario.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error)

    return NextResponse.json(
      { erro: 'Erro ao cadastrar usuário.' },
      { status: 500 }
    )
  }
}