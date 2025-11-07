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
): string[] =>
  [includePath && REGEX.PATH, includeEnv && REGEX.VARIABLES].flatMap((regex) =>
    regex
      ? [...value.matchAll(regex)]
          .map((match) => match[1]?.trim())
          .filter((variable): variable is string => variable !== undefined)
      : [],
  )
