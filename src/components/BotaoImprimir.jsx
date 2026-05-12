'use client'

export default function BotaoImprimir() {
  return (
    <button onClick={() => window.print()} className="border px-4 py-2 rounded hover:bg-gray-50 text-sm">
      🖨️ Imprimir
    </button>
  )
}