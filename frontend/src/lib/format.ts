/**
 * Formata um valor numérico para o padrão monetário brasileiro (Real - BRL).
 * Garante a exibição consistente de moeda em toda a interface do usuário.
 * * @param value - O valor numérico bruto a ser formatado.
 * @returns Uma string formatada no padrão BRL (ex: R$ 1.500,00).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Converte uma string de data (YYYY-MM-DD) para o formato local brasileiro (DD/MM/YYYY).
 * Força o horário local para meia-noite (adicionando 'T00:00:00') para evitar 
 * deslocamentos indesejados de fuso horário em datas que não possuem hora especificada.
 * * @param dateStr - A string de data no formato ISO curto (ex: 2026-06-25).
 * @returns Uma string com a data formatada para exibição local.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

/**
 * Fonte única de verdade para os nomes dos meses em português.
 * Utilizada como referência padronizada em seletores de formulários, tabelas 
 * e labels de renderização de gráficos.
 */
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/**
 * Paleta de cores hexadecimal padrão do sistema.
 * Utilizada para garantir consistência visual na renderização dos gráficos (como os de pizza),
 * distribuindo cores distintas e harmoniosas para as diferentes categorias mapeadas.
 */
export const CATEGORY_COLORS = [
  '#0E5787', '#87E078', '#FF6B6B', '#00C8FF', '#C4FF00',
  '#FF9F43', '#A55EEA', '#26DE81', '#FC5C65', '#45AAF2',
  '#FD9644', '#2D98DA',
]
