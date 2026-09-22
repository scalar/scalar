import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src/index'
import edit1 from './edit1.json'
import openApiVue from './openapi.json'

// Both of the files tested here are absolutely full of syntax errors,
// I'm not sure if these are effective tests, but if they are we can look at correcting the test files.
describe.skip('openapi-vue', () => {
  it('openapi', async () => {
    const result = await validate(openApiVue)

    // This file uses invalid properties in components:
    // - components.definitions (should be components.schemas in OpenAPI 3.0)
    // - components.securityDefinitions (should be components.securitySchemes in OpenAPI 3.0)
    // The validator correctly catches these during schema validation
    const componentsErrors = result.errors.filter((e) => e.path?.includes('/components'))
    expect(componentsErrors.length).toBeGreaterThanOrEqual(2)
    expect(componentsErrors.some((e) => e.message.includes('definitions'))).toBe(true)
    expect(componentsErrors.some((e) => e.message.includes('securityDefinitions'))).toBe(true)
    expect(result.valid).toBe(false)
  })

  it('edit1', async () => {
    const result = await validate(edit1)

    // This file has invalid securityDefinitions in components
    // (should be securitySchemes in OpenAPI 3.0)
    const componentsErrors = result.errors.filter((e) => e.path?.includes('/components'))
    expect(componentsErrors.length).toBeGreaterThanOrEqual(1)
    expect(componentsErrors.some((e) => e.message.includes('securityDefinitions'))).toBe(true)
    expect(result.valid).toBe(false)
  })
})
