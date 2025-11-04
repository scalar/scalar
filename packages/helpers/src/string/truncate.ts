/**
 * Truncates a string to a specified length and adds an ellipsis if it's longer in JS
 *
 * @param str - The string to truncate
 * @param maxLength - The maximum length before truncation (default: 18)
 * @returns The truncated string with ellipsis if needed
 *
 * @example
 * truncate('Very long name that needs truncation') // 'Very long name th…'
 * truncate('Short') // 'Short'
 */
export const truncate = (str: string, maxLength = 18): string => {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength) + '…'
}
