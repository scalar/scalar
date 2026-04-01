const UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const

/**
 * Format a byte count as a human-readable decimal value
 * @example 1024 -> 1 kB
 * @example 1025 -> 1.03 kB
 */
export const formatBytes = (value: number, precision = 3): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 B'
  }

  // toPrecision rounding can push the value to 1000, overflowing the current unit
  let unitIndex = Math.min(Math.floor(Math.log10(value) / 3), UNITS.length - 1)
  const normalizedValue = Number((value / 1000 ** unitIndex).toPrecision(precision))

  if (normalizedValue >= 1000 && unitIndex < UNITS.length - 1) {
    unitIndex += 1
  }

  return `${Number((value / 1000 ** unitIndex).toPrecision(precision))} ${UNITS[unitIndex]}`
}
