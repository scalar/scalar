import { describe, expect, it } from 'vitest'

import { resolveSchemaRenderOptions } from './async-api-render-options'

describe('resolveSchemaRenderOptions', () => {
  it('fills in defaults when no options are provided', () => {
    expect(resolveSchemaRenderOptions()).toEqual({
      orderRequiredPropertiesFirst: false,
      orderSchemaPropertiesBy: 'preserve',
      expandAllSchemaProperties: false,
      schemaLayout: 'legacy',
      schemaKeyboardNav: false,
    })
  })

  it('keeps the provided values', () => {
    expect(
      resolveSchemaRenderOptions({
        orderRequiredPropertiesFirst: true,
        orderSchemaPropertiesBy: 'alpha',
        expandAllSchemaProperties: true,
        schemaLayout: 'tree',
        schemaKeyboardNav: true,
      }),
    ).toEqual({
      orderRequiredPropertiesFirst: true,
      orderSchemaPropertiesBy: 'alpha',
      expandAllSchemaProperties: true,
      schemaLayout: 'tree',
      schemaKeyboardNav: true,
    })
  })
})
