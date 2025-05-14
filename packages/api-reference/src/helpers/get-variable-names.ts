/**
 * Returns all variables used in a string
 */
export function getVariableNames(value?: string) {
  const singleOrDoubleCurlyBrackets = /{{?\s*([\w.-]+)\s*}}?/g

  // Get all regex matches from value
  const matches = value?.matchAll(singleOrDoubleCurlyBrackets)

  return Array.from(matches ?? [], (match) => match[1])
}
