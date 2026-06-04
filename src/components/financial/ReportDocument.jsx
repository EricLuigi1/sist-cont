import { cn } from "@/lib/utils"

export function ReportDocument({ children, className, id = "relatorio-print" }) {
  return (
    <div id={id} className={cn("report-document", className)}>
      {children}
    </div>
  )
}

export function ReportPdfHeader({ razaoSocial, cnpj, geradoPor, dataGeracao }) {
  return (
    <div className="cabecalho-pdf mb-6 border-b border-border pb-4 p-4">
      <h2 className="text-xl font-semibold tracking-tight">{razaoSocial}</h2>
      <p className="text-sm text-muted-foreground">CNPJ: {cnpj}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Gerado por: {geradoPor} — {dataGeracao}
      </p>
    </div>
  )
}

export function ReportDocumentHeader({ title, period }) {
  return (
    <div className="report-document-header">
      <h2 className="report-document-title">{title}</h2>
      {period && <p className="report-document-period">{period}</p>}
    </div>
  )
}

export function ReportLineGroup({ numero, titulo, valor, formatValue }) {
  const formatted = formatValue(valor)
  return (
    <div className="report-line-group">
      <span>
        {numero} — {titulo}
      </span>
      <span className="financial-amount">{formatted}</span>
    </div>
  )
}

export function ReportLineDetail({ codigo, nome, valor, formatValue }) {
  return (
    <div className="report-line-detail">
      <span className="min-w-0 truncate pr-4">
        {codigo} — {nome}
      </span>
      <span className="report-line-detail-value shrink-0">
        {formatValue(valor)}
      </span>
    </div>
  )
}

export function ReportLineResult({ numero, titulo, valor, formatValue }) {
  const positivo = valor >= 0
  return (
    <div
      className={
        positivo ? "report-line-result-positive" : "report-line-result-negative"
      }
    >
      <span>
        {numero} — {titulo}
        {!positivo ? " (Prejuízo)" : ""}
      </span>
      <span className="financial-amount">{formatValue(Math.abs(valor))}</span>
    </div>
  )
}

export function ReportSectionLabel({ children }) {
  return (
    <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}
