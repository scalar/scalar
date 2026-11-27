import { describe, expect, it } from 'vitest'

import { createSpecificationValidator } from './create-specification-validator'

const validate = createSpecificationValidator({
  schemas: { '1.0': { type: 'object' } },
  detectVersion: () => '1.0' as const,
  errors: { emptyOrInvalid: 'Invalid document', versionNotSupported: 'Unsupported version' },
})

describe('create-specification-validator', () => {
  it('parses YAML with many aliases before validating the specification', () => {
    const document = [
      'shared: &shared value',
      ...Array.from({ length: 200 }, (_, index) => `item${index}: *shared`),
    ].join('\n')
    const result = validate(document)

    expect(result.valid).toBe(true)
    expect(result.schema?.item199).toBe('value')
    expect(result.errors).toStrictEqual([])
  })

  it('reports excessive YAML alias expansion and respects throwOnError', () => {
    const document = [
      'l0: &l0 value',
      ...Array.from(
        { length: 5 },
        (_, index) => `l${index + 1}: &l${index + 1} [${Array(10).fill(`*l${index}`).join(', ')}]`,
      ),
    ].join('\n')

    const result = validate(document)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toContain('Excessive alias count')
    expect(() => validate(document, { throwOnError: true })).toThrow('Excessive alias count')
  })
})
