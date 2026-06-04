'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Landmark,
  MapPin,
  Pencil,
  Save,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export default function InfoEmpresaPage() {
  const pathname = usePathname()
  const router = useRouter()
  const id = pathname.split('/')[2]

  const [empresa, setEmpresa] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [form, setForm] = useState({
    nome: '',
    razaoSocial: '',
    endereco: '',
    cidade: '',
    estado: '',
  })

  useEffect(() => {
    fetch(`/api/empresas/${id}/info`)
      .then(res => res.json())
      .then(data => {
        setEmpresa(data)
        setIsAdmin(data.papel === 'ADMIN')
        setForm({
          nome: data.nome || '',
          razaoSocial: data.razaoSocial || '',
          endereco: data.endereco || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
        })
      })
  }, [id])

  function handleChange(e) {
    const { name, value } = e.target

    if (name === 'estado') {
      setForm(prev => ({
        ...prev,
        estado: value.toUpperCase().slice(0, 2),
      }))
      return
    }

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  function validarFormulario() {
    const dados = {
      nome: form.nome.trim(),
      razaoSocial: form.razaoSocial.trim(),
      endereco: form.endereco.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado.trim().toUpperCase(),
    }

    if (!dados.nome) {
      return { valido: false, mensagem: 'Informe o nome fantasia da empresa.' }
    }

    if (!dados.razaoSocial) {
      return { valido: false, mensagem: 'Informe a razão social da empresa.' }
    }

    if (!dados.endereco) {
      return { valido: false, mensagem: 'Informe o endereço da empresa.' }
    }

    if (!dados.cidade) {
      return { valido: false, mensagem: 'Informe a cidade da empresa.' }
    }

    if (!dados.estado) {
      return { valido: false, mensagem: 'Informe o estado da empresa.' }
    }

    if (!/^[A-Z]{2}$/.test(dados.estado)) {
      return {
        valido: false,
        mensagem: 'Informe o estado usando a sigla com 2 letras. Exemplo: SP.',
      }
    }

    return { valido: true, dados }
  }

  async function handleSalvar(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    const validacao = validarFormulario()

    if (!validacao.valido) {
      setErro(validacao.mensagem)
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/empresas/${id}/info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.dados),
      })

      const data = await res.json().catch(() => null)

      if (res.ok) {
        setSucesso('Empresa atualizada com sucesso!')
        setEmpresa(prev => ({
          ...prev,
          ...validacao.dados,
        }))
        setEditando(false)
        setTimeout(() => setSucesso(''), 3000)
      } else {
        setErro(data?.erro || 'Erro ao atualizar empresa!')
      }
    } catch {
      setErro('Não foi possível atualizar a empresa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function cancelarEdicao() {
    setForm({
      nome: empresa.nome || '',
      razaoSocial: empresa.razaoSocial || '',
      endereco: empresa.endereco || '',
      cidade: empresa.cidade || '',
      estado: empresa.estado || '',
    })
    setEditando(false)
    setErro('')
    setSucesso('')
  }

  if (!empresa) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm text-zinc-500 shadow-sm">
          Carregando...
        </div>
      </div>
    )
  }

  const camposVisualizacao = [
    {
      label: 'Nome fantasia',
      key: 'nome',
      icon: Building2,
    },
    {
      label: 'Razão social',
      key: 'razaoSocial',
      icon: Landmark,
    },
    {
      label: 'CNPJ',
      key: 'cnpj',
      icon: FileText,
      locked: true,
    },
    {
      label: 'Endereço',
      key: 'endereco',
      icon: MapPin,
    },
    {
      label: 'Cidade',
      key: 'cidade',
      icon: MapPin,
    },
    {
      label: 'Estado',
      key: 'estado',
      icon: MapPin,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="space-y-4">
        <PageHeader
          title="Informações da empresa"
          description="Consulte e atualize os dados cadastrais do workspace"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </Button>

              {isAdmin && !editando && (
                <Button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="rounded-xl"
                >
                  <Pencil className="size-4" aria-hidden />
                  Editar
                </Button>
              )}
            </div>
          }
        />

        {erro && (
          <Alert variant="destructive" className="rounded-2xl">
            {erro}
          </Alert>
        )}

        {sucesso && (
          <Alert variant="success" className="rounded-2xl">
            {sucesso}
          </Alert>
        )}
      </div>

      {editando ? (
        <Card className="mt-6 overflow-hidden rounded-3xl border-zinc-200 bg-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
                  <Pencil className="size-5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950">
                    Editar dados da empresa
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    O CNPJ não pode ser alterado após o cadastro. Para corrigir esse dado,
                    será necessário criar uma nova empresa ou ajustar diretamente na administração.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSalvar} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome fantasia" htmlFor="nome">
                  <Input
                    id="nome"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                    maxLength={80}
                    className="h-11 rounded-xl border-zinc-200 bg-white"
                  />
                </Field>

                <Field label="Razão social" htmlFor="razaoSocial">
                  <Input
                    id="razaoSocial"
                    name="razaoSocial"
                    value={form.razaoSocial}
                    onChange={handleChange}
                    required
                    maxLength={120}
                    className="h-11 rounded-xl border-zinc-200 bg-white"
                  />
                </Field>
              </div>

              <Field label="CNPJ" hint="O CNPJ não pode ser alterado.">
                <Input
                  value={empresa.cnpj || ''}
                  disabled
                  className="h-11 rounded-xl border-zinc-200 bg-zinc-100 text-zinc-500"
                />
              </Field>

              <Field label="Endereço" htmlFor="endereco">
                <Input
                  id="endereco"
                  name="endereco"
                  value={form.endereco}
                  onChange={handleChange}
                  required
                  maxLength={160}
                  className="h-11 rounded-xl border-zinc-200 bg-white"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <Field label="Cidade" htmlFor="cidade">
                  <Input
                    id="cidade"
                    name="cidade"
                    value={form.cidade}
                    onChange={handleChange}
                    required
                    maxLength={80}
                    className="h-11 rounded-xl border-zinc-200 bg-white"
                  />
                </Field>

                <Field label="Estado" htmlFor="estado">
                  <Input
                    id="estado"
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    required
                    maxLength={2}
                    className="h-11 rounded-xl border-zinc-200 bg-white uppercase"
                  />
                </Field>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-xl px-5"
                >
                  <Save className="size-4" aria-hidden />
                  {loading ? 'Salvando...' : 'Salvar alterações'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelarEdicao}
                  disabled={loading}
                  className="h-11 rounded-xl px-5"
                >
                  <X className="size-4" aria-hidden />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mt-6 overflow-hidden rounded-3xl border-zinc-200 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-start gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-zinc-950 text-lg font-semibold text-white shadow-sm">
                  {empresa.nome?.[0]?.toUpperCase() || 'E'}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold text-zinc-950">
                    {empresa.nome}
                  </h2>
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    {empresa.razaoSocial}
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                    <CheckCircle2 className="size-3.5 text-zinc-950" aria-hidden />
                    {isAdmin ? 'Administrador' : 'Colaborador'}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {camposVisualizacao.map(campo => {
                  const Icon = campo.icon

                  return (
                    <div
                      key={campo.key}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                          <Icon className="size-4" aria-hidden />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                              {campo.label}
                            </p>

                            {campo.locked && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                                Bloqueado
                              </span>
                            )}
                          </div>

                          <p className="mt-1 break-words font-medium text-zinc-950">
                            {empresa[campo.key] || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                      <CalendarDays className="size-4" aria-hidden />
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Membro desde
                      </p>
                      <p className="mt-1 font-medium text-zinc-950">
                        {new Date(empresa.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}