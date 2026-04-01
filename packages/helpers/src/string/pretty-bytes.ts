const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const

/**
 * Format a byte count as a human-readable decimal value.
 */
export const prettyBytes = (value: number, precision = 3): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 B'
  }

  const unitIndex = value < 1 ? 0 : Math.min(Math.floor(Math.log10(value) / 3), UNITS.length - 1)
  const normalizedValue = value / 1000 ** unitIndex

  return `${Number(normalizedValue.toPrecision(precision)).toString()} ${UNITS[unitIndex]}`
}
