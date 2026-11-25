import type { ParsedMimeType } from '@scalar/helpers/http/mime-type'

/** Match JSON request media types after normalizing the type and subtype. */
export const isJsonContentType = ({ essence, subtype }: ParsedMimeType): boolean =>
  essence === 'application/json' || subtype.endsWith('+json')
