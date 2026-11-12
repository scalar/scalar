import { describe, expect, it } from 'vitest'

import { parseSource } from './parse-source'

describe('parse-source', () => {
  it('parses YAML fields sharing a type alias more than 50 times', () => {
    const source = [
      'type: record',
      'name: Example',
      'fields:',
      '  - { name: first, type: &shared string }',
      ...Array.from({ length: 200 }, (_, index) => `  - { name: field${index}, type: *shared }`),
    ].join('\n')

    expect(parseSource(source, 'yaml')).toStrictEqual({
      type: 'record',
      name: 'Example',
      fields: [
        { name: 'first', type: 'string' },
        ...Array.from({ length: 200 }, (_, index) => ({ name: `field${index}`, type: 'string' })),
      ],
    })
  })

  it('rejects excessive YAML alias expansion', () => {
    const source = [
      'l0: &l0 value',
      ...Array.from(
        { length: 5 },
        (_, index) => `l${index + 1}: &l${index + 1} [${Array(10).fill(`*l${index}`).join(', ')}]`,
      ),
    ].join('\n')

    expect(() => parseSource(source, 'yaml')).toThrow('Excessive alias count')
  })
})
