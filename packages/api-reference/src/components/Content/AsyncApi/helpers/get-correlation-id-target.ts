import { isTypeObject, optimizeValueForDisplay } from '@scalar/blocks/schema/helpers'
import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

import { unwrapAsyncApiSchema } from '@/helpers/get-async-api-message-payload-schema'

/** The rendered schema section and property path identified by a runtime expression. */
type CorrelationIdTarget = {
  section: 'headers' | 'payload'
  path: string[]
}

/** Locate message data in its schema without interpreting the expression as a schema pointer. */
export const getCorrelationIdTarget = (
  message: AsyncApiMessageObject,
  location: string,
): CorrelationIdTarget | undefined => {
  const match = /^\$message\.(header|payload)(?:#(.*))?$/.exec(location)
  if (!match) {
    return undefined
  }
  const section = match[1] === 'header' ? 'headers' : 'payload'
  const source = getResolvedRef(message[section])
  if (isObject(source) && 'schemaFormat' in source) {
    const mediaType = String(source.schemaFormat).split(';')[0]?.trim().toLowerCase()
    if (
      ![
        'application/schema+json',
        'application/schema+yaml',
        'application/vnd.aai.asyncapi+json',
        'application/vnd.aai.asyncapi+yaml',
      ].includes(mediaType ?? '')
    ) {
      return undefined
    }
  }
  const schema = unwrapAsyncApiSchema(source)
  if (!schema) {
    return undefined
  }
  try {
    // A URI fragment is decoded before splitting; literal percent sequences in keys stay intact.
    const pointer = decodeURIComponent(match[2] ?? '')
    if (pointer !== '' && !pointer.startsWith('/')) {
      return undefined
    }
    if (/~(?:[^01]|$)/.test(pointer)) {
      return undefined
    }
    const path = pointer === '' ? [] : pointer.slice(1).split('/').map(unescapeJsonPointerSegment)
    // Public anchors use dots as separators, and empty property names do not render an anchor.
    if (path.some((segment) => !segment || segment.includes('.'))) {
      return undefined
    }
    const ancestors = new Set<unknown>()
    const target = path.reduce<unknown>((node, name, index) => {
      const source = unwrapAsyncApiSchema(node)
      if (!source || ancestors.has(source)) {
        return undefined
      }
      ancestors.add(source)
      // Use the renderer's normalization so single branches and nullable fields share their anchors.
      const resolved = optimizeValueForDisplay(source)
      if (!isTypeObject(resolved) || !resolved.properties) {
        return undefined
      }
      const remaining = path.slice(index).join('.')
      // A literal dotted sibling can share this public anchor with a nested field.
      const collision = Object.keys(resolved.properties).some(
        (key) => key.includes('.') && (remaining === key || remaining.startsWith(`${key}.`)),
      )
      return !collision && Object.hasOwn(resolved.properties, name) ? resolved.properties[name] : undefined
    }, schema)
    return isObject(getResolvedRef(target)) ? { section, path } : undefined
  } catch {
    // Invalid URI escapes are authored content, not a rendering failure.
    return undefined
  }
}
