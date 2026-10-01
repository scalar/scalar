import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'

import { encodeChunkName } from '@/helpers/encode-chunk-name'

/** Model pages use singleton chunks instead of the groups consumed by channel pages. */
export const asyncApiModelChunkReference = (reference: string, name: string): string => {
  const section = '/asyncapi/components-schemas/'
  const index = reference.indexOf(section)
  if (index === -1) return reference
  const file = reference.slice(index).includes('.json#')
  return `${reference.slice(0, index)}/asyncapi/models/${file ? encodeChunkName(name) : encodeURIComponent(escapeJsonPointer(name))}${file ? '.json#' : '#'}`
}
