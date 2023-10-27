import type { Variable } from '../types'

/**
 * This function takes a string and replace {variables} with given values.
 */
export function replaceVariables(
  value: string,
  variablesOrCallback: Variable[] | ((match: string) => string),
) {
  // Replace all variables (example: {{ baseurl }} with an HTML tag)
  const doubleCurlyBrackets = /{{\s*([\w.-]+)\s*}}/g
  const singleCurlyBrackets = /{\s*([\w.-]+)\s*}/g

  const callback = (_: string, match: string): string => {
    if (typeof variablesOrCallback === 'function') {
      return variablesOrCallback(match)
    } else {
      const variable = variablesOrCallback?.find(
        (currentVariable: Variable) => currentVariable.name === match,
      )

      return (variable?.value ?? '').toString()
    }
  }

  // Loop through all matches and replace the match with the variable value
  return value
    .replace(doubleCurlyBrackets, callback)
    .replace(singleCurlyBrackets, callback)
}
