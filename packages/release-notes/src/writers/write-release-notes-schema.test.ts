import { describe, expect, it } from 'vitest'

import { DEFAULT_RELEASE_NOTES_SCHEMA_ID, buildReleaseNotesJsonSchema } from './write-release-notes-schema'

describe('write-release-notes-schema', () => {
  it('builds a draft 2020-12 array schema with the default id', () => {
    const schema = buildReleaseNotesJsonSchema()

    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(schema.$id).toBe(DEFAULT_RELEASE_NOTES_SCHEMA_ID)
    expect(schema.type).toBe('array')
  })
})
