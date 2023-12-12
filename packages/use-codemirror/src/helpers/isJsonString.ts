/**
 * Check if value is a valid JSON string
 */
export const isJsonString = (value?: any) => {
  if (typeof value !== 'string') {
    return false
  }

  try {
    JSON.parse(value)
  } catch {
    return false
  }

  return true
}
