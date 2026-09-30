import { describe, expect, it } from 'vitest'

import { asyncApiChunkGroups } from './asyncapi-chunk-groups'

describe('asyncapi-chunk-groups', () => {
  it('groups schemas consumed together without including unrelated schemas', () => {
    const groups = asyncApiChunkGroups({
      components: {
        messages: {
          Event: { payload: { allOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }] } },
        },
        schemas: { A: { type: 'string' }, B: { type: 'number' }, Other: { type: 'boolean' } },
      },
    })
    expect(groups.get('components-schemas/A')).toBe(groups.get('components-schemas/B'))
    expect(groups.get('components-schemas/A')).not.toBe(groups.get('components-schemas/Other'))
  })

  it('splits components consumed together at the group size limit', () => {
    const groups = asyncApiChunkGroups({
      components: {
        messages: {
          Event: { payload: { allOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }] } },
        },
        schemas: { A: { description: 'a'.repeat(40 * 1024) }, B: { description: 'b'.repeat(40 * 1024) } },
      },
    })
    expect(groups.get('components-schemas/A')).not.toBe(groups.get('components-schemas/B'))
  })
})
