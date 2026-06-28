// Formata valores monetários no padrão brasileiro para exibição consistente.
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Força horário local em meia-noite para evitar deslocamentos de fuso em datas sem hora.
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

// Fonte única de nomes de meses usada em seleção e gráficos.
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Paleta padrão para categorias em gráficos de pizza.
export const CATEGORY_COLORS = [
  '#0E5787', '#87E078', '#FF6B6B', '#00C8FF', '#C4FF00',
  '#FF9F43', '#A55EEA', '#26DE81', '#FC5C65', '#45AAF2',
  '#FD9644', '#2D98DA',
]
