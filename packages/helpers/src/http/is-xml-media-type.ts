import { parseMimeType } from './mime-type'

/** Recognize XML media types, including structured suffixes and content-type parameters. */
export const isXmlMediaType = (contentType: string | undefined): boolean => {
  const { subtype } = parseMimeType(contentType)
  return subtype === 'xml' || subtype.endsWith('+xml')
}
