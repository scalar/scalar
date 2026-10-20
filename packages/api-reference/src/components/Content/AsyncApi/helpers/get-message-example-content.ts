import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { prettyPrintJson } from '@scalar/helpers/json/pretty-print-json'
import { isObject } from '@scalar/helpers/object/is-object'

/** Keep the displayed sample, language, and clipboard representation together. */
type MessageExampleContent = {
  content: string
  lang: 'json' | 'xml' | 'yaml' | 'plaintext'
  structural: boolean
}

/** Format payload values without interpreting non-JSON text as JSON or inventing wire encodings. */
export const getMessageExampleContent = (value: unknown, contentType?: string): MessageExampleContent | undefined => {
  if (value === undefined) {
    return undefined
  }
  const json = contentType === undefined || isJsonMediaType(contentType)
  const structured = Array.isArray(value) || isObject(value)
  const structural = !json && structured
  const { subtype } = parseMimeType(contentType)
  const lang =
    json || structural
      ? 'json'
      : isXmlMediaType(contentType)
        ? 'xml'
        : subtype === 'yaml' || subtype === 'x-yaml' || subtype.endsWith('+yaml')
          ? 'yaml'
          : 'plaintext'

  if (value === null || typeof value === 'boolean') {
    return { content: String(value), lang, structural }
  }
  if (typeof value === 'string') {
    return { content: json ? prettyPrintJson(value) : value, lang, structural }
  }
  if (typeof value === 'number' || Array.isArray(value) || isObject(value)) {
    return { content: prettyPrintJson(value), lang, structural }
  }
  return undefined
}
