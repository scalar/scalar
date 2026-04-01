const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const

const formatSignificantDigits = (value: number): string => {
  return Number(value.toPrecision(3)).toString()
}

/**
 * Format a byte count as a human-readable decimal value.
 */
export const prettyBytes = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 B'
  }

  const unitIndex = value < 1 ? 0 : Math.min(Math.floor(Math.log10(value) / 3), UNITS.length - 1)
  const normalizedValue = value / 1000 ** unitIndex

  return `${formatSignificantDigits(normalizedValue)} ${UNITS[unitIndex]}`
}
