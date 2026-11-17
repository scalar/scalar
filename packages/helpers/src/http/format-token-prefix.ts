/** Add an explicitly configured prefix without changing the stored credential. */
export const formatTokenPrefix = (value: string, prefix?: string): string => {
  const normalizedPrefix = prefix?.trim()
  return normalizedPrefix && value ? `${normalizedPrefix} ${value}` : value
}
