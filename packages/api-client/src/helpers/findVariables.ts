/**
 * Find all strings wrapped in {} or {{}} in value.
 *
 */
export const findVariables = (value: string) => {
  // Wrapped in single or double curly braces.
  // Ignores whitespace
  // Works with lowercase, uppercase, numbers, dashes, underscores
  const regex = /(?=\{)\s*\w+\s*(?=\})/g

  return value.match(regex)?.map((variable) => variable.trim()) || []
}
