/**
 * TEMPORARY measurement harness for the schema renderer. Untracked on purpose;
 * never commit this file.
 *
 * Mounts a set of fixtures in both layouts (legacy and tree), times N
 * mount+unmount cycles, counts DOM nodes and component instances, and hashes
 * the rendered HTML so a code change can prove it left the DOM alone.
 *
 * Results are written as JSON with node:fs (vitest intercepts console output).
 *
 * Environment:
 *   PERF_FIXTURES  comma list of fixture names (default: all)
 *   PERF_LAYOUTS   comma list of layouts (default: legacy,tree)
 *   PERF_ITER      timed iterations per fixture x layout (default: 40)
 *   PERF_OUT       absolute path of the JSON file to write
 */
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterAll, describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import type { VNode } from 'vue'

import Schema from './Schema.vue'

/*
 * Vitest 4 transforms this file through Vite's client environment, which
 * externalizes `node:*` imports (they resolve to a bare `node:` id at runtime).
 * `process.getBuiltinModule` (Node 22.3+) hands back the builtin directly,
 * without going through the module graph.
 */
const getBuiltin = <T>(name: string): T =>
  (process as unknown as { getBuiltinModule: (id: string) => T }).getBuiltinModule(name)

const { execSync } = getBuiltin<typeof import('node:child_process')>('node:child_process')
const { mkdirSync, writeFileSync } = getBuiltin<typeof import('node:fs')>('node:fs')
const { dirname } = getBuiltin<typeof import('node:path')>('node:path')

// ---------------------------------------------------------------------------
// Fixture builders (copied from schema-tree.bench.ts so the numbers line up)
// ---------------------------------------------------------------------------

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

/**
 * A realistic object: 30 properties mixing markdown descriptions, $ref
 * models, arrays of $ref models, enums, nullable unions and bounded integers.
 * Fully deterministic.
 */
const realisticObject = (): Record<string, unknown> => {
  const properties: Record<string, unknown> = {}

  // 12 strings with a two-sentence description carrying a code span and a bold run
  for (let index = 0; index < 12; index++) {
    properties[`text_field_${index}`] = {
      type: 'string',
      description: `The \`text_field_${index}\` value is stored **verbatim** and echoed back on read. It is trimmed of surrounding whitespace before validation runs.`,
    }
  }

  // 6 $ref object properties with 10 scalar string properties each
  for (let index = 0; index < 6; index++) {
    const modelProperties: Record<string, unknown> = {}
    for (let field = 0; field < 10; field++) {
      modelProperties[`model_${index}_field_${field}`] =
        field < 3
          ? { type: 'string', description: `Field ${field} of model ${index}.` }
          : { type: 'string' }
    }
    properties[`model_${index}`] = {
      $ref: `#/components/schemas/Model${index}`,
      '$ref-value': {
        type: 'object',
        title: `Model${index}`,
        description: 'A model.',
        properties: modelProperties,
        required: [`model_${index}_field_0`, `model_${index}_field_1`],
      },
    }
  }

  // 4 arrays of $ref objects with 8 scalar properties each
  for (let index = 0; index < 4; index++) {
    const itemProperties: Record<string, unknown> = {}
    for (let field = 0; field < 8; field++) {
      itemProperties[`item_${index}_field_${field}`] = { type: 'string' }
    }
    properties[`items_${index}`] = {
      type: 'array',
      items: {
        $ref: `#/components/schemas/Item${index}`,
        '$ref-value': {
          type: 'object',
          title: `Item${index}`,
          properties: itemProperties,
        },
      },
    }
  }

  // 3 enums of 5 values, one with x-enum-varnames
  for (let index = 0; index < 3; index++) {
    const values = Array.from({ length: 5 }, (_, value) => `enum_${index}_value_${value}`)
    properties[`enum_${index}`] = {
      type: 'string',
      enum: values,
      ...(index === 0 ? { 'x-enum-varnames': values.map((value) => value.toUpperCase()) } : {}),
    }
  }

  // 2 nullable unions with a format
  properties.nullable_date = { type: ['string', 'null'], format: 'date-time' }
  properties.nullable_email = { type: ['string', 'null'], format: 'email' }

  // 3 bounded integers with default and example
  for (let index = 0; index < 3; index++) {
    properties[`count_${index}`] = {
      type: 'integer',
      minimum: 0,
      maximum: 100 * (index + 1),
      default: index,
      example: index + 1,
    }
  }

  return {
    type: 'object',
    properties,
    required: [
      'text_field_0',
      'text_field_1',
      'model_0',
      'model_1',
      'items_0',
      'enum_0',
      'nullable_date',
      'count_0',
    ],
  }
}

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

