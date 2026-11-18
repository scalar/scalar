/** Add an explicitly configured prefix without changing the stored credential. */
export const formatTokenPrefix = (value: string, prefix?: string): string => {
  const normalizedPrefix = prefix?.trim()
  if (!normalizedPrefix) {
    return value
  }
  const normalizedValue = value.trim()
  return normalizedValue ? `${normalizedPrefix} ${normalizedValue}` : ''
}
