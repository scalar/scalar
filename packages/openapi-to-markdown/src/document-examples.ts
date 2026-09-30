import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { Code } from 'mdast'

import type { createDocumentAnchors } from './document-anchors'
import { type ExampleSource, getMarkdownExamples } from './get-markdown-examples'

/** Generation and destinations are shared only within one whole-document export. */
export type DocumentExamples = {
  get: typeof getMarkdownExamples
  show: (source: ExampleSource, scope: string, code: Code) => { id: string; previous: boolean }
}

const bookkeeping = new Set(['$ref', '$ref-value', '$global', '$status', '__scalar_'])

/** Sibling constraints make a reference a different example source from its target. */
const identity = (source: ExampleSource): object | undefined => {
  if (!isObject(source.schema)) return undefined
  const schema = source.schema
  const target =
    '$ref' in schema && Object.keys(schema).every((key) => bookkeeping.has(key)) ? getResolvedRef(schema) : schema
  return isObject(target) ? target : schema
}

/** Reuse generation by schema and context; deduplicate only after comparing the serialized example. */
export const createDocumentExamples = (anchors: ReturnType<typeof createDocumentAnchors>): DocumentExamples => {
  const cache = new Map<object, Map<string, ReturnType<typeof getMarkdownExamples>>>()
  const shown = new WeakMap<object, Map<string, { id: string; value: string }>>()
  let cachedCount = 0
  let nextId = 0
  return {
    get: (...args) => {
      const [source, ...settings] = args
      const schema = identity(source)
      if (!schema || source.example !== undefined || Object.keys(source.examples ?? {}).length)
        return getMarkdownExamples(...args)
      const scope = JSON.stringify(settings)
      const previous = cache.get(schema)?.get(scope)
      if (previous) return previous
      // Large APIs must not retain every generated object until the export finishes.
      if (cachedCount >= 256) {
        cache.clear()
        cachedCount = 0
      }
      const entries = cache.get(schema) ?? new Map()
      const examples = getMarkdownExamples(...args)
      entries.set(scope, examples)
      cache.set(schema, entries)
      cachedCount++
      return examples
    },
    show: (source, scope, code) => {
      const schema = identity(source)
      const entries = schema ? (shown.get(schema) ?? new Map()) : new Map()
      const previous = entries.get(scope)
      if (previous?.value === code.value) return { id: previous.id, previous: true }
      const id = anchors.get('example', String(++nextId))
      entries.set(scope, { id, value: code.value })
      if (schema) shown.set(schema, entries)
      return { id, previous: false }
    },
  }
}