// ---------------------------------------------------------------------------
// Fixture table
// ---------------------------------------------------------------------------

type Fixture = {
  name: string
  build: () => Record<string, unknown>
  options: Record<string, unknown>
  /** Wrap in Vue's reactive() (the real app's condition) */
  reactive: boolean
}

const FIXTURES: Fixture[] = [
  { name: 'deep5', build: () => deepObject(5), options: {}, reactive: true },
  { name: 'deep5-expanded', build: () => deepObject(5), options: { expandAllSchemaProperties: true }, reactive: true },
  { name: 'wide60', build: () => wideObject(60), options: {}, reactive: true },
  { name: 'enum40', build: () => largeEnum(40), options: {}, reactive: true },
  { name: 'composed', build: compositionHeavy, options: {}, reactive: true },
  { name: 'realistic', build: realisticObject, options: {}, reactive: true },
  {
    name: 'realistic-expanded',
    build: realisticObject,
    options: { expandAllSchemaProperties: true },
    reactive: true,
  },
  { name: 'realistic-plain', build: realisticObject, options: {}, reactive: false },
  { name: 'wide60-plain', build: () => wideObject(60), options: {}, reactive: false },
]

const LAYOUT_OPTIONS: Record<string, Record<string, unknown>> = {
  legacy: {},
  tree: { schemaLayout: 'tree' },
}

const parseList = (value: string | undefined, fallback: string[]): string[] =>
  value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : fallback

const SELECTED_FIXTURES = parseList(
  process.env.PERF_FIXTURES,
  FIXTURES.map((fixture) => fixture.name),
)
const SELECTED_LAYOUTS = parseList(process.env.PERF_LAYOUTS, ['legacy', 'tree'])
const ITERATIONS = Number(process.env.PERF_ITER ?? 40)
const WARMUP = 5
const OUT_PATH =
  process.env.PERF_OUT ??
  '/private/tmp/claude-501/-Users-cameron-Documents-Scalar-scalar--claude-worktrees-monitor-another-agent-794a52/6640058f-69f4-44b2-8e4d-8464ea7e3011/scratchpad/perf/results/last.json'

// ---------------------------------------------------------------------------
// Measurement helpers
// ---------------------------------------------------------------------------

/** 32-bit FNV-1a over a string, returned as 8 hex digits */
const fnv1a = (input: string): string => {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index)
    // Multiply by the FNV prime (16777619) with 32-bit overflow
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

const quantile = (sorted: number[], fraction: number): number => {
  if (sorted.length === 0) {
    return Number.NaN
  }
  const position = (sorted.length - 1) * fraction
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) {
    return sorted[lower]!
  }
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower)
}

type ComponentCensus = { total: number; histogram: Record<string, number> }

const componentName = (type: unknown): string => {
  if (typeof type === 'function') {
    return (type as { name?: string }).name || 'AnonymousFunctional'
  }
  if (type && typeof type === 'object') {
    const named = type as { __name?: string; name?: string }
    return named.__name ?? named.name ?? 'Anonymous'
  }
  return 'Unknown'
}

/** Walk a vnode tree, counting every mounted component instance by name */
const countComponents = (root: VNode | null | undefined): ComponentCensus => {
  const histogram: Record<string, number> = {}
  let total = 0

  const visit = (vnode: VNode | null | undefined): void => {
    if (!vnode || typeof vnode !== 'object') {
      return
    }

    if (vnode.component) {
      total += 1
      const name = componentName(vnode.component.type)
      histogram[name] = (histogram[name] ?? 0) + 1
      visit(vnode.component.subTree)
      return
    }

    if (vnode.suspense) {
      visit(vnode.suspense.activeBranch)
      return
    }

    if (Array.isArray(vnode.children)) {
      for (const child of vnode.children) {
        visit(child as VNode)
      }
    }
  }

  visit(root)

  const sorted = Object.fromEntries(Object.entries(histogram).sort(([a], [b]) => a.localeCompare(b)))
  return { total, histogram: sorted }
}

type ResultRow = {
  fixture: string
  layout: string
  reactive: boolean
  iterations: number
  warmup: number
  median: number
  p25: number
  p75: number
  min: number
  mean: number
  nodes: number
  rows: number
  components: number
  histogram: Record<string, number>
  hash: string
  htmlLength: number
}

const results: ResultRow[] = []

const gitHead = (): string => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: __dirname, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

const HEAD = gitHead()

