'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PerfilPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [aba, setAba] = useState('perfil')
  const [form, setForm] = useState({ nome: '', telefone: '', foto: '' })
  const [senhaForm, setSenhaForm] = useState({ senhaAtual: '', senhaNova: '', confirmarSenha: '' })

  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('aba') === 'senha') setAba('senha')

  fetch('/api/perfil')
    .then(res => res.json())
    .then(data => {
      setUsuario(data)
      setForm({ nome: data.nome, telefone: data.telefone, foto: data.foto || '' })
    })
}, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSenhaChange(e) {
    setSenhaForm({ ...senhaForm, [e.target.name]: e.target.value })
  }

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      setErro('A foto deve ter no máximo 1MB!')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setForm({ ...form, foto: reader.result })
    reader.readAsDataURL(file)
  }

  async function handleSalvarPerfil(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setSucesso('')

    const res = await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (res.ok) {
      setSucesso('Perfil atualizado com sucesso!')
      setTimeout(() => setSucesso(''), 3000)
    } else {
      setErro(data.erro || 'Erro ao atualizar perfil!')
    }

    setLoading(false)
  }

  async function handleAlterarSenha(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (senhaForm.senhaNova !== senhaForm.confirmarSenha) {
      return setErro('As senhas não coincidem!')
    }

    if (senhaForm.senhaNova.length < 6) {
      return setErro('A nova senha deve ter pelo menos 6 caracteres!')
    }

    setLoading(true)

    const res = await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senhaAtual: senhaForm.senhaAtual,
        senhaNova: senhaForm.senhaNova,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      setSucesso('Senha alterada com sucesso!')
      setSenhaForm({ senhaAtual: '', senhaNova: '', confirmarSenha: '' })
      setTimeout(() => setSucesso(''), 3000)
    } else {
      setErro(data.erro || 'Erro ao alterar senha!')
    }

    setLoading(false)
  }

  if (!usuario) return <div className="p-8 text-gray-500">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex border-b">
            <button onClick={() => setAba('perfil')} className={`px-6 py-3 text-sm font-medium ${aba === 'perfil' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Dados Pessoais
            </button>
            <button onClick={() => setAba('senha')} className={`px-6 py-3 text-sm font-medium ${aba === 'senha' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Alterar Senha
            </button>
          </div>
          <div className="p-6">
            {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}
            {sucesso && <p className="text-green-600 text-sm mb-4">{sucesso}</p>}
            {aba === 'perfil' && (
              <form onSubmit={handleSalvarPerfil} className="flex flex-col gap-4">
                <div className="flex items-center gap-6 mb-2">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
                      {form.foto ? (
                        <img src={form.foto} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        usuario.nome[0].toUpperCase()
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-white border rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-50 text-xs">
                      ✏️
                      <input type="file" accept="image/*" onChange={handleFoto} className="hidden" />
                    </label>
                  </div>
                  <div>
                    <p className="font-medium">{usuario.nome}</p>
                    <p className="text-sm text-gray-500">{usuario.email}</p>
                    <p className="text-xs text-gray-400">Membro desde {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nome completo</label>
                  <input name="nome" value={form.nome} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input value={usuario.email} disabled className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500" />
                  <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CPF</label>
                  <input value={usuario.cpf} disabled className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500" />
                  <p className="text-xs text-gray-400 mt-1">O CPF não pode ser alterado.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input name="telefone" value={form.telefone} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded hover:bg-gray-50">
                    Voltar
                  </button>
                </div>
              </form>
            )}
            {aba === 'senha' && (
              <form onSubmit={handleAlterarSenha} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Senha atual</label>
                  <input name="senhaAtual" type="password" value={senhaForm.senhaAtual} onChange={handleSenhaChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nova senha</label>
                  <input name="senhaNova" type="password" value={senhaForm.senhaNova} onChange={handleSenhaChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmar nova senha</label>
                  <input name="confirmarSenha" type="password" value={senhaForm.confirmarSenha} onChange={handleSenhaChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Alterar Senha'}
                  </button>
                  <button type="button" onClick={() => router.back()} className="px-6 py-2 border rounded hover:bg-gray-50">
                    Voltar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}