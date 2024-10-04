import { isUrl } from './isUrl'

/** Checks whether the given string could be an OpenAPI document */
export function isDocument(input: string | null) {
  return input && !isUrl(input)
}
