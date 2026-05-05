import { parse } from 'yaml'

/**
 * Strip a leading UTF-8 BOM (U+FEFF). Editors on Windows often write this
 * prefix; {@link JSON.parse} rejects it as an unexpected token.
 */
const stripLeadingUtf8Bom = (value: string): string => (value.startsWith('\uFEFF') ? value.slice(1) : value)

/**
 * Normalize a string (YAML, JSON, object) to a JavaScript datatype.
 */
export function normalize(content: unknown): unknown {
  if (content === null) {
    return undefined
  }

  if (typeof content === 'string') {
    const withoutBom = stripLeadingUtf8Bom(content)

    if (withoutBom.trim() === '') {
      return undefined
    }

    try {
      return JSON.parse(withoutBom)
    } catch {
      // Does it look like YAML?
      const hasColon = /^[^:]+:/.test(withoutBom)
      const trimmedStart = withoutBom.slice(0, 50).trimStart()
      const looksLikeJson = trimmedStart.startsWith('{') || trimmedStart.startsWith('[')

      if (!hasColon || looksLikeJson) {
        return undefined
      }

      return parse(withoutBom, {
        maxAliasCount: 10000,
        merge: true,
      })
    }
  }

  return content
}
