import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src'
import { downloadFileToMemory } from '../../../../utils/downloadFileGcp'

// import edit1 from './edit1.json'
// import openApiVue from './openapi.json'

const bucketName = 'test-specifications'
const filePath = (filename: string) =>
  `openapi3-examples/3.0/fail/openapi-vue/${filename}`

describe('openapi-vue', () => {
  it('openapi', async () => {
    const openApiVue = await downloadFileToMemory(
      bucketName,
      filePath('openapi.json'),
    )

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
    const edit1 = await downloadFileToMemory(bucketName, filePath('edit1.json'))
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
