export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 2 }).format(value)
}
