import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { unescapeJsonPointerSegment } from '@scalar/helpers/json/unescape-json-pointer-segment'
import { getRaw } from '@scalar/json-magic/magic-proxy'
import { anchor, createDocumentAnchors, heading, link, paragraph, text } from '@scalar/openapi-to-markdown/markdown'
import type { RootContent } from 'mdast'

import { object, own, resolve } from './document'
import { renderAuthoredSchemaExamples } from './render-schema'
import { createSchemaView, isPrimitiveSchema } from './schema-view'
import type { AsyncApiRenderOptions } from './types'

/** Index canonical model identities once, including aliases that resolve to the same schema. */
export const createSchemaRegistry = (
  document: Record<string, unknown>,
): {
  forPage: (
    options: AsyncApiRenderOptions,
    whole: boolean,
  ) => {
    reference: (input: unknown, depth: number) => RootContent[] | undefined
    root: (input: unknown, render: () => RootContent[]) => RootContent[]
    model: (input: unknown, render: () => RootContent[]) => RootContent[]
    appendix: (render: (input: unknown) => RootContent[]) => RootContent[]
  }
} => {
  const view = createSchemaView()
  const models = new Map<unknown, { name: string; ref: string; value: unknown }>()
  for (const [name, value] of Object.entries(object(own(document.components, 'schemas')))) {
    const identity = getRaw(resolve(value))
    if (!models.has(identity)) {
      models.set(identity, {
        name,
        value,
        ref: `#/components/schemas/${escapeJsonPointer(name)}`,
      })
    }
  }
  return {
    forPage: (options, whole) => {
      const entries = new Map(models)
      const lookup = (input: unknown): { name: string; ref: string; value: unknown } | undefined => {
        const identity = getRaw(resolve(input))
        const previous = entries.get(identity)
        if (previous) {
          return previous
        }
        if (input && typeof input === 'object' && '$ref' in input && typeof input.$ref === 'string') {
          const ref = input.$ref
          const name = unescapeJsonPointerSegment(ref.split('/').at(-1)!) || ref
          const entry = { name, ref, value: input }
          entries.set(identity, entry)
          return entry
        }
        return undefined
      }
      const anchors = createDocumentAnchors()
      const queued = new Set<unknown>()
      const shown = new Set<unknown>()
      const id = (entry: { name: string; ref: string }): string => anchors.get('model', entry.ref, entry.name)
      const model = (input: unknown, render: () => RootContent[]): RootContent[] => {
        const identity = getRaw(resolve(input))
        const entry = lookup(input)
        if (!entry) {
          return render()
        }
        if (shown.has(identity)) {
          return [paragraph(link(`#${id(entry)}`, entry.name)), ...renderAuthoredSchemaExamples(input)]
        }
        shown.add(identity)
        return [anchor(id(entry)), ...render()]
      }
      return {
        reference: (input, depth) => {
          const identity = getRaw(resolve(input))
          const entry = lookup(input)
          if (!entry || (!whole && depth === 0)) {
            return undefined
          }
          const schema = view(object(entry.value))
          const primitive = isPrimitiveSchema(schema)
          if (primitive && options.schemaReferences?.inlinePrimitives !== false) {
            return undefined
          }
          if (options.schemaReferences) {
            const url = options.schemaReferences.resolveUrl?.({ ref: entry.ref, name: entry.name })
            return [paragraph(url ? link(url, entry.name) : text(entry.name)), ...renderAuthoredSchemaExamples(input)]
          }
          queued.add(identity)
          return [paragraph(link(`#${id(entry)}`, entry.name)), ...renderAuthoredSchemaExamples(input)]
        },
        model,
        root: (input, render) => (whole ? render() : model(input, render)),
        appendix: (render) => {
          const blocks: RootContent[] = []
          if (options.schemaReferences) {
            return blocks
          }
          // Set iteration includes dependencies discovered while rendering earlier models.
          for (const identity of queued) {
            const entry = entries.get(identity)!
            if (!shown.has(identity)) {
              blocks.push(
                ...model(entry.value, () => [heading(2, text(`Schema: ${entry.name}`)), ...render(entry.value)]),
              )
            }
          }
          return blocks
        },
      }
    },
  }
}
