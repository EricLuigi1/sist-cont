'use client'

export default function BotaoImprimir() {
  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #relatorio-print, #relatorio-print * { visibility: visible; }
          #relatorio-print { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .cabecalho-pdf { display: block !important; }
          @page { margin: 1.5cm; }
        }
        .cabecalho-pdf { display: none; }
      `}</style>
      <button
        onClick={() => window.print()}
        className="no-print flex items-center gap-2 border px-4 py-2 rounded hover:bg-gray-50 text-sm"
      >
        🖨️ Imprimir
      </button>
    </>
  )
}