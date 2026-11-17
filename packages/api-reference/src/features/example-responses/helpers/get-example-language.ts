import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import { getStreamFormat } from '@scalar/helpers/http/is-streaming-content-type'
import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { parseMimeType } from '@scalar/helpers/http/mime-type'

/** Select a supported grammar without treating arbitrary response text as JSON. */
export const getExampleLanguage = (contentType: string): 'json' | 'xml' | 'yaml' | 'html' | 'plaintext' => {
  const streamFormat = getStreamFormat(contentType)
  if (isJsonMediaType(contentType) || streamFormat === 'json-lines' || streamFormat === 'json-seq') {
    return 'json'
  }
  if (isXmlMediaType(contentType)) {
    return 'xml'
  }
  const { subtype } = parseMimeType(contentType)
  if (subtype === 'yaml' || subtype === 'x-yaml' || subtype.endsWith('+yaml')) {
    return 'yaml'
  }
  return subtype === 'html' ? 'html' : 'plaintext'
}
