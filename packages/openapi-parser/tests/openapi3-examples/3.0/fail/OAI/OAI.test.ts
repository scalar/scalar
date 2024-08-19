import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src'
import { downloadFileToMemory } from '../../../../utils/downloadFileGcp'

const bucketName = 'test-specifications'
const filePath = (filename: string) =>
  `openapi3-examples/3.0/fail/oai/${filename}`

// TODO: The example is in the `fail` folder, but I don’t know why it’s supposed to fail.
// I think the YAML is just wrong ("YAMLException: deficient indentation"), but we can’t test this with an import.
describe.todo('OAI', () => {
  it('apiWithExamples', async () => {
    const apiWithExamples = await downloadFileToMemory(
      bucketName,
      filePath('api-with-examples.yaml'),
    )
    const result = await validate(apiWithExamples)

    expect(result.errors?.[0]?.message).toBe(`something went wrong`)
    expect(result.valid).toBe(false)
  })
})
