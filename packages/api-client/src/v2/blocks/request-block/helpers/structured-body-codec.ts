import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

/** Parse/serialize pair for a structured (form-editable) body content type. */
export type StructuredBodyCodec = {
  /** Language for the raw code editor, doubles as the codec family id */
  language: 'json' | 'yaml'
  parse: (text: string) => unknown
  stringify: (value: unknown) => string
}

const jsonCodec: StructuredBodyCodec = {
  language: 'json',
  parse: (text) => JSON.parse(text),
  stringify: (value) => JSON.stringify(value, null, 2),
}

const yamlCodec: StructuredBodyCodec = {
  language: 'yaml',
  parse: (text) => parseYaml(text),
  stringify: (value) => stringifyYaml(value),
}

const YAML_ESSENCES = new Set(['application/yaml', 'application/x-yaml', 'text/yaml', 'text/x-yaml'])

/**
 * Return the codec for content types whose body is a structured document we can edit as
 * a form (JSON and YAML families, including `+json` / `+yaml` vendor suffixes), or
 * `undefined` for everything else (multipart and urlencoded keep their own form editor).
 */
export const getStructuredBodyCodec = (contentType: string): StructuredBodyCodec | undefined => {
  const essence = parseMimeType(contentType).essence

  if (essence === 'application/json' || essence.endsWith('+json')) {
    return jsonCodec
  }
  if (YAML_ESSENCES.has(essence) || essence.endsWith('+yaml')) {
    return yamlCodec
  }
  return undefined
}
