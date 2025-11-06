import { REGEX } from './regex-helpers'

/**
 * Find all strings wrapped in {} or {{}} in value.
 *
 * @param value - The string to find variables in
 * @param includePath - Whether to include path variables {single}
 * @param includeEnv - Whether to include environment variables {{double}}
 */
export const findVariables = (
  value: string,
  { includePath = true, includeEnv = true }: { includePath?: boolean; includeEnv?: boolean } = {},
) => {
  const variables = []

  if (includePath) {
    variables.push(...[...value.matchAll(REGEX.PATH)])
  }
  if (includeEnv) {
    variables.push(...[...value.matchAll(REGEX.VARIABLES)])
  }
  return variables.map((match) => match[1]?.trim())
}
