/**
 * Options for parsing YAML, shared by the sync and async normalizers so both read a document the same way.
 */
export const yamlParseOptions = { maxAliasCount: 10000, merge: true } as const

/**
 * Strip a leading UTF-8 BOM (U+FEFF). Editors on Windows often write this
 * prefix; {@link JSON.parse} rejects it as an unexpected token.
 */
const stripLeadingUtf8Bom = (value: string): string => (value.startsWith('﻿') ? value.slice(1) : value)

/**
 * The part of normalizing that needs no YAML parser.
 *
 * Returns the normalized value when the content is not a string or parses as JSON, or the text to hand
 * to a YAML parser when it only makes sense as YAML. Keeping this free of the `yaml` package is what lets
 * {@link normalizeAsync} load the parser on demand.
 */
export const normalizeWithoutYaml = (content: unknown): { value: unknown } | { yaml: string } => {
  if (content === null) {
    return { value: undefined }
  }

  if (typeof content !== 'string') {
    return { value: content }
  }

  const withoutBom = stripLeadingUtf8Bom(content)

  if (withoutBom.trim() === '') {
    return { value: undefined }
  }

  try {
    return { value: JSON.parse(withoutBom) }
  } catch {
    // Does it look like YAML?
    const hasColon = /^[^:]+:/.test(withoutBom)
    const trimmedStart = withoutBom.slice(0, 50).trimStart()
    const looksLikeJson = trimmedStart.startsWith('{') || trimmedStart.startsWith('[')

    if (!hasColon || looksLikeJson) {
      return { value: undefined }
    }

    return { yaml: withoutBom }
  }
}

/**
 * Normalize a string (YAML, JSON, object) to a JavaScript datatype, loading the YAML parser only when the
 * content is YAML.
 *
 * Behaves exactly like `normalize`. The difference is that the `yaml` package is not a static dependency,
 * so a bundle that only ever reads JSON never ships the parser.
 */
export const normalizeAsync = async (content: unknown): Promise<unknown> => {
  const result = normalizeWithoutYaml(content)

  if ('value' in result) {
    return result.value
  }

  const { parse } = await import('yaml')
  return parse(result.yaml, yamlParseOptions)
}
