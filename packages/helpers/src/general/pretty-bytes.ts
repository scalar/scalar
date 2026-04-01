const UNITS = ['B', 'kB', 'MB', 'GB'] as const

/**
 * Format a byte count as a human-readable decimal value.
 */
export const prettyBytes = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 B'
  }

  let normalizedValue = value
  let unitIndex = 0

  while (normalizedValue >= 1000 && unitIndex < UNITS.length - 1) {
    normalizedValue /= 1000
    unitIndex++
  }

  const fractionDigits = unitIndex === 0 ? 0 : 1

  return `${normalizedValue.toFixed(fractionDigits)} ${UNITS[unitIndex]}`
}
