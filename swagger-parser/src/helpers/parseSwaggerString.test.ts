import { describe, expect, it } from 'vitest'

import exampleInput from './fixtures/petstore.json'
import exampleYaml from './fixtures/swagger.yaml'
import { parseSwaggerString } from './parseSwaggerString'

describe('parseSwaggerString', () => {
  it('parses JSON objects', async () => {
    const result = await parseSwaggerString(exampleInput)

    expect(result).not.toBeNull()
    expect(result).toMatchSnapshot()
  })

  it('parses JSON objects and returns a promise', () => {
    parseSwaggerString(exampleInput).then((result) => {
      expect(result).not.toBeNull()
      expect(result).toMatchSnapshot()
    })
  })

  it('executes the catch callback on error', async () => {
    await parseSwaggerString('FOOBAR').catch((error) => {
      expect(error).not.toBeNull()
      expect(error).toBe(
        'unable to parse JSON. Error spec type not supported by libopenapi, sorry occurred',
      )
    })
  })

  it('parses JSON strings', async () => {
    const result = await parseSwaggerString(JSON.stringify(exampleInput))

    expect(result).not.toBeNull()
    expect(result).toMatchSnapshot()
  })

  it.skip('parses Yaml strings', async () => {
    const result = await parseSwaggerString(exampleYaml)

    expect(result).not.toBeNull()
    expect(result).toMatchSnapshot()
  })

  it('throws an error', async () => {
    expect(async () => {
      await parseSwaggerString('FOOBAR')
    }).rejects.toThrowError()
  })
})
