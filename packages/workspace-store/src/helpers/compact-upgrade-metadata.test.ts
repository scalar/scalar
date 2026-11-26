import { describe, expect, it } from 'vitest'

import { compactUpgradeMetadata } from './compact-upgrade-metadata'

describe('compact-upgrade-metadata', () => {
  it('keeps exceptional relocations while dropping redundant descendant mappings', () => {
    const parent = { source: ['definitions', 'Item'], output: ['components', 'schemas', 'Item'] }
    const exceptional = {
      source: ['definitions', 'Item', 'example'],
      output: ['components', 'schemas', 'Item', 'examples', '0'],
    }
    const document = {
      components: { schemas: { Remote: { $ref: './remote.json' } } },
      'x-scalar-upgrade': {
        from: '2.0',
        locations: [
          parent,
          { source: ['definitions', 'Item'], output: ['components', 'schemas', 'OtherCopy'] },
          {
            source: ['definitions', 'Item', 'properties', 'name'],
            output: ['components', 'schemas', 'Item', 'properties', 'name'],
          },
          {
            source: ['definitions', 'Item', 'properties', 'name'],
            output: ['components', 'schemas', 'OtherCopy', 'properties', 'name'],
          },
          exceptional,
          {
            source: ['definitions', 'Item', 'example', 'name'],
            output: ['components', 'schemas', 'Item', 'examples', '0', 'name'],
          },
        ],
      },
    }
    compactUpgradeMetadata(document)
    expect(document['x-scalar-upgrade']).toStrictEqual({ from: '2.0', locations: [parent, exceptional] })
  })

  it('removes internal bookkeeping without changing literal extension payloads', () => {
    const document: Record<string, unknown> = {
      openapi: '3.1.1',
      paths: {},
      'x-scalar-upgrade': { from: '2.0', locations: [], contexts: [] },
      'x-custom': { 'x-scalar-upgrade': { value: 'authored' } },
    }
    compactUpgradeMetadata(document)
    expect(document).toStrictEqual({
      openapi: '3.1.1',
      paths: {},
      'x-custom': { 'x-scalar-upgrade': { value: 'authored' } },
    })
  })
})