const writeResults = (): void => {
  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(
    OUT_PATH,
    JSON.stringify(
      {
        meta: {
          head: HEAD,
          timestamp: new Date().toISOString(),
          node: process.version,
          iterations: ITERATIONS,
          warmup: WARMUP,
          fixtures: SELECTED_FIXTURES,
          layouts: SELECTED_LAYOUTS,
        },
        results,
      },
      null,
      2,
    ),
  )
}

type LayoutRun = {
  layout: string
  schema: SchemaObject
  options: Record<string, unknown>
  html: string
  hash: string
  nodes: number
  rows: number
  census: ComponentCensus
  samples: number[]
}

/**
 * Measure one fixture in every selected layout, INTERLEAVED: each timed round
 * mounts every layout once, so a CPU burst from elsewhere on the machine hits
 * all layouts alike and the tree/legacy ratio within a run stays honest even
 * when the absolute numbers drift between runs.
 */
const measureFixture = (fixture: Fixture, layouts: string[]): ResultRow[] => {
  const runs: LayoutRun[] = layouts.map((layout) => {
    // A separate schema object per layout, so nothing reactive is shared between them
    const raw = asSchema(fixture.build())
    const schema = fixture.reactive ? reactive(raw) : raw
    const options = { ...LAYOUT_OPTIONS[layout], ...fixture.options }

    // Structural facts from a first mount; a later mount must hash the same
    const probe = mountSchema(schema, options)
    const html = probe.html({ raw: true })
    const hash = fnv1a(html)
    const nodes = probe.element.querySelectorAll('*').length
    const rows = probe.element.querySelectorAll('.property').length
    const census = countComponents(probe.vm.$.subTree)
    probe.unmount()

    return { layout, schema, options, html, hash, nodes, rows, census, samples: [] }
  })

  for (let index = 0; index < WARMUP; index++) {
    for (const run of runs) {
      mountSchema(run.schema, run.options).unmount()
    }
  }

  for (let index = 0; index < ITERATIONS; index++) {
    for (const run of runs) {
      const start = performance.now()
      const wrapper = mountSchema(run.schema, run.options)
      wrapper.unmount()
      run.samples.push(performance.now() - start)
    }
  }

  return runs.map((run): ResultRow => {
    // The hash must be stable across separate mounts, or it is useless as a DOM guard
    const verify = mountSchema(run.schema, run.options)
    const verifyHash = fnv1a(verify.html({ raw: true }))
    verify.unmount()
    expect(verifyHash, `${fixture.name}/${run.layout}: DOM hash is not stable across mounts`).toBe(run.hash)

    const sorted = [...run.samples].sort((a, b) => a - b)

    return {
      fixture: fixture.name,
      layout: run.layout,
      reactive: fixture.reactive,
      iterations: ITERATIONS,
      warmup: WARMUP,
      median: quantile(sorted, 0.5),
      p25: quantile(sorted, 0.25),
      p75: quantile(sorted, 0.75),
      min: sorted[0]!,
      mean: run.samples.reduce((sum, value) => sum + value, 0) / run.samples.length,
      nodes: run.nodes,
      rows: run.rows,
      components: run.census.total,
      histogram: run.census.histogram,
      hash: run.hash,
      htmlLength: run.html.length,
    }
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('schema-perf-harness', () => {
  it('coerceValue keeps $ref-value so nested models render in both layouts', () => {
    const schema = reactive(asSchema(realisticObject()))

    for (const layout of ['legacy', 'tree']) {
      const wrapper = mountSchema(schema, {
        ...LAYOUT_OPTIONS[layout],
        expandAllSchemaProperties: true,
      })
      // Property names render with <wbr> at underscores, so compare text, not HTML
      const text = wrapper.text()
      wrapper.unmount()

      expect(text, `${layout}: nested model property missing`).toContain('model_3_field_7')
      expect(text, `${layout}: nested array item property missing`).toContain('item_2_field_5')
    }
  })

  it.each(SELECTED_FIXTURES.map((fixtureName) => ({ fixtureName })))(
    'measures $fixtureName in every selected layout (interleaved)',
    ({ fixtureName }) => {
      const fixture = FIXTURES.find((entry) => entry.name === fixtureName)
      expect(fixture, `unknown fixture ${fixtureName}`).toBeDefined()
      for (const layout of SELECTED_LAYOUTS) {
        expect(LAYOUT_OPTIONS[layout], `unknown layout ${layout}`).toBeDefined()
      }

      const rows = measureFixture(fixture!, SELECTED_LAYOUTS)
      results.push(...rows)
      writeResults()

      for (const row of rows) {
        expect(row.nodes).toBeGreaterThan(0)
        expect(row.components).toBeGreaterThan(0)
      }
    },
    600_000,
  )

  afterAll(() => {
    writeResults()
  })
})
