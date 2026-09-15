import { describe, expect, it } from 'vitest'

import { explainComponentReferences } from './explain-component-references'

describe('explain-component-references', () => {
  it.each([
    '#/components/schemas/User/properties/namn med space',
    '#/components/schemas/%55ser/properties/namn med space',
    '#/components/schemas/User%2Fproperties/namn med space',
    '#/components/schemas/Bad%ZZ',
    '#/definitions/Användare',
    'other.yaml#/components/schemas/Användare',
  ])('does not blame a component name without evidence: %s', (reference) => {
    const errors = [{ message: 'Invalid reference', path: '/schema/$ref' }]

    expect(explainComponentReferences(errors, { openapi: '3.1.0', schema: { $ref: reference } })).toStrictEqual(errors)
  })

  it('does not add OpenAPI guidance to another specification', () => {
    const errors = [{ message: 'Invalid reference', path: '/schema/$ref' }]

    expect(
      explainComponentReferences(errors, {
        asyncapi: '3.0.0',
        schema: { $ref: '#/components/schemas/Användare' },
      }),
    ).toStrictEqual(errors)
  })

  it('preserves unrelated errors', () => {
    const errors = [
      { message: 'Invalid input' },
      { message: 'Invalid type', path: '/schema' },
      { message: 'Invalid type', path: '/schema/$ref' },
      { message: 'Invalid type', path: ['schema', '$ref'] },
    ]

    expect(explainComponentReferences(errors, { openapi: '3.0.3', schema: { $ref: 123 } })).toStrictEqual(errors)
  })

  it('finds a reference through escaped and empty property names', () => {
    const errors = [{ message: 'Invalid reference.', path: '/a~1b~0c%//$ref' }]
    const result = explainComponentReferences(errors, {
      openapi: '3.0.3',
      'a/b~c%': { '': { $ref: '#/components/schemas/Anv%C3%A4ndare/properties/has space' } },
    })

    expect(result).toStrictEqual([
      {
        message:
          'Invalid reference. OpenAPI component names must match "^[a-zA-Z0-9._-]+$". Rename the component and update its references; percent-encoding alone does not fix the component name.',
        path: '/a~1b~0c%//$ref',
      },
    ])
    expect(errors).toStrictEqual([{ message: 'Invalid reference.', path: '/a~1b~0c%//$ref' }])
  })
})
