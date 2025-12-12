import { REGEX } from '@/regex/regex-helpers'

/**
 * This function takes a string and replaces both {single} and {{double}} curly brace variables with given values.
 * Use the replacePathVariables and replaceEnvVariables functions if you only need to replace one type of variable.
 */
export function replaceVariables(
  value: string,
  variablesOrCallback: Record<string, string | number> | ((match: string) => string),
) {
  // Replace all variables (example: {{ baseurl }} with an HTML tag)
  const doubleCurlyBrackets = /{{\s*([\w.-]+)\s*}}/g
  const singleCurlyBrackets = /{\s*([\w.-]+)\s*}/g

  const callback = (_: string, match: string): string => {
    if (typeof variablesOrCallback === 'function') {
      return variablesOrCallback(match)
    }
    return variablesOrCallback[match]?.toString() || `{${match}}`
  }

  // Loop through all matches and replace the match with the variable value
  return value.replace(doubleCurlyBrackets, callback).replace(singleCurlyBrackets, callback)
}

/** Replace {path} variables with their values */
export const replacePathVariables = (path: string, variables: Record<string, string> = {}) =>
  path.replace(REGEX.PATH, (match, key) => variables[key] ?? match)

/** Replace {{env}} variables with their values */
export const replaceEnvVariables = (path: string, variables: Record<string, string> = {}) =>
  path.replace(REGEX.VARIABLES, (match, key) => variables[key] ?? match)
