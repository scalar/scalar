import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildReleaseNotesJsonSchema, writeReleaseNotesJsonSchema } from './write-release-notes-schema'

describe('buildReleaseNotesJsonSchema', () => {
  it('describes the file root as an array of release notes', () => {
    const schema = buildReleaseNotesJsonSchema()
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(schema.title).toBe('Scalar release notes')
    expect(schema.type).toBe('array')
  })

  it('requires version, date, and title on every entry', () => {
    const schema = buildReleaseNotesJsonSchema() as { items: { required: string[] } }
    expect(schema.items.required).toEqual(expect.arrayContaining(['version', 'date', 'title']))
  })

  it('exposes every content block type through a discriminated union', () => {
    const schema = buildReleaseNotesJsonSchema() as {
      items: {
        properties: {
          content: {
            items: { oneOf: Array<{ properties: { type: { const: string } } }> }
          }
        }
      }
    }
    const blockTypes = schema.items.properties.content.items.oneOf.map((entry) => entry.properties.type.const)
    expect(blockTypes).toEqual(['paragraph', 'heading', 'list', 'image', 'video', 'href'])
  })
})

describe('writeReleaseNotesJsonSchema', () => {
  it('writes the generated schema to disk on first run', async () => {
    const workDir = await mkdtemp(join(tmpdir(), 'release-notes-schema-'))
    const path = join(workDir, 'RELEASE_NOTES.schema.json')

    const result = await writeReleaseNotesJsonSchema({ path })
    expect(result.changed).toBe(true)

    const written = JSON.parse(await readFile(path, 'utf-8'))
    expect(written.title).toBe('Scalar release notes')
  })

  it('skips writing when the on-disk schema already matches', async () => {
    const workDir = await mkdtemp(join(tmpdir(), 'release-notes-schema-'))
    const path = join(workDir, 'RELEASE_NOTES.schema.json')

    await writeReleaseNotesJsonSchema({ path })
    const second = await writeReleaseNotesJsonSchema({ path })
    expect(second.changed).toBe(false)
  })
})
