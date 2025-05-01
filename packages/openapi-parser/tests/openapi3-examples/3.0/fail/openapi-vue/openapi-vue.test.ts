import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src/index'
import edit1 from './edit1.json'
import openApiVue from './openapi.json'

describe('openapi-vue', () => {
  it('openapi', async () => {
    const result = await validate(openApiVue)

    // TODO: SwaggerUI has a more helpful error message:
    //
    // Semantic error at paths./pet.post.requestBody.content.application/json.schema.$ref
    // requestBody schema $refs must point to a position where a Schema Object can be legally placed
    // …
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.valid).toBe(false)
  })

  it('edit1', async () => {
    const result = await validate(edit1)

    // TODO: SwaggerUI has a more helpful error message:
    //
    // Structural error at paths./pet.post.requestBody.content.application/xml.examples
    // should be object
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.valid).toBe(false)
  })
})
