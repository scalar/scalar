import { REGEX } from './regex-helpers'

/**
 * Find all strings wrapped in {} or {{}} in value.
 */
export const findVariables = (value: string) =>
  [...value.matchAll(REGEX.PATH), ...value.matchAll(REGEX.VARIABLES)].map((match) => match[1]?.trim()) || []
