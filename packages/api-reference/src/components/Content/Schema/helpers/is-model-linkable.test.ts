import { describe, expect, it } from 'vitest'

import type { ModelLinkOptions } from './is-model-linkable'
import { isModelLinkable } from './is-model-linkable'

describe('isModelLinkable', () => {
  const documentWith = (schemas: Record<string, unknown>): ModelLinkOptions['document'] =>
    ({ components: { schemas } }) as ModelLinkOptions['document']

  it('links a visible model', () => {
    const options = { document: documentWith({ Planet: { type: 'object' } }) }
    expect(isModelLinkable('Planet', options)).toBe(true)
  })

  it('does not link when there is no schema key', () => {
    expect(isModelLinkable(null, {})).toBe(false)
    expect(isModelLinkable(undefined, {})).toBe(false)
    expect(isModelLinkable('', {})).toBe(false)
  })

  it('does not link when the whole models section is hidden', () => {
    const options = { hideModels: true, document: documentWith({ Planet: { type: 'object' } }) }
    expect(isModelLinkable('Planet', options)).toBe(false)
  })

  it('does not link a model hidden via x-internal', () => {
    const options = { document: documentWith({ Planet: { type: 'object', 'x-internal': true } }) }
    expect(isModelLinkable('Planet', options)).toBe(false)
  })

  it('does not link a model hidden via x-scalar-ignore', () => {
    const options = { document: documentWith({ Planet: { type: 'object', 'x-scalar-ignore': true } }) }
    expect(isModelLinkable('Planet', options)).toBe(false)
  })

  it('honors x-internal set alongside a $ref wrapper', () => {
    const options = {
      document: documentWith({
        Planet: { '$ref': '#/components/schemas/Base', '$ref-value': { type: 'object' }, 'x-internal': true },
      }),
    }
    expect(isModelLinkable('Planet', options)).toBe(false)
  })

  it('links when the model is not found in the document', () => {
    expect(isModelLinkable('Missing', { document: documentWith({}) })).toBe(true)
    expect(isModelLinkable('Missing', {})).toBe(true)
  })
})
