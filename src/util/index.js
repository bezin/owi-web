export const format = (number) => {
  const formatter = new Intl.NumberFormat('de-DE')
  return formatter.format(number)
}

export default {
  format
}