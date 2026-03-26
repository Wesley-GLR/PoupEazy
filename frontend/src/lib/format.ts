export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const CATEGORY_COLORS = [
  '#0E5787', '#87E078', '#FF6B6B', '#00C8FF', '#C4FF00',
  '#FF9F43', '#A55EEA', '#26DE81', '#FC5C65', '#45AAF2',
  '#FD9644', '#2D98DA',
]
