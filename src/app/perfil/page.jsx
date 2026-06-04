'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function PerfilPage() {
  const router = useRouter()

  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [aba, setAba] = useState('perfil')
  const [form, setForm] = useState({ nome: '', telefone: '', foto: '' })
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: '',
    senhaNova: '',
    confirmarSenha: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('aba') === 'senha') setAba('senha')

    fetch('/api/perfil')
      .then(res => res.json())
      .then(data => {
        setUsuario(data)
        setForm({
          nome: data?.nome || '',
          telefone: formatarTelefone(data?.telefone || ''),
          foto: data?.foto || '',
        })
      })
  }, [])

  function apenasNumeros(valor) {
    return String(valor || '').replace(/\D/g, '')
  }

  function formatarCPF(valor) {
    const numeros = apenasNumeros(valor).slice(0, 11)

    return numeros
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }

  function formatarTelefone(valor) {
    const numeros = apenasNumeros(valor).slice(0, 11)

    if (numeros.length <= 10) {
      return numeros
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }

    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
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

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'telefone') {
      setForm(prev => ({
        ...prev,
        telefone: formatarTelefone(value),
      }))
      return
    }

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSenhaChange(e) {
    const { name, value } = e.target

    setSenhaForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setErro('')
    setSucesso('')

    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem válido.')
      return
    }

    if (file.size > 1024 * 1024) {
      setErro('A foto deve ter no máximo 1MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        foto: String(reader.result || ''),
      }))
    }
    reader.readAsDataURL(file)
  }

  function validarPerfil() {
    const dados = {
      nome: form.nome.trim(),
      telefone: apenasNumeros(form.telefone),
      foto: form.foto || '',
    }

    if (!dados.nome || !dados.telefone) {
      return {
        valido: false,
        mensagem: 'Preencha todos os campos obrigatórios.',
      }
    }

    if (dados.nome.length < 3) {
      return {
        valido: false,
        mensagem: 'O nome deve ter pelo menos 3 caracteres.',
      }
    }

    if (!validarTelefone(dados.telefone)) {
      return {
        valido: false,
        mensagem: 'Informe um telefone válido com DDD.',
      }
    }

    return {
      valido: true,
      dados,
    }
  }

  function validarAlteracaoSenha() {
    const dados = {
      senhaAtual: senhaForm.senhaAtual,
      senhaNova: senhaForm.senhaNova,
      confirmarSenha: senhaForm.confirmarSenha,
    }

    if (!dados.senhaAtual || !dados.senhaNova || !dados.confirmarSenha) {
      return {
        valido: false,
        mensagem: 'Preencha todos os campos de senha.',
      }
    }

    if (dados.senhaNova !== dados.confirmarSenha) {
      return {
        valido: false,
        mensagem: 'As senhas não coincidem.',
      }
    }

    if (!validarSenha(dados.senhaNova)) {
      return {
        valido: false,
        mensagem: 'A nova senha deve ter pelo menos 8 caracteres, incluindo letras e números.',
      }
    }

    if (dados.senhaAtual === dados.senhaNova) {
      return {
        valido: false,
        mensagem: 'A nova senha deve ser diferente da senha atual.',
      }
    }

    return {
      valido: true,
      dados: {
        senhaAtual: dados.senhaAtual,
        senhaNova: dados.senhaNova,
      },
    }
  }

  async function handleSalvarPerfil(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    const validacao = validarPerfil()

    if (!validacao.valido) {
      setErro(validacao.mensagem)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.dados),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        const usuarioAtualizado = data?.usuario || {
          ...usuario,
          ...validacao.dados,
        }

        setUsuario(usuarioAtualizado)
        setForm({
          nome: usuarioAtualizado.nome || '',
          telefone: formatarTelefone(usuarioAtualizado.telefone || ''),
          foto: usuarioAtualizado.foto || '',
        })
        setSucesso('Perfil atualizado com sucesso!')
        setTimeout(() => setSucesso(''), 3000)
      } else {
        setErro(data?.erro || 'Erro ao atualizar perfil.')
      }
    } catch {
      setErro('Não foi possível atualizar o perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAlterarSenha(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    const validacao = validarAlteracaoSenha()

    if (!validacao.valido) {
      setErro(validacao.mensagem)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.dados),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setSucesso('Senha alterada com sucesso!')
        setSenhaForm({
          senhaAtual: '',
          senhaNova: '',
          confirmarSenha: '',
        })
        setTimeout(() => setSucesso(''), 3000)
      } else {
        setErro(data?.erro || 'Erro ao alterar senha.')
      }
    } catch {
      setErro('Não foi possível alterar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-600 shadow-sm">
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-zinc-900">PPEM Contabilidade</p>
            <p className="text-xs text-zinc-500">Meu perfil</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            Voltar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Meu perfil
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Atualize seus dados pessoais e sua senha com segurança.
          </p>
        </div>

        <Card className="overflow-hidden rounded-3xl border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-zinc-50 px-2 pt-2">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1">
              {[
                { id: 'perfil', label: 'Dados pessoais' },
                { id: 'senha', label: 'Alterar senha' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setAba(tab.id)
                    setErro('')
                    setSucesso('')
                  }}
                  className={cn(
                    'rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    aba === tab.id
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            {erro && (
              <Alert
                variant="destructive"
                className="mb-4 rounded-2xl border-red-200 bg-red-50 text-red-700"
              >
                {erro}
              </Alert>
            )}

            {sucesso && (
              <Alert
                variant="success"
                className="mb-4 rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                {sucesso}
              </Alert>
            )}

            {aba === 'perfil' && (
              <form onSubmit={handleSalvarPerfil} className="flex flex-col gap-5">
                <div className="flex items-center gap-5 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                  <div className="relative">
                    <div className="flex size-20 items-center justify-center overflow-hidden rounded-3xl bg-zinc-950 text-2xl font-bold text-white shadow-sm">
                      {form.foto ? (
                        <img
                          src={form.foto}
                          alt="Foto do perfil"
                          className="size-full object-cover"
                        />
                      ) : (
                        usuario?.nome?.[0]?.toUpperCase() ?? 'U'
                      )}
                    </div>

                    <label className="absolute -bottom-1 -right-1 flex size-8 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all hover:bg-zinc-100">
                      <Camera className="size-4" aria-hidden />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFoto}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-zinc-950">
                      {usuario.nome}
                    </p>
                    <p className="truncate text-sm text-zinc-500">
                      {usuario.email}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Membro desde {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <Field label="Nome completo" htmlFor="nome">
                    <Input
                      id="nome"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      required
                      maxLength={120}
                      className="h-11 rounded-xl border-zinc-200 bg-white"
                    />
                  </Field>

                  <Field label="Email" hint="O email não pode ser alterado.">
                    <Input
                      value={usuario.email}
                      disabled
                      className="h-11 rounded-xl border-zinc-200 bg-zinc-100"
                    />
                  </Field>

                  <Field label="CPF" hint="O CPF não pode ser alterado.">
                    <Input
                      value={formatarCPF(usuario.cpf)}
                      disabled
                      className="h-11 rounded-xl border-zinc-200 bg-zinc-100"
                    />
                  </Field>

                  <Field label="Telefone" htmlFor="telefone">
                    <Input
                      id="telefone"
                      name="telefone"
                      value={form.telefone}
                      onChange={handleChange}
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="(00) 00000-0000"
                      className="h-11 rounded-xl border-zinc-200 bg-white"
                    />
                  </Field>
                </div>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-xl px-5"
                  >
                    {loading ? 'Salvando...' : 'Salvar alterações'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="h-11 rounded-xl px-5"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            )}

            {aba === 'senha' && (
              <form onSubmit={handleAlterarSenha} className="flex flex-col gap-4">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                  <p className="text-sm font-medium text-zinc-900">
                    Segurança da conta
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Use pelo menos 8 caracteres, com letras e números.
                  </p>
                </div>

                <Field label="Senha atual" htmlFor="senhaAtual">
                  <Input
                    id="senhaAtual"
                    name="senhaAtual"
                    type="password"
                    value={senhaForm.senhaAtual}
                    onChange={handleSenhaChange}
                    required
                    autoComplete="current-password"
                    className="h-11 rounded-xl border-zinc-200 bg-white"
                  />
                </Field>

                <Field label="Nova senha" htmlFor="senhaNova">
                  <Input
                    id="senhaNova"
                    name="senhaNova"
                    type="password"
                    value={senhaForm.senhaNova}
                    onChange={handleSenhaChange}
                    required
                    autoComplete="new-password"
                    className="h-11 rounded-xl border-zinc-200 bg-white"
                  />
                </Field>

                <Field label="Confirmar nova senha" htmlFor="confirmarSenha">
                  <Input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type="password"
                    value={senhaForm.confirmarSenha}
                    onChange={handleSenhaChange}
                    required
                    autoComplete="new-password"
                    className="h-11 rounded-xl border-zinc-200 bg-white"
                  />
                </Field>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-xl px-5"
                  >
                    {loading ? 'Salvando...' : 'Alterar senha'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="h-11 rounded-xl px-5"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
