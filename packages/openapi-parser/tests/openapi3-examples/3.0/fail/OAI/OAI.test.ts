import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src/index'
import apiWithExamples from './api-with-examples.yaml?raw'

// TODO: The example is in the `fail` folder, but I don't know why it's supposed to fail.
// I think the YAML is just wrong ("YAMLException: deficient indentation"), but we can't test this with an import.
describe.todo('OAI', () => {
  it('apiWithExamples', async () => {
    const result = await validate(apiWithExamples)

    expect(result.errors?.[0]?.message).toBe(`something went wrong`)
    expect(result.valid).toBe(false)
  })
})
