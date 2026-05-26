export function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatarMoedaInput(valor) {
  const numero = valor.replace(/\D/g, '')
  if (!numero) return ''
  const decimal = (parseInt(numero) / 100).toFixed(2)
  return Number(decimal).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseMoeda(valor) {
  if (!valor) return 0
  return parseFloat(valor.replace(/\./g, '').replace(',', '.'))
}