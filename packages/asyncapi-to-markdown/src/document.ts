import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

import type { AsyncApiRenderOptions, AsyncApiSelector } from './types'

/** Follow workspace reference wrappers without treating reference siblings as overrides. */
export const resolve = (value: unknown): unknown => {
  const seen = new Set<unknown>()
  const follow = (input: unknown): unknown => {
    if (!isObject(input) || typeof input.$ref !== 'string') {
      return input
    }
    if (seen.has(input)) {
      throw new Error(`Circular reference alias: ${input.$ref}`)
    }
    seen.add(input)
    const target = getResolvedRef(input)
    if (target === undefined || target === input) {
      throw new Error(`Unresolved reference: ${input.$ref}`)
    }
    return follow(target)
  }
  return follow(value)
}

/** Read an optional object while keeping malformed optional fields out of the renderer. */
export const object = (value: unknown): Record<string, unknown> => {
  const resolved = resolve(value)
  return isObject(resolved) ? resolved : {}
}

/** Preserve map keys such as __proto__ without looking up inherited properties. */
export const own = (value: unknown, key: string): unknown => {
  const record = object(value)
  return Object.hasOwn(record, key) ? record[key] : undefined
}

/** Scalar metadata is optional; never serialize objects into headings or descriptions. */
export const string = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

/** A normalized selection with an exact location in the prepared document. */
type Selection = { kind: 'channel' | 'operation' | 'message' | 'model'; name: string; value: unknown }

const locations = {
  channel: ['channels'],
  operation: ['operations'],
  message: ['components', 'messages'],
  model: ['components', 'schemas'],
} as const

/** Reject combined or missing selections before writing any Markdown. */
export const select = (
  document: Record<string, unknown>,
  options: AsyncApiRenderOptions,
): Selection | { kind: 'tag'; name: string } | 'introduction' | undefined => {
  const keys = Object.keys(options).filter(
    (key) => key !== 'schemaReferences' && options[key as keyof AsyncApiRenderOptions] !== undefined,
  )
  if (
    keys.length > 1 ||
    keys.some((key) => key !== 'introduction' && key !== 'tag' && !Object.hasOwn(locations, key))
  ) {
    throw new Error('Choose exactly one AsyncAPI page selector')
  }
  const key = keys[0]
  if (!key) {
    return undefined
  }
  if (key === 'introduction') {
    if (options.introduction !== true) {
      throw new Error('The introduction selector must be true')
    }
    return 'introduction'
  }
  if (key === 'tag') {
    if (typeof options.tag !== 'string' || !options.tag) {
      throw new Error('Invalid tag selector')
    }
    return { kind: 'tag', name: options.tag }
  }
  const kind = key as Selection['kind']
  const selector = options[kind] as AsyncApiSelector
  if (isObject(selector) && typeof selector.pointer === 'string' && /~(?![01])/.test(selector.pointer)) {
    throw new Error(`Invalid JSON pointer escape in ${selector.pointer}`)
  }
  const segments =
    typeof selector === 'string'
      ? [...locations[kind], selector]
      : isObject(selector) && typeof selector.pointer === 'string' && /^#?\//.test(selector.pointer)
        ? parseJsonPointerSegments(selector.pointer.replace(/^#/, ''))
        : []
  const expected = locations[kind]
  const matches = segments.length === expected.length + 1 && expected.every((part, index) => segments[index] === part)
  const channelMessage =
    kind === 'message' && segments.length === 4 && segments[0] === 'channels' && segments[2] === 'messages'
  if (!matches && !channelMessage) {
    throw new Error(`Invalid ${kind} selector`)
  }
  const value = segments.reduce<unknown>((current, segment) => own(current, segment), document)
  if (value === undefined) {
    throw new Error(`Unknown ${kind}: ${segments.join('/')}`)
  }
  return { kind, name: segments.at(-1)!, value }
}
