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

// Versão compacta para eixos de gráficos (ex.: "R$ 5k", "R$ 1,2 mi").
export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

// Verifica se uma data (YYYY-MM-DD) pertence ao mês/ano informados.
// Centraliza a regra de recorte por período usada nas telas.
export function isInPeriod(dateStr: string, mes: number, ano: number): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getMonth() + 1 === mes && d.getFullYear() === ano
}

// Verifica se uma data (YYYY-MM-DD) está dentro do intervalo [dataInicio, dataFim].
// Ambos os limites são inclusivos.
export function isInDateRange(dateStr: string, dataInicio: string, dataFim: string): boolean {
  const d = dateStr.slice(0, 10)
  return d >= dataInicio && d <= dataFim
}

// Gera a string YYYY-MM-DD do primeiro dia de um mês/ano.
export function firstDayOfMonth(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-01`
}

// Gera a string YYYY-MM-DD do último dia de um mês/ano.
export function lastDayOfMonth(mes: number, ano: number): string {
  const last = new Date(ano, mes, 0).getDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(last).padStart(2, '0')}`
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
