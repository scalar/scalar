import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

import Schema from '@/components/Content/Schema/Schema.vue'
import type { SchemaOptions } from '@/components/Content/Schema/types'

import { serializeSchemaRendering } from './serialize'

/**
 * A single rendering case.
 *
 * Everything except `schema` is optional, so the cheapest possible fixture is a
 * file containing nothing but a schema.
 */
type Fixture = {
  /** Human readable label for the case, shown at the top of the snapshot. */
  title?: string
  /** Why this case exists, or what is interesting about it. */
  notes?: string
  /**
   * Documents rendering we believe is wrong but currently ship.
   *
   * Recorded in the snapshot so a baseline never quietly blesses a bug.
   */
  knownIssue?: string
  /** Overrides for the schema component options, e.g. `hideReadOnly`. */
  options?: SchemaOptions
  /** The name the schema renders under. */
  name?: string
  /** The schema under test. */
  schema: unknown
}

/**
 * Fixtures are loaded through Vite rather than `node:fs`: the jsdom test
 * environment resolves with browser conditions, where node builtins are
 * externalized.
 */
const fixtures = import.meta.glob('./fixtures/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Default options. Everything is expanded so a snapshot captures the whole tree, not the collapsed state. */
const DEFAULT_OPTIONS: SchemaOptions = { expandAllSchemaProperties: true }

/** Turns `./fixtures/all-of-override.yaml` into `all-of-override`. */
const getCaseName = (path: string): string => path.replace(/^.*\//, '').replace(/\.yaml$/, '')

/** Prefixes each line with a comment marker, leaving blank lines free of trailing whitespace. */
const toCommentLines = (value: string, prefix = ''): string[] =>
  value
    .trim()
    .split('\n')
    .map((line) => (line ? `# ${prefix}${line}` : '#'))

/** Builds the comment header that precedes every snapshot body. */
const buildHeader = (name: string, fixture: Fixture): string => {
  const lines = [`# ${fixture.title ?? name}`]

  if (fixture.notes) {
    lines.push(...toCommentLines(fixture.notes))
  }

  if (fixture.knownIssue) {
    lines.push(...toCommentLines(fixture.knownIssue, 'KNOWN ISSUE: '))
  }

  return lines.join('\n')
}

const cases = Object.entries(fixtures)
  .map(([path, source]) => ({ name: getCaseName(path), fixture: parse(source) as Fixture }))
  .sort((a, b) => a.name.localeCompare(b.name))

describe('schema-snapshots', () => {
  it('finds fixtures to render', () => {
    expect(cases.length).toBeGreaterThan(0)
  })

  it.each(cases)('$name', async ({ name, fixture }) => {
    const wrapper = mount(Schema, {
      props: {
        name: fixture.name ?? name,
        eventBus: null,
        noncollapsible: true,
        options: { ...DEFAULT_OPTIONS, ...fixture.options },
        schema: coerceValue(SchemaObjectSchema, fixture.schema),
      },
    })

    const snapshot = `${buildHeader(name, fixture)}\n\n${serializeSchemaRendering(wrapper.html())}\n`

    await expect(snapshot).toMatchFileSnapshot(`./__snapshots__/${name}.snap.txt`)
  })
})
