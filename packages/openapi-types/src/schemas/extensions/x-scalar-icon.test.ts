import { describe, expect, it } from 'vitest'
import { XScalarIconSchema } from './x-scalar-icon'

describe('XScalarIconSchema', () => {
  it('allows any string value', () => {
    const result = XScalarIconSchema.parse({
      'x-scalar-icon': 'foobar',
    })

    expect(result).toEqual({ 'x-scalar-icon': 'foobar' })
  })

  it('has a default value', () => {
    expect(XScalarIconSchema.parse({})).toEqual({ 'x-scalar-icon': 'interface-content-folder' })
  })
})
