import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

function limparTexto(valor) {
  return String(valor || '').trim()
}

function apenasNumeros(valor) {
  return String(valor || '').replace(/\D/g, '')
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

function validarFoto(foto) {
  if (!foto) return true

  if (typeof foto !== 'string') return false

  const ehBase64Imagem = foto.startsWith('data:image/')
  const tamanhoMaximo = 1024 * 1024 * 1.5

  return ehBase64Imagem && foto.length <= tamanhoMaximo
}

export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { erro: 'Não autorizado!' },
      { status: 401 }
    )
  }

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

  if (!usuario) {
    return NextResponse.json(
      { erro: 'Usuário não encontrado.' },
      { status: 404 }
    )
  }

  return NextResponse.json(usuario)
}

export async function PUT(request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { erro: 'Não autorizado!' },
      { status: 401 }
    )
  }

  let body

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { erro: 'Dados inválidos.' },
      { status: 400 }
    )
  }

  if (body.senhaNova || body.senhaAtual) {
    const senhaAtual = String(body.senhaAtual || '')
    const senhaNova = String(body.senhaNova || '')

    if (!senhaAtual || !senhaNova) {
      return NextResponse.json(
        { erro: 'Informe a senha atual e a nova senha.' },
        { status: 400 }
      )
    }

    if (!validarSenha(senhaNova)) {
      return NextResponse.json(
        { erro: 'A nova senha deve ter pelo menos 8 caracteres, incluindo letras e números.' },
        { status: 400 }
      )
    }

    if (senhaAtual === senhaNova) {
      return NextResponse.json(
        { erro: 'A nova senha deve ser diferente da senha atual.' },
        { status: 400 }
      )
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { senha: true },
    })

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado.' },
        { status: 404 }
      )
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha)

    if (!senhaCorreta) {
      return NextResponse.json(
        { erro: 'Senha atual incorreta!' },
        { status: 400 }
      )
    }

    const senhaCriptografada = await bcrypt.hash(senhaNova, 10)

    await prisma.usuario.update({
      where: { id: session.user.id },
      data: { senha: senhaCriptografada },
    })

    return NextResponse.json({
      mensagem: 'Senha alterada com sucesso!',
    })
  }

  const nome = limparTexto(body.nome)
  const telefone = apenasNumeros(body.telefone)
  const foto = body.foto || null

  if (!nome || !telefone) {
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

  if (!validarTelefone(telefone)) {
    return NextResponse.json(
      { erro: 'Informe um telefone válido com DDD.' },
      { status: 400 }
    )
  }

  if (!validarFoto(foto)) {
    return NextResponse.json(
      { erro: 'A foto deve ser uma imagem válida de até 1MB.' },
      { status: 400 }
    )
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: session.user.id },
      data: {
        nome,
        telefone,
        foto,
      },
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

    return NextResponse.json({
      mensagem: 'Perfil atualizado com sucesso!',
      usuario,
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)

    return NextResponse.json(
      { erro: 'Erro ao atualizar perfil.' },
      { status: 500 }
    )
  }
}