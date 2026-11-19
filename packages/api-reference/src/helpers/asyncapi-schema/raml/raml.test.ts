// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readSchema } from '../read-schema'
import { readRaml } from './raml'

const raml = 'application/raml+yaml;version=1.0'

describe('raml', () => {
  it('rejects excessive YAML alias expansion', () => {
    const source = [
      'l0: &l0 value',
      ...Array.from(
        { length: 5 },
        (_, index) => `l${index + 1}: &l${index + 1} [${Array(10).fill(`*l${index}`).join(', ')}]`,
      ),
    ].join('\n')

    expect(() => readRaml(source)).toThrow('Excessive alias count')
  })

  it('renders properties sharing a YAML type alias more than 50 times', () => {
    const source = [
      'type: object',
      'properties:',
      '  first: &shared string',
      ...Array.from({ length: 200 }, (_, index) => `  field${index}: *shared`),
    ].join('\n')

    expect(readSchema(raml, source)?.nodes[0]?.children?.at(-1)).toStrictEqual({
      name: 'field199',
      type: 'string',
      required: true,
    })
  })

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
