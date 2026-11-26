import { describe, expect, it } from 'vitest'

import { getStructuredBodyCodec } from './structured-body-codec'

describe('structured-body-codec', () => {
  it('parses a YAML request body containing many aliases', () => {
    const document = [
      'shared: &shared value',
      ...Array.from({ length: 200 }, (_, index) => `item${index}: *shared`),
    ].join('\n')

    expect(getStructuredBodyCodec('application/yaml')?.parse(document)).toStrictEqual({
      shared: 'value',
      ...Object.fromEntries(Array.from({ length: 200 }, (_, index) => [`item${index}`, 'value'])),
    })
  })

  it('rejects excessive YAML alias expansion', () => {
    const document = [
      'l0: &l0 value',
      ...Array.from(
        { length: 5 },
        (_, index) => `l${index + 1}: &l${index + 1} [${Array(10).fill(`*l${index}`).join(', ')}]`,
      ),
    ].join('\n')

    expect(() => getStructuredBodyCodec('application/yaml')?.parse(document)).toThrow('Excessive alias count')
  })
})
