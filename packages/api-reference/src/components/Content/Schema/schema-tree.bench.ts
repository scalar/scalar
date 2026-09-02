import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { bench, describe } from 'vitest'

import Schema from './Schema.vue'

/**
 * Baseline measurements for the schema tree, taken against the current renderer
 * so the Rail & Gutter work has something to compare against rather than a
 * recollection of how fast it used to feel.
 *
 * Every fixture mounts twice — once with the legacy renderer and once with
 * `schemaLayout: 'tree'` — so each group's summary prints the tree/legacy
 * ratio directly instead of leaving the comparison to a separate run.
 *
 * This half runs in jsdom, which performs no style recalculation, no layout and
 * no paint. So it measures the half that is real here — how long it takes to
 * build and mount the component tree, and how many rows that tree produces.
 * Anything that depends on the renderer (the hover rail highlight, the
 * `until-found` node budget) has to be measured through the Playwright harness
 * instead, and a number from this file must never be quoted as evidence about
 * either.
 */

/** A chain of nested objects, each level carrying two scalar leaves and one child object. */
const deepObject = (depth: number): Record<string, unknown> => {
  const leaf = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      count: { type: 'integer' },
    },
  }

  let current: Record<string, unknown> = leaf

  for (let index = 0; index < depth; index++) {
    current = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        count: { type: 'integer' },
        child: current,
      },
    }
  }

  return current
}

/** A single flat object carrying `count` scalar properties. */
const wideObject = (count: number): Record<string, unknown> => ({
  type: 'object',
  properties: Object.fromEntries(
    Array.from({ length: count }, (_, index) => [
      `property_${index}`,
      { type: 'string', description: `Property number ${index}` },
    ]),
  ),
})

/** One property whose enum carries `count` short values. */
const largeEnum = (count: number): Record<string, unknown> => ({
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: Array.from({ length: count }, (_, index) => `value_${index}`),
    },
  },
})

/** allOf and oneOf interleaved, the shape the composition partitioner works hardest on. */
const compositionHeavy = (): Record<string, unknown> => ({
  allOf: [
    wideObject(6),
    {
      oneOf: [
        { type: 'object', properties: { kind: { const: 'cat' } } },
        { type: 'object', properties: { kind: { const: 'dog' } } },
      ],
    },
    {
      anyOf: [wideObject(4), largeEnum(8)],
    },
  ],
})

const asSchema = (value: Record<string, unknown>): SchemaObject => coerceValue(SchemaObjectSchema, value)

const mountSchema = (schema: SchemaObject, options: Record<string, unknown> = {}) =>
  mount(Schema, {
    props: {
      name: 'Root',
      eventBus: null,
      options,
      schema,
    },
  })

/** The tree layout under measurement; mountSchema defaults to legacy. */
const TREE = { schemaLayout: 'tree' }

describe('schema-tree', () => {
  describe('schema tree mount', () => {
    const deep = asSchema(deepObject(5))
    const wide = asSchema(wideObject(60))
    const enums = asSchema(largeEnum(40))
    const composed = asSchema(compositionHeavy())

    bench('depth 5, collapsed', () => {
      mountSchema(deep).unmount()
    })

    bench('depth 5, collapsed (tree)', () => {
      mountSchema(deep, TREE).unmount()
    })

    bench('60 flat properties', () => {
      mountSchema(wide).unmount()
    })

    bench('60 flat properties (tree)', () => {
      mountSchema(wide, TREE).unmount()
    })

    bench('40-value enum', () => {
      mountSchema(enums).unmount()
    })

    bench('40-value enum (tree)', () => {
      mountSchema(enums, TREE).unmount()
    })

    bench('allOf over oneOf over anyOf', () => {
      mountSchema(composed).unmount()
    })

    bench('allOf over oneOf over anyOf (tree)', () => {
      mountSchema(composed, TREE).unmount()
    })
  })

  describe('schema tree expand-all', () => {
    const deep = asSchema(deepObject(5))

    /**
     * `expandAllSchemaProperties` is read once at mount, so today this is the only
     * way to price expanding a whole tree. Phase 1 moves expansion into a store and
     * makes it a runtime action; when it does, the runtime `expandAll()` belongs
     * beside this so the two can be compared directly rather than in the abstract.
     */
    bench('depth 5, expanded at mount', () => {
      mountSchema(deep, { expandAllSchemaProperties: true }).unmount()
    })

    bench('depth 5, expanded at mount (tree)', () => {
      mountSchema(deep, { ...TREE, expandAllSchemaProperties: true }).unmount()
    })

    bench('depth 5, collapsed at mount', () => {
      mountSchema(deep, { expandAllSchemaProperties: false }).unmount()
    })

    bench('depth 5, collapsed at mount (tree)', () => {
      mountSchema(deep, { ...TREE, expandAllSchemaProperties: false }).unmount()
    })
  })

  describe('schema tree dom weight', () => {
    const deep = asSchema(deepObject(5))
    const wide = asSchema(wideObject(60))

    /**
     * Rendered row count is the number Phase 2 is most likely to regress, because
     * the `until-found` mount policy keeps opened-then-closed subtrees in the DOM
     * rather than unmounting them. Counting rows here, on top of the mount, keeps
     * the two moving together: if a change renders many more rows, this gets
     * slower even though the query itself is cheap.
     */
    bench('count rendered rows, depth 5 collapsed', () => {
      const wrapper = mountSchema(deep)
      wrapper.element.querySelectorAll('.property').length
      wrapper.unmount()
    })

    bench('count rendered rows, depth 5 collapsed (tree)', () => {
      const wrapper = mountSchema(deep, TREE)
      wrapper.element.querySelectorAll('.property').length
      wrapper.unmount()
    })

    bench('count rendered rows, 60 flat properties', () => {
      const wrapper = mountSchema(wide)
      wrapper.element.querySelectorAll('.property').length
      wrapper.unmount()
    })

    bench('count rendered rows, 60 flat properties (tree)', () => {
      const wrapper = mountSchema(wide, TREE)
      wrapper.element.querySelectorAll('.property').length
      wrapper.unmount()
    })
  })
})
