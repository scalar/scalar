import { parseJsonOrYaml } from '@scalar/oas-utils/helpers'

/** Normalize content into a JS object or return null if it is falsey */
export const normalizeContent = (
  content: string | Record<string, unknown> | (() => string | Record<string, unknown>) | undefined | null,
): Record<string, unknown> | undefined => {
  if (!content) {
    return undefined
  }

  if (typeof content === 'function') {
    return normalizeContent(content())
  }

  if (typeof content === 'string') {
    return parseJsonOrYaml(content)
  }

  return content || undefined
}
