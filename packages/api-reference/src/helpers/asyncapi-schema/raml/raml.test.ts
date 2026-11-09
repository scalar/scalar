// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readSchema } from '../read-schema'

const raml = 'application/raml+yaml;version=1.0'

describe('raml', () => {
  it('preserves RAML required overrides and array/union precedence', () => {
    expect(
      readSchema(
        raml,
        'type: object\nproperties:\n  name?: string\n  labels:\n    type: (string | nil)[]\n    required: false',
      ),
    ).toStrictEqual({
      nodes: [
        {
          name: 'Schema',
          type: 'object',
          children: [
            { name: 'name', type: 'string', required: false },
            {
              name: 'labels',
              type: 'array',
              required: false,
              children: [
                {
                  name: 'Items',
                  type: 'union',
                  children: [
                    { name: 'Variant 1', type: 'string' },
                    { name: 'Variant 2', type: 'nil' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
    expect(
      readSchema(raml, { properties: { 'id?': { type: 'integer', required: true, minimum: 0 } } })?.nodes[0]?.children,
    ).toStrictEqual([{ name: 'id?', type: 'integer', required: true, details: ['minimum: 0'] }])
  })

  it('reads a RAML DataType fragment and preserves facets', () => {
    expect(
      readSchema(raml, '#%RAML 1.0 DataType\ntype: string\ndescription: Identifier\npattern: "[a-z]+"'),
    ).toStrictEqual({
      nodes: [{ name: 'Schema', type: 'string', description: 'Identifier', details: ['pattern: "[a-z]+"'] }],
    })
  })
})
