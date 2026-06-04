'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ColaboradoresPage() {
  const pathname = usePathname()
  const id = pathname.split('/')[2]
  const [colaboradores, setColaboradores] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  function carregarColaboradores() {
    fetch(`/api/empresas/${id}/colaboradores`)
      .then(res => res.json())
      .then(data => setColaboradores(data))
  }

  useEffect(() => {
    carregarColaboradores()
    fetch(`/api/empresas/${id}`)
      .then(res => res.json())
      .then(data => setIsAdmin(data.papel === 'ADMIN'))
  }, [id])

  async function handleRemover(usuarioId, nome) {
    if (!confirm(`Tem certeza que deseja remover ${nome} da empresa?`)) return

    const res = await fetch(`/api/empresas/${id}/colaboradores?usuarioId=${usuarioId}`, {
      method: 'DELETE',
    })

    const data = await res.json()

    if (res.ok) {
      setSucesso('Colaborador removido com sucesso!')
      carregarColaboradores()
      setTimeout(() => setSucesso(''), 3000)
    } else {
      setErro(data.erro || 'Erro ao remover colaborador!')
      setTimeout(() => setErro(''), 3000)
    }
  }

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        description={`${colaboradores.length} membro(s) com acesso`}
      />

      {erro && <Alert variant="destructive" className="mb-4">{erro}</Alert>}
      {sucesso && <Alert variant="success" className="mb-4">{sucesso}</Alert>}

      <div className="flex flex-col gap-3">
        {colaboradores.map(c => (
          <Card key={c.id} className="transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {c.usuario.nome[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{c.usuario.nome}</p>
                    <Badge variant={c.papel === 'ADMIN' ? 'default' : 'secondary'}>
                      {c.papel === 'ADMIN' ? 'Administrador' : 'Colaborador'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.usuario.email}</p>
                  <p className="text-sm text-muted-foreground">{c.usuario.telefone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                <p className="text-xs text-muted-foreground">
                  Desde {new Date(c.criadoEm).toLocaleDateString('pt-BR')}
                </p>
                {isAdmin && c.papel !== 'ADMIN' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleRemover(c.usuario.id, c.usuario.nome)}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
