'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DeleteEmpresaButton({ empresaId, empresaNome }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a empresa "${empresaNome}"?\n\nEssa ação não poderá ser desfeita.`
    )

    if (!confirmar) return

    setLoading(true)

    try {
      const res = await fetch(`/api/empresas/${empresaId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
        return
      }

      const data = await res.json().catch(() => null)
      alert(data?.erro || 'Erro ao excluir empresa.')
    } catch {
      alert('Não foi possível excluir a empresa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={handleDelete}
      className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <Trash2 className="size-4" aria-hidden />
      {loading ? 'Excluindo...' : 'Excluir'}
    </Button>
  )
}