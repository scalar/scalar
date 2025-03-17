import { isValidUrl } from '@scalar/oas-utils/helpers'

/** Checks whether the given string is an URL */
export function isUrl(input: string | null) {
  if (!input) {
    return false
  }
  if (!(input.startsWith('http://') || input.startsWith('https://'))) {
    return false
  }

  return isValidUrl(input)
}
